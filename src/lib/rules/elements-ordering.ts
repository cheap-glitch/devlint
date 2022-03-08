import { quoteIfString } from '../helpers/text';
import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.JsonArray;

export function validator({ lines, jsonArrayAst, parameter: orderingType }: RuleContext): RuleResult {
	if (orderingType !== 'alphabetical' && orderingType !== 'alphabetical-blocks') {
		return new RuleError(RuleErrorType.InvalidParameter);
	}
	if (jsonArrayAst.elements === undefined) {
		return true;
	}

	const compare = new Intl.Collator('en', { numeric: true }).compare;

	let previousComparableValue: string | number | undefined;
	for (const [index, element] of jsonArrayAst.elements.entries()) {
		if (element.type !== 'string' && element.type !== 'number') {
			// TODO [>0.3.0]: Throw/return an error here?
			continue;
		}

		if (previousComparableValue === undefined) {
			previousComparableValue = element.value;
			continue;
		}

		const previousElement = jsonArrayAst.elements[index - 1];
		if (previousElement === undefined || (orderingType === 'alphabetical-blocks' && previousElement.pos.end.line < element.pos.start.line - 1)) {
			previousComparableValue = undefined;
			continue;
		}

		if (compare(String(previousComparableValue), String(element.value)) <= 0) {
			continue;
		}

		return new RuleError(`element ${quoteIfString(element.value)} is not in alphabetical order`, element.pos, lines);
	}

	return true;
}
