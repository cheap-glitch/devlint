import { isJsonAstObject } from '../helpers/json';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonObject;

export function validator({ lines, jsonAst, parameter: position }: RuleContext): RuleResult {
	if (!isJsonAstObject(jsonAst)) {
		return new RuleError(RuleErrorType.InvalidData);
	}
	if (typeof position !== 'string') {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	if (jsonAst.members === undefined) {
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

	for (const [index, { key }] of jsonAst.members.entries()) {
		if (!checkLineAbove(key.pos.start.line, index)) {
			return new RuleError('missing empty line above', key.pos, lines);
		} else if (!checkLineBelow(key.pos.end.line, index, jsonAst.members.length - 1)) {
			return new RuleError('missing empty line below', key.pos, lines);
		}
	}

	return true;
}
