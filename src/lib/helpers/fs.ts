import { posix } from 'path';
import { Dirent } from 'fs';
import { readFile, readdir } from 'fs/promises';

export async function getFilenamesInDirectory(path: string, filter?: (file: Dirent) => boolean): Promise<Array<string>> {
	return (await readdir(path, { withFileTypes: true }))
		.filter(directoryEntry => directoryEntry.isFile() && (filter === undefined || filter(directoryEntry)))
		.map(directoryEntry => directoryEntry.name);
}

export async function tryReadingFileContents(path: string): Promise<string | Error> {
	let contents;
	try {
		contents = await readFileContents(path);
	} catch(error) {
		return new Error(error.message);
	}

	return contents;
}

export async function readFileContents(path: string): Promise<string> {
	return readFile(path, { encoding: 'utf8' });
}

export function getAbsolutePath(pathSegments: Array<string>): string {
	return posix.resolve(joinPathSegments(pathSegments));
}

export function joinPathSegments(pathSegments: Array<string>): string {
	return posix.join(...pathSegments);
}
