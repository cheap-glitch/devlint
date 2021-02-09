import { getMarkdownHeaders } from '../helpers/markdown';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ contents, parameter: requiredHeaders }: RuleContext): RuleResult {
	if (!Array.isArray(requiredHeaders)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const headers = getMarkdownHeaders(contents);

	for (const requiredHeader of requiredHeaders) {
		if (typeof requiredHeader !== 'string') {
			return new RuleError(RuleErrorType.InvalidParameter);
		}

		if (!headers.some(header => header.text === requiredHeader)) {
			return new RuleError(`required header "${requiredHeader}" is missing`);
		}
	}

	return true;
}
