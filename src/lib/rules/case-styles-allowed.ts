import { checkStringCase } from '../helpers/text';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonString;

export function validator({ lines, jsonString: testedString, jsonAst, parameter: allowedCaseStyles }: RuleContext): RuleResult {
	if (!Array.isArray(allowedCaseStyles)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const style of allowedCaseStyles) {
		if (typeof style !== 'string') {
			return new RuleError(RuleErrorType.InvalidParameter);
		}

		const result = checkStringCase(testedString, style);
		if (result !== false) {
			return result;
		}
	}

	return new RuleError("case style doesn't match any of the allowed styles", jsonAst.pos, lines);
}
