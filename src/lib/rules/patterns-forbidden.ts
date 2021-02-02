import { isRegex } from './helpers';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ contents, lines, parameter: forbiddenPatterns }: RuleContext): RuleResult {
	if (!Array.isArray(forbiddenPatterns)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const pattern of forbiddenPatterns) {
		if (typeof pattern !== 'string') {
			return new RuleError(RuleErrorType.InvalidParameter);
		}

		let match = undefined;
		let matchIndex = -1;
		if (isRegex(pattern)) {
			const results = contents.match(new RegExp(pattern.slice(1, -1)));
			if (results) {
				match = results[0];
				matchIndex = results?.index ?? -1;
			}
		} else {
			match = pattern;
			matchIndex = contents.indexOf(pattern);
		}

		if (match === undefined || matchIndex === -1) {
			continue;
		}

		const matchLineStart = lines.findIndex(line => line.char + line.text.length - 1 >= matchIndex);
		const matchLineEnd   = lines.findIndex(line => line.char + line.text.length - 1 >= matchIndex + match.length - 1);
		if (matchLineStart === -1 || matchLineEnd === -1) {
			throw new Error();
		}

		return new RuleError('found forbidden parameter',
			{ line: matchLineStart + 1, column: matchIndex - lines[matchLineStart].char, char: matchIndex },
			{ line: matchLineEnd   + 1, column: matchIndex - lines[matchLineEnd  ].char, char: matchIndex + match.length - 1 },
			lines
		);
	}

	return true;
}
