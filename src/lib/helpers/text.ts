export interface Line {
	text:      string,
	startChar: number,
}

export function getLines(text: string): Array<Line> {
	const lines: Array<Line> = [];

	let currentChar = 0;
	for (const line of text.split(/(\r?\n)/)) {
		if (line === '\n' || line === '\r\n') {
			currentChar += line.length;
			continue;
		}

		lines.push({ text: line, startChar: currentChar });
		currentChar += line.length;
	}

	return lines;
}

export function countWord(word: string, count: number): string {
	return count + ' ' + word + (count > 1 ? 's' : '');
}

export function capitalize(message: string): string {
	return message.slice(0, 1).toUpperCase() + message.slice(1);
}
