export interface Line {
	char:   number,
	number: number,
	text:   string,
}

export function getLines(text: string): Array<Line> {
	const lines: Array<Line> = [];

	let char   = 0;
	let number = 1;

	for (const line of text.split(/(\r?\n)/)) {
		if (line === '\n' || line === '\r\n') {
			char += line.length;
			continue;
		}

		lines.push({ char, number, text: line });

		char += line.length;
		number ++;
	}

	return lines;
}

export function countWord(word: string, count: number): string {
	return count + ' ' + word + (count > 1 ? 's' : '');
}

export function capitalize(message: string): string {
	return message.slice(0, 1).toUpperCase() + message.slice(1);
}
