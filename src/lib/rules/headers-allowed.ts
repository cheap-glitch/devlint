import { findMatchLocation } from '../helpers/text';
import { parseMarkdownHeaders, getMarkdownHeaders, isMatchingHeader } from '../helpers/markdown';
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

	for (const header of getMarkdownHeaders(contents)) {
		if (!allowedHeaders.some(allowedHeader => isMatchingHeader(header, allowedHeader))) {
			return new RuleError(`header "${header.text}" is not allowed`, findMatchLocation(lines, header.fullMatch, header.char), lines);
		}
	}

	return true;
}
