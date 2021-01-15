import { posix } from 'path';
import { Dirent } from 'fs';
import { readFile, readdir } from 'fs/promises';

export type FsPath = Array<string>;

export async function tryGettingDirectoryListing(path: FsPath): Promise<{ filenames: Array<string>, directories: Array<string> } | undefined> {
	let entries;
	try {
		entries = await readdir(getAbsolutePath(path), { encoding: 'utf8', withFileTypes: true });
	} catch {
		return undefined;
	}

	const filenames:   Array<string> = [];
	const directories: Array<string> = [];
	for (const entry of entries) {
		if (entry.isFile()) {
			filenames.push(entry.name);
		} else if (entry.isDirectory()) {
			directories.push(entry.name);
		}
	}

	return { filenames, directories };
}

export async function tryReadingFileContents(path: FsPath): Promise<string | undefined> {
	let contents;
	try {
		contents = await readFileContents(path);
	} catch {
		return undefined;
	}

	return contents;
}

export async function getFilenamesInDirectory(path: FsPath, filter?: (file: Dirent) => boolean): Promise<Array<string>> {
	return (await readdir(getAbsolutePath(path), { encoding: 'utf8', withFileTypes: true }))
		.filter(directoryEntry => directoryEntry.isFile() && (filter === undefined || filter(directoryEntry)))
		.map(directoryEntry => directoryEntry.name);
}

export async function readFileContents(path: FsPath): Promise<string> {
	return readFile(getAbsolutePath(path), { encoding: 'utf8' });
}

export function getAbsolutePath(pathSegments: Array<string>): string {
	return posix.resolve(joinPathSegments(pathSegments));
}

export function joinPathSegments(pathSegments: Array<string>): string {
	return posix.join(...pathSegments);
}
