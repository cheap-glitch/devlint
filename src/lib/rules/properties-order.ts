import { isJsonObjectAst } from '../helpers/json';
import { RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export default function({ lines, jsonAst, parameter: properties }: RuleContext): RuleResult {
	if (!isJsonObjectAst(jsonAst)) {
		return new RuleError(RuleErrorType.InvalidData);
	}
	if (properties === undefined || !Array.isArray(properties) || properties.some(property => typeof property !== 'string')) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	let lastIndex = -1;
	for (const { key } of (jsonAst.members ?? [])) {
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
