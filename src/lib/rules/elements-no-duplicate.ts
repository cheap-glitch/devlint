import { quoteIfString } from '../helpers/text';
import { RuleTargetType, RuleError } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.JsonArray;

export function validator({ jsonArray, jsonArrayAst }: RuleContext): RuleResult {
	if (jsonArrayAst.elements === undefined) {
		return true;
	}

	for (const [index, element] of jsonArray.entries()) {
		if (element !== null && typeof element !== 'number' && typeof element !== 'string') {
			// TODO [>=0.4.0]: Test deep equality of arrays and objects too? (maybe add a "deep" boolean parameter)
			continue;
		}

		for (const [comparedIndex, comparedElement] of jsonArray.entries()) {
			if (element === comparedElement && index !== comparedIndex) {
				return new RuleError(`duplicated element ${comparedElement === null ? 'null' : quoteIfString(comparedElement)}`, jsonArrayAst.elements[comparedIndex].pos);
			}
		}
	}

	return true;
}
