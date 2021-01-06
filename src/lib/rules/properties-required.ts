import { isJsonObjectAst } from '../helpers/json';
import { RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export default function({ lines, jsonObject, jsonAst, parameter: requiredProperties }: RuleContext): RuleResult {
	if (jsonObject === undefined || !isJsonObjectAst(jsonAst)) {
		return new RuleError(RuleErrorType.InvalidData);
	}
	if (requiredProperties === undefined || !Array.isArray(requiredProperties) || requiredProperties.some(property => typeof property !== 'string')) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const missingProperty = requiredProperties.find(property => typeof property !== 'string' || !Object.keys(jsonObject).includes(property));
	if (missingProperty !== undefined) {
		return new RuleError(`missing required property \`${missingProperty}\``, jsonAst.pos, lines);
	}

	return true;
}
