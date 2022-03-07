import { countWord } from '../helpers/text';
import { isJsonObject, matchJsonValues } from '../helpers/json';
import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.JsonArray;

export function validator({ jsonArrayAst, parameter: optionsObject }: RuleContext): RuleResult {
	if (
		!isJsonObject(optionsObject)
		|| Object.keys(optionsObject).some(key => !['min', 'max'].includes(key))
		|| !matchJsonValues({ 'min?': Number, 'max?': Number }, optionsObject)
	) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const elementsCount = jsonArrayAst.elements?.length ?? 0;
	const minElementCount = optionsObject.min ?? 0;
	const maxElementCount = optionsObject.max ?? Number.POSITIVE_INFINITY;

	if (elementsCount < minElementCount) {
		return new RuleError(
			`array has ${countWord(elementsCount, 'element')}, minimum is ${minElementCount}`,
			jsonArrayAst.pos,
		);
	}
	if (elementsCount > maxElementCount) {
		return new RuleError(
			`array has ${countWord(elementsCount, 'element')}, maximum is ${maxElementCount}`,
			jsonArrayAst.pos,
		);
	}

	return true;
}
