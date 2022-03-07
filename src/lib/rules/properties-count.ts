import { countWord } from '../helpers/text';
import { isJsonObject, matchJsonValues } from '../helpers/json';
import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.JsonObject;

export function validator({ jsonObjectAst, parameter: optionsObject }: RuleContext): RuleResult {
	if (
		!isJsonObject(optionsObject)
		|| Object.keys(optionsObject).some(key => !['min', 'max'].includes(key))
		|| !matchJsonValues({ 'min?': Number, 'max?': Number }, optionsObject)
	) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const propertiesCount = jsonObjectAst.members?.length ?? 0;
	const minPropertiesCount = optionsObject.min ?? 0;
	const maxPropertiesCount = optionsObject.max ?? Number.POSITIVE_INFINITY;

	if (propertiesCount < minPropertiesCount) {
		return new RuleError(`object has ${countWord(propertiesCount, 'property', 'properties')}, minimum is ${minPropertiesCount}`);
	}
	if (propertiesCount > maxPropertiesCount) {
		return new RuleError(`object has ${countWord(propertiesCount, 'property', 'properties')}, maximum is ${maxPropertiesCount}`);
	}

	return true;
}
