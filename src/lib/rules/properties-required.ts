import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonObject;

export function validator({ lines, jsonObject, jsonObjectAst, parameter: requiredProperties }: RuleContext): RuleResult {
	if (requiredProperties === undefined || !Array.isArray(requiredProperties) || requiredProperties.some(property => typeof property !== 'string')) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const missingProperty = requiredProperties.find(property => typeof property !== 'string' || !Object.keys(jsonObject).includes(property));
	if (missingProperty !== undefined) {
		return new RuleError(`required property "${missingProperty}" is missing`, jsonObjectAst.pos, lines);
	}

	return true;
}
