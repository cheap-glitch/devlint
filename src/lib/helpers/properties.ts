import type { Opaque } from 'type-fest';

export const PROPERTY_PATH_STARTING_CHARACTER = '#';

export type PropertyPath = Opaque<string, 'PropertyPath'> | undefined;
export type PropertyPathSegments = Array<string | number>;

export function parsePropertyPath(path: PropertyPath): PropertyPathSegments {
	if (path === undefined) {
		return [];
	}

	return path
		.split('.')
		.filter(Boolean)
		.map(segment => {
			if (/^\d+|\[\d+\]$/u.test(segment)) {
				return Number.parseInt(segment.replaceAll(/^\[|\]$/ug, ''));
			}

			return segment;
		});
}

export function joinPropertyPathSegments(segments: PropertyPathSegments): PropertyPath {
	return segments
		// eslint-disable-next-line no-confusing-arrow -- This is much shorter than a for loop
		.map(segment => typeof segment === 'number' ? `[${segment}]` : segment)
		.join('.') as PropertyPath;
}

export function normalizePropertyPath(path: PropertyPath): PropertyPath {
	if (path === undefined) {
		return undefined;
	}

	const normalizedPath = path
		.replaceAll(/\.+/ug, '.')
		.replaceAll(/^\.|\.$/ug, '');

	return normalizedPath as PropertyPath;
}
