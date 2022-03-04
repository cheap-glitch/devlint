import * as c from 'colorette';

import { RuleStatus } from '../rules';

import type { Line } from './text';
import type { RuleErrorPosition } from '../errors';

const COLUMNS: number | undefined = process.stdout.columns;

export type Snippet = Line[];

export function formatSnippet(snippet: Snippet, start: RuleErrorPosition, end: RuleErrorPosition, status: RuleStatus): string {
	if (snippet.length === 0) {
		return '';
	}

	const minTabIndent = Math.min(...snippet.map(line => line.text.match(/^\t+/u)?.length ?? 0));
	const minSpaceIndent = Math.min(...snippet.map(line => line.text.match(/^\t*(?<indent> +)/u)?.groups.indent?.length ?? 0));
	const numbersColumnWidth = Math.max(2, String(snippet[snippet.length - 1].number).length) + 1;
	const highlightColor = status === RuleStatus.Error ? c.red : c.yellow;
	const highlightBgColor = status === RuleStatus.Error ? c.bgRed : c.bgYellow;
	const horizontalBoxLine = COLUMNS ? '━'.repeat(COLUMNS - 6) : '';

	return (COLUMNS ? c.dim(c.black('  ┏' + horizontalBoxLine + '┓')) : '\n')
		+ '\n'
		+ snippet.map(line => {
			const lineContents = line.text.slice(minTabIndent + minSpaceIndent);
			const lineNumbersColumn = String(line.number).padStart(numbersColumnWidth, ' ');

			const isLineInError = start.line <= line.number && line.number <= end.line;
			const lineColor = isLineInError ? highlightColor : c.dim;
			const numbersColumnBg = isLineInError ? highlightBgColor : c.bgBlack;

			return (COLUMNS ? c.dim(c.black('  ┃')) : '  ')
				+ c.dim(numbersColumnBg(c.black(isLineInError ? c.bold(lineNumbersColumn) : lineNumbersColumn)))
				+ ' '
				+ lineColor(isLineInError ? c.bold(lineContents) : lineContents)
				+ (COLUMNS ? c.dim(c.black(' '.repeat(COLUMNS - lineContents.length - 10) + '┃')) : '');
		}).join('\n')
		+ '\n'
		+ (COLUMNS ? c.dim(c.black('  ┗' + horizontalBoxLine + '┛')) : '\n');
}

export function cutSnippet(lines: Line[], start: RuleErrorPosition, end: RuleErrorPosition): Snippet {
	const firstLineIndex = Math.max(0, start.line - (lines[0]?.number ?? 0) - 1);
	const lastLineIndex = Math.max(firstLineIndex, end.line - (lines[0]?.number ?? 0) + 1);

	return lines.slice(firstLineIndex, lastLineIndex + 1);
}
