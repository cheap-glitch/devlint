import { joinPropertyPathSegments } from '../helpers/properties';
import { isJsonObject, tryGettingJsonAstProperty, matchJsonValues } from '../helpers/json';
import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.JsonObject;

export function validator({ lines, jsonObject, jsonObjectAst, parameter: model }: RuleContext): RuleResult {
	if (!isJsonObject(model)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const result = matchJsonValues(model, jsonObject, []);
	if (Array.isArray(result)) {
		const jsonValueAst = tryGettingJsonAstProperty(jsonObjectAst, result);

		return new RuleError(`failed to match property "${joinPropertyPathSegments(result)}"`, jsonValueAst?.pos, lines);
	}

	return true;
}
