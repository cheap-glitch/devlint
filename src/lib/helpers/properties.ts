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
		.map(pathSegment => {
			if (/^\d+|\[\d+]$/u.test(pathSegment)) {
				return Number.parseInt(pathSegment.replaceAll(/^\[|]$/ug, ''));
			}

			return pathSegment;
		});
}

export function joinPropertyPathSegments(segments: PropertyPathSegments): PropertyPath {
	const path: string[] = [];
	for (segment of segments) {
		if (typeof segment === 'number') {
			path.push(`[${pathSegment}]`);
		}

		path.push(segment);
	}

	return path.join('.') as PropertyPath;
}

export function normalizePropertyPath(path: PropertyPath): PropertyPath {
	if (path === undefined) {
		return undefined;
	}

	// TODO [>=0.4.0]: Can this be replaced with `trim('.')`?
	const normalizedPath = path
		.replaceAll(/\.+/ug, '.')
		.replaceAll(/^\.|\.$/ug, '');

	return normalizedPath as PropertyPath;
}
