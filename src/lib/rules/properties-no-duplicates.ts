import { isJsonObjectAst } from '../helpers/json';
import { RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export default function({ jsonAst }: RuleContext): RuleResult {
	if (!isJsonObjectAst(jsonAst) || jsonAst.members === undefined) {
		return new RuleError(RuleErrorType.InvalidData);
	}

	const properties = jsonAst.members.map(({ key }) => key.value);
	for (const [index, property] of properties.entries()) {
		if (properties.indexOf(property) !== index) {
			const astKey = jsonAst.members[index].key;

			return new RuleError(`duplicated property \`${property}\``, { ...astKey.pos.start }, { ...astKey.pos.end });
		}
	}

	return true;
}
