import { RuleError, RuleErrorType } from '../errors';

import type { RuleErrorLocation } from '../errors';

export interface Line {
	char: number;
	number: number;
	text: string;
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
				return /^@?[\da-z](?:[/-]?[\da-z]+)*$/u.test(testedString);

			case 'snake':
				return /^[a-z](?:_?[\da-z]+)*$/u.test(testedString);

			case 'camel':
				return /^[a-z][\da-z]+(?:[A-Z][\da-z]+)*$/u.test(testedString);

			case 'pascal':
				return /^(?:[A-Z][\da-z]+)+$/u.test(testedString);

			case 'sentence':
				return testedString.length > 0 && testedString.slice(0, 1)[0].toLocaleUpperCase() === testedString.slice(0, 1)[0];

			case 'title':
				return !/(?:^|\P{Letter})\p{Lowercase_Letter}/u.test(testedString);

			default: return new RuleError(RuleErrorType.InvalidParameter);
		}
	})() || testedString === '';
}

export function matchStrings(model: string, testedString: string): boolean {
	if (isRegex(model)) {
		return new RegExp(model.slice(1, -1), 'u').test(testedString);
	}

	return model === testedString;
}

export function isRegex(model: string): boolean {
	return model.startsWith('/') && model.endsWith('/');
}

export function findMatchLocation(lines: Line[], matchText: string, matchIndex: number): RuleErrorLocation {
	const matchLineStart = lines.findIndex(line => line.char + line.text.length - 1 >= matchIndex);
	const matchLineEnd = lines.findIndex(line => line.char + line.text.length - 1 >= matchIndex + matchText.length - 1);

	return {
		start: matchLineStart === -1
		? undefined
		: {
			line: matchLineStart + 1,
			column: matchIndex - lines[matchLineStart].char + 1,
			char: matchIndex,
		},

		end: matchLineEnd === -1
		? undefined
		: {
			line: matchLineEnd + 1,
			column: matchIndex - lines[matchLineEnd].char + matchText.length,
			char: matchIndex + matchText.length - 1,
		},
	};
}

export function getLines(text: string): Line[] {
	const lines: Line[] = [];

	let char = 0;
	let number = 1;

	// eslint-disable-next-line prefer-named-capture-group -- The capturing group is needed to keep the EOL delimiters
	for (const line of text.split(/(\r?\n)/u)) {
		if (line === '\n' || line === '\r\n') {
			char += line.length;
			continue;
		}

		lines.push({ char, number, text: line });

		char += line.length;
		number++;
	}

	return lines;
}

const ellipsis = ' […]';
export function trimLineOverflow(line: string, maxLength = 30): string {
	if (line.length <= maxLength) {
		return line;
	}

	// Find the first space before the maximum length
	let index = maxLength - ellipsis.length;
	while (index >= 0 && line[index] !== ' ') {
		index--;
	}

	return (index === -1 ? line.slice(0, maxLength - ellipsis.length) : line.slice(0, index)) + ellipsis;
}

export function countWord(count: number, word: string, plural?: string): string {
	return count + ' ' + pluralize(word, count, plural);
}

export function pluralize(word: string, count: number, plural?: string): string {
	return count > 1 ? plural ?? word + 's' : word;
}

export function capitalize(message: string): string {
	return message.slice(0, 1).toUpperCase() + message.slice(1);
}
