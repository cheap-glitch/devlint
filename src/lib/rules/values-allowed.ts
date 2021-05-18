import { quoteJsonString } from '../helpers/text';
import { matchJsonValues } from '../helpers/json';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonValue;

export function validator({ lines, jsonValue, jsonAst, parameter: allowedValues }: RuleContext): RuleResult {
	if (!Array.isArray(allowedValues)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	if (allowedValues.some(model => matchJsonValues(model, jsonValue))) {
		return true;
	}

	return new RuleError(`value ${quoteJsonString(JSON.stringify(jsonValue))} is not allowed`, jsonAst.pos, lines);
}
