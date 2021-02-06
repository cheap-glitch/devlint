import { findMatchLocation, getMarkdownHeaders } from './helpers';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ contents, lines, parameter: forbiddenHeaders }: RuleContext): RuleResult {
	if (!Array.isArray(forbiddenHeaders)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const { text: headerText, index, fullMatch } of getMarkdownHeaders(contents)) {
		if (forbiddenHeaders.includes(headerText)) {
			return new RuleError(`header "${headerText}" is forbidden`, findMatchLocation(lines, fullMatch, index), lines);
		}
	}

	return true;
}
