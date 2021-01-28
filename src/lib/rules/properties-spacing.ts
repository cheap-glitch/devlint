import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonObject;

export function validator({ lines, jsonObjectAst, parameter: position }: RuleContext): RuleResult {
	if (typeof position !== 'string') {
		return new RuleError(RuleErrorType.InvalidParameter);
	}
	if (jsonObjectAst.members === undefined) {
		return true;
	}

	let checkLineAbove, checkLineBelow;
	switch (position) {
		case 'around':
			checkLineAbove = (lineIndex: number) => lines[lineIndex - 1].text === '';
			checkLineBelow = (lineIndex: number) => lines[lineIndex + 1].text === '';
			break;

		case 'between':
			checkLineAbove = (lineIndex: number, keyIndex: number) => {
				const line = lines[lineIndex - 1].text;

				return keyIndex === 0 ? (line !== '') : (line === '');
			};
			checkLineBelow = (lineIndex: number, keyIndex: number, maxKeyIndex: number) => {
				const line = lines[lineIndex + 1].text;

				return keyIndex === maxKeyIndex ? (line !== '') : (line === '');
			};
			break;

		default: return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const [index, { key, value }] of jsonObjectAst.members.entries()) {
		if (!checkLineAbove(key.pos.start.line - 1, index)) {
			return new RuleError('missing empty line above', key.pos.start, key.pos.start, lines);
		} else if (!checkLineBelow(value.pos.end.line - 1, index, jsonObjectAst.members.length - 1)) {
			return new RuleError('missing empty line below', value.pos.end, value.pos.end, lines);
		}
	}

	return true;
}
