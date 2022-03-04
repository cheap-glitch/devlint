import { matchJsonValues, formatJsonValue } from '../helpers/json';
import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.JsonArray;

export function validator({ lines, jsonArray, jsonArrayAst, parameter: requiredElements }: RuleContext): RuleResult {
	if (!Array.isArray(requiredElements)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const requiredElement of requiredElements) {
		if (jsonArray.some(element => matchJsonValues(requiredElement, element))) {
			continue;
		}

		return new RuleError(`required element ${formatJsonValue(requiredElement)} is missing`, jsonArrayAst.pos, lines);
	}

	return true;
}
