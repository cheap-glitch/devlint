import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonObject;

export function validator({ lines, jsonObjectAst, parameter: properties }: RuleContext): RuleResult {
	if (properties === undefined || !Array.isArray(properties) || properties.some(property => typeof property !== 'string')) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}
	if (jsonObjectAst.members === undefined) {
		return true;
	}

	let lastIndex = -1;
	for (const { key } of jsonObjectAst.members) {
		const index = properties.findIndex(property => property === key.value);
		if (index !== -1 && index < lastIndex) {
			const propertyBefore = properties[index - 1];
			const propertyAfter  = properties[index + 1];

			if (propertyBefore !== undefined && propertyAfter !== undefined) {
				return new RuleError(`property "${key.value}" is not between "${propertyBefore}" and "${propertyAfter}"`, key.pos, lines);
			}

			if (propertyBefore !== undefined) {
				return new RuleError(`property "${key.value}" is not after "${propertyBefore}"`, key.pos, lines);
			}

			if (propertyAfter !== undefined) {
				return new RuleError(`property "${key.value}" is not before "${propertyAfter}"`, key.pos, lines);
			}

			return new RuleError(`property "${key.value}" is not in the right place`, key.pos, lines);
		}
		lastIndex = index;
	}

	return true;
}
