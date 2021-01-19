import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonString;

export function validator({ lines, jsonString: text, jsonAst, parameter: required }: RuleContext): RuleResult {
	if (typeof required !== 'boolean') {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	if (text.endsWith('.') !== required) {
		return new RuleError(`string ${required ? "doesn't end" : 'ends'} with a period`, jsonAst?.pos, lines);
	}

	return true;
}
