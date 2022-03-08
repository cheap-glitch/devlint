import { RuleTargetType, RuleError } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ contents, lines }: RuleContext): RuleResult {
	// Ingore empty targets
	if (contents.length === 0) {
		return true;
	}

	const blankLineRegex = /^\s*$/u;
	for (const line of lines) {
		if (!blankLineRegex.test(line.text)) {
			continue;
		}

		// Ignore a single line terminator at the end of the file
		if (line.number === lines.length && /.\r?\n$/u.test(contents)) {
			continue;
		}

		const start = {
			line: line.number,
			column: 1,
			char: line.char,
		};
		const end = {
			line: line.number,
			column: line.text.length + 1,
			char: line.char + line.text.length,
		};

		// TODO [>0.3.0]: Rename "empty" to "blank"
		return new RuleError('line should not be empty', { start, end }, lines);
	}

	return true;
}
