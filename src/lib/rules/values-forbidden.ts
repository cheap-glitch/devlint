import { matchJsonValues, formatJsonValue } from '../helpers/json';
import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.JsonValue;

export function validator({ lines, jsonValue, jsonAst, parameter: forbiddenValues }: RuleContext): RuleResult {
	if (!Array.isArray(forbiddenValues)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	if (forbiddenValues.some(model => matchJsonValues(model, jsonValue))) {
		return new RuleError(`value ${formatJsonValue(jsonValue)} is forbidden`, jsonAst.pos, lines);
	}

	return true;
}
