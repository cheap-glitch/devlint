import { checkStringCase } from './helpers';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonString;

export function validator({ lines, jsonString: testedString, jsonAst, parameter: forbiddenCaseStyles }: RuleContext): RuleResult {
	if (!Array.isArray(forbiddenCaseStyles)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const style of forbiddenCaseStyles) {
		if (typeof style !== 'string') {
			return new RuleError(RuleErrorType.InvalidParameter);
		}

		const result = checkStringCase(testedString, style);
		if (result instanceof Error) {
			return result;
		}
		if (result === true) {
			return new RuleError('case style is forbidden', jsonAst?.pos, lines);
		}
	}

	return true;
}
