interface MarkdownHeader {
	text:      string,
	level:     number,
	char:      number,
	fullMatch: string,
}

const markdownHeaderRegex = /^(?<level>#{1,6})\s+(?<text>.+)$/;

export function parseMarkdownHeaders(rawHeaders: Array<unknown>): Array<MarkdownHeader> | Error {
	const headers = [];
	for (const rawHeader of rawHeaders) {
		if (typeof rawHeader !== 'string') {
			return new Error();
		}

		const match = rawHeader.match(markdownHeaderRegex);
		const header = {
			text:      match?.groups?.text.trim()  ?? rawHeader.trim(),
			level:     match?.groups?.level.length ?? 0,
			char:      match?.index                ?? -1,
			fullMatch: match?.[0]                  ?? '',
		};

		headers.push(header);
	}

	return headers;
}

export function getMarkdownHeaders(text: string): Array<MarkdownHeader> {
	return [...text.matchAll(new RegExp(markdownHeaderRegex, 'gm'))].map(match => ({
		text:      match.groups?.text.trim()  ?? '',
		level:     match.groups?.level.length ?? 0,
		char:      match.index                ?? -1,
		fullMatch: match[0],
	}));
}

export function isMatchingHeader({ text, level }: MarkdownHeader, baseHeader: MarkdownHeader): boolean {
	return text === baseHeader.text && (level === baseHeader.level || baseHeader.level === 0);
}
