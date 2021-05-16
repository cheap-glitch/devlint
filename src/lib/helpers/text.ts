import { RuleError, RuleErrorType, RuleErrorLocation } from '../errors';

export interface Line {
	char:   number,
	number: number,
	text:   string,
}

export function checkStringCase(testedString: string, caseStyle: string): boolean | RuleError {
	return (() => {
		switch (caseStyle) {
			case 'uppercase':
				return !/\p{Lowercase_Letter}/u.test(testedString);

			case 'lowercase':
				return !/\p{Uppercase_Letter}/u.test(testedString);

			case 'kebab':
				return /^[a-z](?:-?[a-z\d]+)*$/u.test(testedString);

			case 'kebab-extended':
				return /^@?[\da-z](?:[/-]?[\da-z]+)*$/.test(testedString);

			case 'snake':
				return /^[a-z](?:_?[\da-z]+)*$/.test(testedString);

			case 'camel':
				return /^[a-z][\da-z]+(?:[A-Z][\da-z]+)*$/.test(testedString);

			case 'pascal':
				return /^(?:[A-Z][\da-z]+)+$/.test(testedString);

			case 'sentence':
				return testedString.length > 0 && testedString.slice(0, 1)[0].toLocaleUpperCase() === testedString.slice(0, 1)[0];

			case 'title':
				return !/(^|\P{Letter})\p{Lowercase_Letter}/u.test(testedString);

			default: return new RuleError(RuleErrorType.InvalidParameter);
		}
	})() || testedString === '';
}

export function matchStrings(model: string, value: string): boolean {
	return isRegex(model) ? new RegExp(model.slice(1, -1)).test(value) : model === value;
}

export function isRegex(model: string): boolean {
	return model.startsWith('/') && model.endsWith('/');
}

export function findMatchLocation(lines: Array<Line>, matchText: string, matchIndex: number): RuleErrorLocation {
	const matchLineStart = lines.findIndex(line => line.char + line.text.length - 1 >= matchIndex);
	const matchLineEnd   = lines.findIndex(line => line.char + line.text.length - 1 >= matchIndex + matchText.length - 1);

	return {
		start: matchLineStart !== -1 ? {
			line:   matchLineStart + 1,
			column: matchIndex - lines[matchLineStart].char + 1,
			char:   matchIndex,
		} : undefined,

		end: matchLineEnd !== -1 ? {
			line:   matchLineEnd + 1,
			column: matchIndex - lines[matchLineEnd].char + matchText.length,
			char:   matchIndex + matchText.length - 1,
		} : undefined,
	};
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

export function trimLineOverflow(line: string, maxLength = 30): string {
	const ellipsis = ' […]';

	if (line.length <= maxLength) {
		return line;
	}

	// Find the first space before the maximum length
	let index = maxLength - ellipsis.length;
	while (index >= 0 && line[index] !== ' ') {
		index --;
	}

	return (index === -1 ? line.slice(0, maxLength - ellipsis.length) : line.slice(0, index)) + ellipsis;
}

export function countWord(count: number, word: string, plural?: string): string {
	return count + ' ' + pluralize(word, count, plural);
}

export function pluralize(word: string, count: number, plural?: string): string {
	return count > 1 ? (plural ?? (word + 's')) : word;
}

export function capitalize(message: string): string {
	return message.slice(0, 1).toUpperCase() + message.slice(1);
}

export function quoteJsonString(json: string): string {
	return (json.startsWith('"') ? '' : '"') + json + (json.endsWith('"') ? '' : '"');
}
