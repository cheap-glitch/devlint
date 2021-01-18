import { matchJsonPrimitives } from './helpers';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonValue;

export function validator({ lines, jsonValue, jsonAst, parameter: forbiddenValues }: RuleContext): RuleResult {
	if (!Array.isArray(forbiddenValues)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const value of forbiddenValues) {
		if (matchJsonPrimitives(value, jsonValue)) {
			return new RuleError('value is forbidden', jsonAst.pos, lines);
		}
	}

	return true;
}
