import { parseMarkdownHeaders, getMarkdownHeaders } from '../helpers/markdown';
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

	for (const { text, level } of requiredHeaders) {
		if (!headers.some(header => header.text === text && (header.level === level || level === 0))) {
			return new RuleError(`required header "${text}" is missing`);
		}
	}

	return true;
}
