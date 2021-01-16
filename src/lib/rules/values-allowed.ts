import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonValue;

export function validator({ lines, jsonValue, jsonAst, parameter: allowedValues }: RuleContext): RuleResult {
	if (!Array.isArray(allowedValues)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	return allowedValues.some(value => jsonValue === value) ? true : new RuleError("value doesn't match any of the allowed values", jsonAst.pos, lines);
}
