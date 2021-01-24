import { matchJsonValues } from './helpers';
import { joinPropertiesPathSegments } from '../helpers/properties';
import { isJsonObject, tryGettingJsonAstProperty } from '../helpers/json';

import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonObject;

export function validator({ lines, jsonObject, jsonObjectAst, parameter: model }: RuleContext): RuleResult {
	if (!isJsonObject(model)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const result = matchJsonValues(model, jsonObject);
	if (Array.isArray(result)) {
		const jsonValueAst = tryGettingJsonAstProperty(jsonObjectAst, result);

		return new RuleError(
			`failed to match property "${joinPropertiesPathSegments(result)}"`,
			jsonValueAst ? { ...jsonValueAst.pos.start } : undefined,
			jsonValueAst ? { ...jsonValueAst.pos.end   } : undefined,
			lines
		);
	}

	return true;
}
