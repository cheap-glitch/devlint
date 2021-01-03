import { RuleContext, RuleResult, RuleError, RuleErrorType, isJsonObjectAst } from '..';

export default function({ jsonAst, parameters: properties }: RuleContext): RuleResult {
	if (!isJsonObjectAst(jsonAst) || jsonAst.members === undefined) {
		return new RuleError(RuleErrorType.MissingData);
	}
	if (properties === undefined || !Array.isArray(properties) || properties.some(property => typeof property !== 'string')) {
		return new RuleError(RuleErrorType.InvalidParameters);
	}

	let lastIndex = -1;
	for (const { key } of jsonAst.members) {
		const index = properties.findIndex(property => property === key.value);
		if (index !== -1 && index < lastIndex) {
			const propertyBefore = properties[index - 1];
			const propertyAfter  = properties[index + 1];

			if (propertyBefore !== undefined && propertyAfter !== undefined) {
				return new RuleError(`property "${key.value}" is not between "${propertyBefore}" and "${propertyAfter}"`, { ...key.pos.start });
			}

			if (propertyBefore !== undefined) {
				return new RuleError(`property "${key.value}" is not after "${propertyBefore}"`, { ...key.pos.start });
			}

			if (propertyAfter !== undefined) {
				return new RuleError(`property "${key.value}" is not before "${propertyAfter}"`, { ...key.pos.start });
			}

			return new RuleError(`property "${key.value}" is not in the right place`, { ...key.pos.start });
		}
		lastIndex = index;
	}

	return true;
}
