import { quoteJsonString } from '../helpers/text';
import { matchJsonValues } from '../helpers/json';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonValue;

export function validator({ lines, jsonValue, jsonAst, parameter: forbiddenValues }: RuleContext): RuleResult {
	if (!Array.isArray(forbiddenValues)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	if (forbiddenValues.some(model => matchJsonValues(model, jsonValue))) {
		return new RuleError(`value ${quoteJsonString(JSON.stringify(jsonValue))} is forbidden`, jsonAst.pos, lines);
	}

	return true;
}
