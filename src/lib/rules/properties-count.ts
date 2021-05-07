import { countWord } from '../helpers/text';
import { isJsonObject } from '../helpers/json';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonObject;

export function validator({ jsonObject, parameter: propertiesCounts }: RuleContext): RuleResult {
	if (!isJsonObject(propertiesCounts) || Object.keys(propertiesCounts).some(key => !['min', 'max'].includes(key))) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const propertiesCount    = Object.keys(jsonObject).length;
	const minPropertiesCount = typeof propertiesCounts.min === 'number' ? propertiesCounts.min : 0;
	const maxPropertiesCount = typeof propertiesCounts.max === 'number' ? propertiesCounts.max : Number.POSITIVE_INFINITY;

	if (propertiesCount < minPropertiesCount) {
		return new RuleError(`object has ${countWord('property', propertiesCount, 'properties')}, minimum is ${propertiesCounts.min}`);
	}
	if (propertiesCount > maxPropertiesCount) {
		return new RuleError(`object has ${countWord('property', propertiesCount, 'properties')}, maximum is ${propertiesCounts.max}`);
	}

	return true;
}
