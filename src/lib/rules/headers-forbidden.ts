import { findMatchLocation } from '../helpers/text';
import { parseMarkdownHeaders, getMarkdownHeaders } from '../helpers/markdown';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ contents, lines, parameter: rawHeaders }: RuleContext): RuleResult {
	if (!Array.isArray(rawHeaders)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const forbiddenHeaders = parseMarkdownHeaders(rawHeaders);
	if (forbiddenHeaders instanceof Error) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const { text: headerText, level: headerLevel, char, fullMatch } of getMarkdownHeaders(contents)) {
		if (forbiddenHeaders.some(({ text, level }) => headerText === text && (headerLevel === level || level === 0))) {
			return new RuleError(`header "${headerText}" is forbidden`, findMatchLocation(lines, fullMatch, char), lines);
		}
	}

	return true;
}
