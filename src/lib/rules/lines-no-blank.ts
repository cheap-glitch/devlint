import { RuleContext, RuleResult, RuleError } from '../rules';

export default function({ contents, lines }: RuleContext): RuleResult {
	// Ingore empty targets
	if (contents === '') {
		return true;
	}

	const emptyLinePattern = /^\s*$/;
	const emptyLineIndex   = lines.findIndex(({ text }) => emptyLinePattern.test(text));

	if (emptyLineIndex !== -1) {
		// Ignore a single line terminator at the end of the file
		if (emptyLineIndex === (lines.length - 1) && /.\r?\n$/.test(contents)) {
			return true;
		}

		const start = {
			line:   emptyLineIndex,
			column: 1,
			char:   lines[emptyLineIndex].startChar,
		};
		const end = {
			line:   emptyLineIndex,
			column: lines[emptyLineIndex].text.length + 1,
			char:   lines[emptyLineIndex].startChar + lines[emptyLineIndex].text.length,
		};

		return new RuleError('line should not be empty', start, end, lines);
	}

	return true;
}
