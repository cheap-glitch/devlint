import { jsonTypes, getJsonValueType } from '../helpers/json';
import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.JsonValue;

export function validator({ lines, jsonValue, jsonAst, parameter: forbiddenTypes }: RuleContext): RuleResult {
	if (!Array.isArray(forbiddenTypes) || forbiddenTypes.some(type => typeof type !== 'string' || !jsonTypes.includes(type))) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const valueType = getJsonValueType(jsonValue);

	return forbiddenTypes.includes(valueType) ? new RuleError(`"${valueType}" type is forbidden`, jsonAst.pos, lines) : true;
}
