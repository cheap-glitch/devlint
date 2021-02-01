import { checkValueType } from './helpers';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonValue;

export function validator({ lines, jsonValue, jsonAst, parameter: allowedTypes }: RuleContext): RuleResult {
	if (!Array.isArray(allowedTypes)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const type of allowedTypes) {
		if (typeof type !== 'string') {
			return new RuleError(RuleErrorType.InvalidParameter);
		}

		const result = checkValueType(jsonValue, type);
		if (result !== false) {
			return result;
		}
	}

	return new RuleError("type of value isn't one of the allowed types", jsonAst.pos, lines);
}
