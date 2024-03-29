import { matchJsonValues, formatJsonValue } from '../helpers/json';
import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.JsonValue;

export function validator({ lines, jsonValue, jsonAst, parameter: allowedValues }: RuleContext): RuleResult {
	if (!Array.isArray(allowedValues)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	if (allowedValues.some(model => matchJsonValues(model, jsonValue))) {
		return true;
	}

	return new RuleError(`value ${formatJsonValue(jsonValue)} is not allowed`, jsonAst.pos, lines);
}
