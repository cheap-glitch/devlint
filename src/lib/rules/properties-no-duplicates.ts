import { isJsonObjectAst } from '../helpers/json';
import { RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export default function({ lines, jsonAst }: RuleContext): RuleResult {
	if (!isJsonObjectAst(jsonAst)) {
		return new RuleError(RuleErrorType.InvalidData);
	}

	if (jsonAst.members === undefined) {
		return true;
	}

	const properties = jsonAst.members.map(({ key }) => key.value);
	for (const [index, property] of properties.entries()) {
		if (properties.indexOf(property) !== index) {
			return new RuleError(`duplicated property \`${property}\``, jsonAst.members[index].key.pos, lines);
		}
	}

	return true;
}
