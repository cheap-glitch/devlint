import { isJsonObjectAst } from '../helpers/json';
import { RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export default function({ lines, jsonAst, parameters: position }: RuleContext): RuleResult {
	if (!isJsonObjectAst(jsonAst) || jsonAst.members === undefined) {
		return new RuleError(RuleErrorType.InvalidData);
	}
	if (typeof position !== 'string') {
		return new RuleError(RuleErrorType.InvalidParameters);
	}

	let checkLineAbove;
	let checkLineBelow;

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

		default: return new RuleError(RuleErrorType.InvalidParameters);
	}

	for (const [index, { key }] of jsonAst.members.entries()) {
		if (!checkLineAbove(key.pos.start.line, index)) {
			return new RuleError('missing empty line above', { ...key.pos.start });
		} else if (!checkLineBelow(key.pos.end.line, index, jsonAst.members.length - 1)) {
			return new RuleError('missing empty line below', { ...key.pos.end   });
		}
	}

	return true;
}
