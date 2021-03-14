import { findMatchLocation } from '../helpers/text';
import { getMarkdownHeaders } from '../helpers/markdown';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ contents, lines, parameter: forbiddenHeaders }: RuleContext): RuleResult {
	if (!Array.isArray(forbiddenHeaders)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const { text: headerText, char, fullMatch } of getMarkdownHeaders(contents)) {
		if (forbiddenHeaders.includes(headerText)) {
			return new RuleError(`header "${headerText}" is forbidden`, findMatchLocation(lines, fullMatch, char), lines);
		}
	}

	return true;
}
