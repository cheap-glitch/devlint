import { isJsonObjectAst } from '../helpers/json';
import { RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export default function({ lines, jsonAst }: RuleContext): RuleResult {
	if (!isJsonObjectAst(jsonAst) || jsonAst.members === undefined) {
		return new RuleError(RuleErrorType.InvalidData);
	}

	const properties = jsonAst.members.map(({ key }) => key.value);
	for (const [index, property] of properties.entries()) {
		if (properties.indexOf(property) !== index) {
			return new RuleError(`duplicated property \`${property}\``, jsonAst.members[index].key, lines);
		}
	}

	return true;
}
