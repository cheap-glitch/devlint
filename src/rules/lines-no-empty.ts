import { RuleContext, RuleResult, RuleError } from '..';

/**
 * Ensures the target does not contain any "empty" lines, i.e. lines with a zero length
 * or lines containing only whitespace characters.
 *
 * @remarks
 * Empty target will not trigger this rule.
 *
 * @example
 *
 * ```
 * foo
 * bar
 * ```
 *
 * @example
 *
 * ```
 * foo
 *
 * bar
 * ```
 *
 * ```
 * foo
 * bar
 *
 * ```
 *
 */
export default function({ contents, lines }: RuleContext): RuleResult {
	// Ingore empty files
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

		return new RuleError('line should not be empty', { line: emptyLineIndex + 1, column: 1, char: lines[emptyLineIndex].startChar });
	}

	return true;
}
