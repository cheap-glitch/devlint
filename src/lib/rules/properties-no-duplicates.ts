import { isJsonObjectAst } from '../helpers/json';
import { RuleTargetType, RuleContext, RuleResult, RuleError } from '../rules';

export const targetType = RuleTargetType.JsonObject;

export function validator(context: RuleContext): RuleResult {
	const { lines, jsonObjectAst } = context;

	if (jsonObjectAst.members === undefined) {
		return true;
	}

	const keys = jsonObjectAst.members.map(({ key }) => key.value);
	for (const [index, { key, value }] of jsonObjectAst.members.entries()) {
		if (keys.indexOf(key.value) !== index) {
			return new RuleError(`duplicated property "${key.value}"`, key.pos, lines);
		}

		if (isJsonObjectAst(value)) {
			const result = validator({ ...context, lines: lines.slice(key.pos.start.line - 1, key.pos.end.line - 1), jsonObjectAst: value });
			if (result instanceof Error) {
				return result;
			}
		}
	}

	return true;
}
