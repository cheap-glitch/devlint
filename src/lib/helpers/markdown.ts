interface MarkdownHeader {
	text:      string,
	level:     number,
	char:      number,
	fullMatch: string,
}

export function getMarkdownHeaders(text: string): Array<MarkdownHeader> {
	return [...text.matchAll(/^(?<level>#{1,6})\s+(?<text>.+)$/gm)].map(match => ({
		text:      match?.groups?.text.trim()  ?? '',
		level:     match?.groups?.level.length ??  0,
		char:      match.index ?? 0,
		fullMatch: match[0],
	}));
}
