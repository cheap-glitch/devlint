import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.JsonObject;

export function validator({ lines, jsonObjectAst, parameter: orderingType }: RuleContext): RuleResult {
	if (orderingType !== 'alphabetical' && orderingType !== 'alphabetical-blocks') {
		return new RuleError(RuleErrorType.InvalidParameter);
	}
	if (jsonObjectAst.members === undefined) {
		return true;
	}

	const compare = new Intl.Collator('en', { numeric: true }).compare;

	for (const [index, { key }] of jsonObjectAst.members.entries()) {
		const { key: previousKey, value: previousValue } = jsonObjectAst.members[index - 1] ?? {};
		if (previousKey === undefined || previousValue === undefined) {
			continue;
		}

		if (compare(previousKey.value, key.value) <= 0) {
			continue;
		}

		if (orderingType === 'alphabetical-blocks' && previousValue.pos.end.line < key.pos.start.line - 1) {
			continue;
		}

		return new RuleError(`property "${key.value}" is not in alphabetical order`, key.pos, lines);
	}

	return true;
}
