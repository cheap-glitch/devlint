import { findMatchLocation } from '../helpers/text';
import { parseMarkdownHeaders, getMarkdownHeaders } from '../helpers/markdown';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ contents, lines, parameter: rawHeaders }: RuleContext): RuleResult {
	if (!Array.isArray(rawHeaders)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const allowedHeaders = parseMarkdownHeaders(rawHeaders);
	if (allowedHeaders instanceof Error) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const { text: headerText, level: headerLevel, char, fullMatch } of getMarkdownHeaders(contents)) {
		if (!allowedHeaders.some(({ text, level }) => headerText === text && (headerLevel === level || level === 0))) {
			return new RuleError(`header "${headerText}" is not allowed`, findMatchLocation(lines, fullMatch, char), lines);
		}
	}

	return true;
}
