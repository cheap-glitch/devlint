import { parseMarkdownHeaders, getMarkdownHeaders, isMatchingHeader } from '../helpers/markdown';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ contents, parameter: rawHeaders }: RuleContext): RuleResult {
	if (!Array.isArray(rawHeaders)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const requiredHeaders = parseMarkdownHeaders(rawHeaders);
	if (requiredHeaders instanceof Error) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const headers = getMarkdownHeaders(contents);

	for (const requiredHeader of requiredHeaders) {
		if (!headers.some(header => isMatchingHeader(header, requiredHeader))) {
			return new RuleError(`required header "${requiredHeader.text}" is missing`);
		}
	}

	return true;
}
