export type PropertiesPath = Array<string | number>;

export function formatPropertiesPath(path: PropertiesPath): string {
	return path.length > 0 ? ('.' + path.map(pathSegment => typeof pathSegment === 'number' ? ('[' + pathSegment + ']') : pathSegment).join('.')) : '';
}

export function parsePropertiesPath(rawPath: string): PropertiesPath {
	return rawPath.split('.').filter(Boolean).map(pathSegment => /^\d+$/.test(pathSegment) ? Number.parseInt(pathSegment, 10) : pathSegment);
}
