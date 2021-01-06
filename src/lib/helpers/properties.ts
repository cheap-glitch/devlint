export const PROPERTIES_PATH_STARTING_CHARACTER = '#';

export type PropertiesPath = Array<string | number>;

export function formatPropertiesPath(path: PropertiesPath): string {
	return path.map(pathSegment => (typeof pathSegment === 'number') ? ('[' + pathSegment + ']') : ('.' + pathSegment)).join('');
}

export function parsePropertiesPath(rawPath: string): PropertiesPath {
	return rawPath
		.replace(/\[(?<index>\d+)]/g, '.$<index>')
		.split('.').filter(Boolean)
		.map(pathSegment => /^\d+$/.test(pathSegment) ? Number.parseInt(pathSegment, 10) : pathSegment);
}
