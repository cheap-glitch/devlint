export function wrapInArray<T>(valueToWrap: T): [T] extends Array<infer U> ? U[] : T[] {
	return Array.isArray(valueToWrap) ? valueToWrap : [valueToWrap];
}

export function isGlobPattern(path: string): boolean {
	return /[*[\]{}]/u.test(path);
}
