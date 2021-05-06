import { matchJsonValues } from '../helpers/json';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonArray;

export function validator({ lines, jsonArray, jsonArrayAst, parameter: forbiddenElements }: RuleContext): RuleResult {
	if (!Array.isArray(forbiddenElements)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const [index, element] of jsonArray.entries()) {
		if (forbiddenElements.some(forbiddenElement => matchJsonValues(forbiddenElement, element))) {
			return new RuleError(`element "${JSON.stringify(element)}" is forbidden`, jsonArrayAst.elements?.[index]?.pos, lines);
		}
	}

	return true;
}
