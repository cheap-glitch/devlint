import { findMatchLocation } from '../helpers/text';
import { getMarkdownHeaders } from '../helpers/markdown';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ contents, lines, parameter: allowedHeaders }: RuleContext): RuleResult {
	if (!Array.isArray(allowedHeaders)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const { text: headerText, char, fullMatch } of getMarkdownHeaders(contents)) {
		if (!allowedHeaders.includes(headerText)) {
			return new RuleError(`header "${headerText}" is not allowed`, findMatchLocation(lines, fullMatch, char), lines);
		}
	}

	return true;
}
