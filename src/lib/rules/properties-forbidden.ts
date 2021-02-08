import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonObject;

export function validator({ lines, jsonObjectAst, parameter: forbiddenProperties }: RuleContext): RuleResult {
	if (!Array.isArray(forbiddenProperties)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}
	if (jsonObjectAst.members === undefined) {
		return true;
	}

	for (const { key } of jsonObjectAst.members) {
		if (forbiddenProperties.includes(key.value)) {
			return new RuleError(`property "${key.value}" is forbidden`, key.pos, lines);
		}
	}

	return true;
}
