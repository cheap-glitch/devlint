import { isJsonObject } from '../helpers/json';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonValue;

export function validator({ lines, jsonValue, jsonAst, parameter: allowedTypes }: RuleContext): RuleResult {
	if (!Array.isArray(allowedTypes)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const type of allowedTypes) {
		if (typeof type !== 'string') {
			return new RuleError(RuleErrorType.InvalidParameter);
		}

		switch (type) {
			case 'null':
				if (typeof jsonValue === null) {
					return true;
				}
				break;

			case 'boolean':
			case 'number':
			case 'string':
				if (typeof jsonValue === type) {
					return true;
				}
				break;

			case 'object':
				if (isJsonObject(jsonValue)) {
					return true;
				}
				break;

			case 'array':
				if (Array.isArray(jsonValue)) {
					return true;
				}
				break;

			default: return new RuleError(RuleErrorType.InvalidParameter);
		}
	}

	return new RuleError("type of value isn't one of the allowed types", jsonAst.pos, lines);
}
