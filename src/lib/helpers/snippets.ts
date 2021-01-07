import chalk from 'chalk';

import { Line, capitalize } from './text';
import { RuleStatus, RuleErrorLocation } from '../rules';

export type Snippet = Array<Line>;

export function formatSnippet(snippet: Snippet, start: RuleErrorLocation, end: RuleErrorLocation, ruleStatus: RuleStatus): string {
	const minTabIndent           = Math.min(...snippet.map(line => (line.text.match(/^\t+/)     ??     [''])[0].length));
	const minSpaceIndent         = Math.min(...snippet.map(line => (line.text.match(/^\t*( +)/) ?? ['', ''])[1].length));
	const lineNumbersColumnWidth = Math.max(2, snippet[snippet.length - 1].number.toString().length) + 1;
	const highlightColor         = ruleStatus === RuleStatus.Error ? 'red' : 'yellow';

	return snippet.map(line => {
		const lineContents      = line.text.slice(minTabIndent + minSpaceIndent);
		const lineNumbersColumn = line.number.toString().padStart(lineNumbersColumnWidth, ' ');

		const isLineInError     = (start.line <= line.number && line.number <= end.line);
		const lineColor         = isLineInError ? highlightColor : 'dim';
		const lineNumberColor   = isLineInError ? 'bg' + capitalize(highlightColor) : 'bgGray';

		return chalk`{inverse.${lineNumberColor}.dim.${isLineInError ? 'bold.' : ''}black ${lineNumbersColumn} } {${isLineInError ? 'bold.' : ''}${lineColor} ${lineContents}}`;
	}).join('\n');
}

export function cutSnippet(lines: Array<Line>, start: RuleErrorLocation, end: RuleErrorLocation): Snippet {
	const firstLineIndex = Math.max(0, start.line - lines[0].number - 1);
	const lastLineIndex  = Math.max(firstLineIndex, end.line - lines[0].number + 1);

	return lines.slice(firstLineIndex, lastLineIndex + 1);
}
