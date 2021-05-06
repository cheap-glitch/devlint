import { matchJsonValues } from '../helpers/json';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonArray;

export function validator({ lines, jsonArray, jsonArrayAst, parameter: requiredElements }: RuleContext): RuleResult {
	if (!Array.isArray(requiredElements)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const requiredElement of requiredElements) {
		if (jsonArray.some(element => matchJsonValues(requiredElement, element))) {
			continue;
		}

		return new RuleError(`required element "${JSON.stringify(requiredElement)}" is missing`, jsonArrayAst.pos, lines);
	}

	return true;
}
