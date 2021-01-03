import { RuleContext, RuleResult, RuleError, RuleErrorType, isJsonObjectAst } from '..';

export default function({ lines, jsonAst }: RuleContext): RuleResult {
	if (!isJsonObjectAst(jsonAst) || jsonAst.members === undefined) {
		return new RuleError(RuleErrorType.MissingData);
	}

	for (const { key } of jsonAst.members) {
		if (lines[key.pos.start.line - 1].text !== '') {
			return new RuleError('missing empty line above', { ...key.pos.start });
		} else if (lines[key.pos.end.line + 1].text !== '') {
			return new RuleError('missing empty line below', { ...key.pos.end   });
		}
	}

	return true;
}
