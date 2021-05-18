import { jsonTypes, getJsonValueType } from '../helpers/json';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonValue;

export function validator({ lines, jsonValue, jsonAst, parameter: allowedTypes }: RuleContext): RuleResult {
	if (!Array.isArray(allowedTypes) || allowedTypes.some(type => typeof type !== 'string' || !jsonTypes.includes(type))) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const valueType = getJsonValueType(jsonValue);

	return allowedTypes.includes(valueType) ? true : new RuleError(`"${valueType}" type is not allowed`, jsonAst.pos, lines);
}
