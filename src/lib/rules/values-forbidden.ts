import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonValue;

export function validator({ lines, jsonValue, jsonAst, parameter: forbiddenValues }: RuleContext): RuleResult {
	if (!Array.isArray(forbiddenValues)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	return forbiddenValues.every(value => jsonValue !== value) ? true : new RuleError('value is forbidden', jsonAst.pos, lines);
}
