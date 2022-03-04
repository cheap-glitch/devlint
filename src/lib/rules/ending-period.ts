import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.JsonString;

export function validator({ lines, jsonString: text, jsonAst, parameter: required }: RuleContext): RuleResult {
	if (required !== undefined && typeof required !== 'boolean') {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	if (text.endsWith('.') !== (required ?? true)) {
		return new RuleError(`string ${required ?? true ? "doesn't end" : 'ends'} with a period`, jsonAst.pos, lines);
	}

	return true;
}
