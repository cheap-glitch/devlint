import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.JsonObject;

export function validator({ lines, jsonObjectAst, parameter: allowedProperties }: RuleContext): RuleResult {
	if (!Array.isArray(allowedProperties)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}
	if (jsonObjectAst.members === undefined) {
		return true;
	}

	for (const { key } of jsonObjectAst.members) {
		if (!allowedProperties.includes(key.value)) {
			return new RuleError(`property "${key.value}" is not allowed`, key.pos, lines);
		}
	}

	return true;
}
