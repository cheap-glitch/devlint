import chalk from 'chalk';

import { Line } from './text';
import { RuleErrorLocation } from '../rules';

export function formatSnippet(snippet: Array<string>, startingLine: number): string {
	const minTabIndent           = Math.min(...snippet.map(line => (line.match(/^\t+/)     ??     [''])[0].length));
	const minSpaceIndent         = Math.min(...snippet.map(line => (line.match(/^\t*( +)/) ?? ['', ''])[1].length));
	const lineNumbersColumnWidth = Math.max(2, (startingLine + snippet.length).toString().length) + 1;

	return snippet.map((line, index) => {
		return chalk`{inverse.bgGray.dim.black ${(startingLine + index).toString().padStart(lineNumbersColumnWidth, ' ')} }{yellow ${line.slice(minTabIndent + minSpaceIndent)}}`;
	}).join('\n');
}

export function cutSnippet(lines: Array<Line>, start: RuleErrorLocation, end: RuleErrorLocation): Array<string> {
	return lines.slice(Math.max(0, start.line - 1), end.line + 2).map(line => line.text);
}
