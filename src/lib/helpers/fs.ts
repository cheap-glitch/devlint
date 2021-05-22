import { posix } from 'path';
import { Stats as FsStats, Dirent as DirectoryEntry } from 'fs';
import { readFile as fsReadFile, readdir as fsReadDirectory, stat as fsGetStats } from 'fs/promises';

export type FsPath         = string;
export type FsPathSegments = Array<string>;

export async function tryGettingDirectoryEntries(path: FsPathSegments): Promise<Array<DirectoryEntry> | undefined> {
	let entries;
	try {
		entries = await fsReadDirectory(getAbsolutePath(path), { encoding: 'utf8', withFileTypes: true });
	} catch {
		return undefined;
	}

	return entries;
}

export async function tryReadingFileContents(path: FsPathSegments): Promise<string | undefined> {
	let contents;
	try {
		contents = await readFileContents(path);
	} catch {
		return undefined;
	}

	return contents;
}

export async function tryGettingPathStats(path: FsPathSegments): Promise<FsStats | undefined> {
	let stats;
	try {
		stats = await fsGetStats(getAbsolutePath(path));
	} catch {
		return undefined;
	}

	return stats;
}

export async function getFilenamesInDirectory(path: FsPathSegments, filter?: (file: DirectoryEntry) => boolean): Promise<Array<string>> {
	return (await fsReadDirectory(getAbsolutePath(path), { encoding: 'utf8', withFileTypes: true }))
		.filter(directoryEntry => directoryEntry.isFile() && (filter === undefined || filter(directoryEntry)))
		.map(directoryEntry => directoryEntry.name);
}

export async function readFileContents(path: FsPathSegments): Promise<string> {
	return fsReadFile(getAbsolutePath(path), { encoding: 'utf8' });
}

export function getPathHierarchy(path: FsPathSegments): Array<FsPathSegments> {
	return ['/', ...getAbsolutePath(path).split('/').filter(Boolean)].map((_, index, pathSegments) => pathSegments.slice(0, pathSegments.length - index));
}

export function getAbsolutePath(pathSegments: Array<string>): string {
	return posix.resolve(joinPathSegments(pathSegments));
}

export function normalizePath(path: string): string {
	return posix.normalize(path);
}

export function joinPathSegments(pathSegments: Array<string>): string {
	return posix.join(...pathSegments);
}
