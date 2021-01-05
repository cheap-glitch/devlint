import { JsonString as JsonStringAst } from 'jsonast';

import { isJsonObjectAst } from '../helpers/json';
import { RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export default function({ jsonAst, parameters: ordering }: RuleContext): RuleResult {
	if (!isJsonObjectAst(jsonAst) || jsonAst.members === undefined) {
		return new RuleError(RuleErrorType.InvalidData);
	}
	if (ordering === undefined || typeof ordering !== 'string') {
		return new RuleError(RuleErrorType.InvalidParameters);
	}

	const collator = new Intl.Collator();
	let errorChecker;
	let errorMessage;

	switch (ordering) {
		case 'alphabetical':
			errorChecker = (key: JsonStringAst, previousKey: JsonStringAst) => collator.compare(previousKey.value, key.value) > 0;
			errorMessage = 'properties not in alphabetical order';
			break;

		case 'alphabetical-blocks':
			errorChecker = (key: JsonStringAst, previousKey: JsonStringAst) => collator.compare(previousKey.value, key.value) > 0 && previousKey.pos.end.line > key.pos.start.line + 1;
			errorMessage = 'properties block not in alphabetical order';
			break;

		default: return new RuleError(RuleErrorType.InvalidParameters);
	}

	for (const [index, { key }] of jsonAst.members.entries()) {
		const previousKey = jsonAst.members[index - 1]?.key ?? undefined;
		if (previousKey && errorChecker(key, previousKey)) {
			return new RuleError(errorMessage, key);
		}
	}

	return true;
}
