export const PROPERTY_PATH_STARTING_CHARACTER = '#';

export type PropertyPath         = string | undefined;
export type PropertyPathSegments = Array<string | number>;

export function parsePropertyPath(rawPath: string): PropertyPathSegments {
	return rawPath
		.split('.')
		.filter(Boolean)
		.map(pathSegment => /^\d+|\[\d+]$/.test(pathSegment) ? Number.parseInt(pathSegment.replaceAll(/^\[|]$/g, ''), 10) : pathSegment);
}

export function joinPropertyPathSegments(segments: PropertyPathSegments): string {
	return segments
		.map(pathSegment => typeof pathSegment === 'number' ? ('[' + pathSegment + ']') : pathSegment)
		.join('.')
		.replaceAll(/\.+/g, '.');
}
