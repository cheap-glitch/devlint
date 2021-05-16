import { matchStrings } from '../helpers/text';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ lines, parameter: requiredLines }: RuleContext): RuleResult {
	if (!Array.isArray(requiredLines)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const requiredLine of requiredLines) {
		if (typeof requiredLine !== 'string') {
			return new RuleError(RuleErrorType.InvalidParameter);
		}

		const index = lines.findIndex(line => matchStrings(requiredLine, line.text));
		if (index === -1) {
			return new RuleError(`required line "${requiredLine}" is missing`);
		}
	}

	return true;
}
