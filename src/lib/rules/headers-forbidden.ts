import { findMatchLocation } from '../helpers/text';
import { parseMarkdownHeaders, getMarkdownHeaders, isMatchingHeader } from '../helpers/markdown';
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

	for (const header of getMarkdownHeaders(contents)) {
		if (forbiddenHeaders.some(forbiddenHeader => isMatchingHeader(header, forbiddenHeader))) {
			return new RuleError(`header "${header.text}" is forbidden`, findMatchLocation(lines, header.fullMatch, header.char), lines);
		}
	}

	return true;
}
