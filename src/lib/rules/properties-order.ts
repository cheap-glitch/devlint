import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonObject;

export function validator({ lines, jsonObjectAst, parameter: properties }: RuleContext): RuleResult {
	if (!Array.isArray(properties) || properties.some(property => typeof property !== 'string')) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}
	if (jsonObjectAst.members === undefined) {
		return true;
	}

	let lastIndex = -1;
	for (const { key } of jsonObjectAst.members) {
		const index = properties.indexOf(key.value);
		if (index === -1) {
			continue;
		}
		if (index >= lastIndex) {
			lastIndex = index;
			continue;
		}

		const jsonObjectProperties = jsonObjectAst.members.map(({ key }) => key.value);
		const propertyBefore = properties.slice(0, index).reverse().find(property => jsonObjectProperties.includes(String(property)));
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const propertyAfter  = properties.slice(index + 1).find(property => jsonObjectProperties.includes(String(property)))!;

		if (propertyBefore !== undefined) {
			return new RuleError(`property "${key.value}" should be placed between "${propertyBefore}" and "${propertyAfter}"`, key.pos, lines);
		}

		return new RuleError(`property "${key.value}" should be placed before "${propertyAfter}"`, key.pos, lines);
	}

	return true;
}
