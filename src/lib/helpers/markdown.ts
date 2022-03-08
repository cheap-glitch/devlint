import { isMatchingString } from './text';

interface MarkdownHeading {
	text: string;
	level: number;
	char: number;
	fullMatch: string;
}

const markdownHeadingRegex = /^(?<level>#{1,6})\s+(?<text>.+)$/u;

export function parseMarkdownHeadings(rawHeadings: unknown[]): MarkdownHeading[] | Error {
	const headings = [];
	for (const rawHeading of rawHeadings) {
		if (typeof rawHeading !== 'string') {
			return new TypeError('Markdown headings must be a strings');
		}

		const match = rawHeading.match(markdownHeadingRegex);
		headings.push({
			text: match?.groups?.text.trim() ?? rawHeading.trim(),
			level: match?.groups?.level.length ?? 0,
			char: match?.index ?? -1,
			fullMatch: match?.[0] ?? '',
		});
	}

	return headings;
}

export function getMarkdownHeadings(text: string): MarkdownHeading[] {
	return [...text.matchAll(new RegExp(markdownHeadingRegex, 'ugm'))].map(match => ({
		text: match.groups?.text.trim() ?? '',
		level: match.groups?.level.length ?? 0,
		char: match.index ?? -1,
		fullMatch: match[0],
	}));
}

export function isMatchingHeading({ text, level }: MarkdownHeading, modelHeading: MarkdownHeading): boolean {
	return (level === modelHeading.level || modelHeading.level === 0) && isMatchingString(modelHeading.text, text);
}

export function isMarkdownHeading(line: string): boolean {
	return markdownHeadingRegex.test(line);
}
