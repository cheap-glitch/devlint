import { RuleTargetType, RuleError } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ contents, lines }: RuleContext): RuleResult {
	// Ingore empty targets
	if (contents === '') {
		return true;
	}

	const emptyLinePattern = /^\s*$/u;
	const emptyLineIndex = lines.findIndex(({ text }) => emptyLinePattern.test(text));

	if (emptyLineIndex !== -1) {
		// Ignore a single line terminator at the end of the file
		if (emptyLineIndex === lines.length - 1 && /.\r?\n$/u.test(contents)) {
			return true;
		}

		const start = {
			line: emptyLineIndex + 1,
			column: 1,
			char: lines[emptyLineIndex].char,
		};
		const end = {
			line: emptyLineIndex + 1,
			column: 1 + lines[emptyLineIndex].text.length,
			char: lines[emptyLineIndex].char + lines[emptyLineIndex].text.length,
		};

		// TODO [>0.3.0]: Rename "empty" to "blank"
		return new RuleError('line should not be empty', { start, end }, lines);
	}

	return true;
}
