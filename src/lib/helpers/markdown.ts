interface MarkdownHeader {
	text:      string,
	level:     number,
	fullMatch: string,
	index:     number,
}

export function getMarkdownHeaders(text: string): Array<MarkdownHeader> {
	return [...text.matchAll(/^(?<level>#{1,6})\s+(?<text>.+)$/g)].map(match => ({
		text:      match?.groups?.text.trim()  ?? '',
		level:     match?.groups?.level.length ??  0,
		fullMatch: match[0],
		index:     match.index ?? 0,
	}));
}
