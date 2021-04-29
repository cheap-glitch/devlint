export const PROPERTY_PATH_STARTING_CHARACTER = '#';

export type PropertyPath         = string;
export type PropertyPathSegments = Array<string | number>;

export function joinPropertyPathSegments(path: PropertyPathSegments): string {
	return path.map(pathSegment => (typeof pathSegment === 'number') ? ('[' + pathSegment + ']') : ('.' + pathSegment)).join('');
}

export function parsePropertyPath(rawPath: string): PropertyPathSegments {
	return rawPath
		.replace(/\[(?<index>\d+)]/g, '.$<index>')
		.split('.').filter(Boolean)
		.map(pathSegment => /^\d+$/.test(pathSegment) ? Number.parseInt(pathSegment, 10) : pathSegment);
}
