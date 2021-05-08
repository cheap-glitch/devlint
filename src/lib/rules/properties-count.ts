import { countWord } from '../helpers/text';
import { isJsonObject, matchJsonValues } from '../helpers/json';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonObject;

export function validator({ jsonObject, parameter: optionsObject }: RuleContext): RuleResult {
	if (!isJsonObject(optionsObject) ||
	    Object.keys(optionsObject).some(key => !['min', 'max'].includes(key)) ||
	    !matchJsonValues({ 'min?': Number, 'max?': Number }, optionsObject)
	) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const propertiesCount    = Object.keys(jsonObject).length;
	const minPropertiesCount = typeof optionsObject.min === 'number' ? optionsObject.min : 0;
	const maxPropertiesCount = typeof optionsObject.max === 'number' ? optionsObject.max : Number.POSITIVE_INFINITY;

	if (propertiesCount < minPropertiesCount) {
		return new RuleError(`object has ${countWord(propertiesCount, 'property', 'properties')}, minimum is ${optionsObject.min}`);
	}
	if (propertiesCount > maxPropertiesCount) {
		return new RuleError(`object has ${countWord(propertiesCount, 'property', 'properties')}, maximum is ${optionsObject.max}`);
	}

	return true;
}
