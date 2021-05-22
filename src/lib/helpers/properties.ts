import { Opaque } from 'type-fest';

export const PROPERTY_PATH_STARTING_CHARACTER = '#';

export type PropertyPath         = Opaque<string, 'PropertyPath'> | undefined;
export type PropertyPathSegments = Array<string | number>;

export function parsePropertyPath(path: PropertyPath): PropertyPathSegments {
	if (path === undefined) {
		return [];
	}

	return path
		.split('.')
		.filter(Boolean)
		.map(pathSegment => /^\d+|\[\d+]$/.test(pathSegment) ? Number.parseInt(pathSegment.replaceAll(/^\[|]$/g, ''), 10) : pathSegment);
}

export function joinPropertyPathSegments(segments: PropertyPathSegments): PropertyPath {
	const path = segments
		.map(pathSegment => typeof pathSegment === 'number' ? `[${pathSegment}]` : pathSegment)
		.join('.');

	return path as PropertyPath;
}

export function normalizePropertyPath(path: PropertyPath): PropertyPath {
	if (path === undefined) {
		return undefined;
	}

	const normalizedPath = path
		.replaceAll(/\.+/g, '.')
		.replaceAll(/^\.|\.$/g, '');

	return normalizedPath as PropertyPath;
}
