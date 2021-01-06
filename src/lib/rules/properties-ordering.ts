import { JsonString as JsonStringAst } from 'jsonast';

import { isJsonObjectAst } from '../helpers/json';
import { RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export default function({ lines, jsonAst, parameter: ordering }: RuleContext): RuleResult {
	if (!isJsonObjectAst(jsonAst)) {
		return new RuleError(RuleErrorType.InvalidData);
	}
	if (ordering === undefined || typeof ordering !== 'string') {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	if (jsonAst.members === undefined) {
		return true;
	}

	let errorChecker, errorMessage;
	const compare = (new Intl.Collator('en', { numeric: true })).compare;

	switch (ordering) {
		case 'alphabetical':
			errorChecker = (key: JsonStringAst, previousKey: JsonStringAst) => compare(previousKey.value, key.value) > 0;
			errorMessage = 'properties not in alphabetical order';
			break;

		case 'alphabetical-blocks':
			errorChecker = (key: JsonStringAst, previousKey: JsonStringAst) => compare(previousKey.value, key.value) > 0 && previousKey.pos.end.line > key.pos.start.line + 1;
			errorMessage = 'properties block not in alphabetical order';
			break;

		default: return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const [index, { key }] of jsonAst.members.entries()) {
		const previousKey = jsonAst.members[index - 1]?.key ?? undefined;
		if (previousKey && errorChecker(key, previousKey)) {
			return new RuleError(errorMessage, key.pos, lines);
		}
	}

	return true;
}
