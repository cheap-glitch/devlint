import { JsonString as JsonStringAst } from 'jsonast';

import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonObject;

export function validator({ lines, jsonObjectAst, parameter: ordering }: RuleContext): RuleResult {
	if (ordering === undefined || typeof ordering !== 'string') {
		return new RuleError(RuleErrorType.InvalidParameter);
	}
	if (jsonObjectAst.members === undefined) {
		return true;
	}

	const compare = (new Intl.Collator('en', { numeric: true })).compare;

	let errorChecker;
	switch (ordering) {
		case 'alphabetical':
			errorChecker = (key: JsonStringAst, previousKey: JsonStringAst) => compare(previousKey.value, key.value) > 0;
			break;

		case 'alphabetical-blocks':
			errorChecker = (key: JsonStringAst, previousKey: JsonStringAst) => compare(previousKey.value, key.value) > 0 && previousKey.pos.end.line > key.pos.start.line + 1;
			break;

		default: return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const [index, { key }] of jsonObjectAst.members.entries()) {
		const previousKey = jsonObjectAst.members[index - 1]?.key ?? undefined;
		if (previousKey && errorChecker(key, previousKey)) {
			return new RuleError(`property "${key.value}" is not in alphabetical order`, key.pos, lines);
		}
	}

	return true;
}
