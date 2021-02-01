import { RuleTargetType, RuleContext, RuleResult, RuleError } from '../rules';

export const targetType = RuleTargetType.JsonObject;

export function validator({ lines, jsonObjectAst }: RuleContext): RuleResult {
	if (jsonObjectAst.members === undefined) {
		return true;
	}

	const properties = jsonObjectAst.members.map(({ key }) => key.value);
	for (const [index, property] of properties.entries()) {
		if (properties.indexOf(property) !== index) {
			return new RuleError(`duplicated property "${property}"`, jsonObjectAst.members[index].key.pos, lines);
		}

		// TODO: make recursive
	}

	return true;
}
