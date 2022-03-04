import { posix } from 'path';
import { readFile as fsReadFile, readdir as fsReadDirectory, stat as fsGetStats } from 'fs/promises';

import type { Opaque } from 'type-fest';
import type { Stats as FsStats, Dirent as DirectoryEntry } from 'fs';

export type FsPath = Opaque<string, 'FsPath'>;
export type FsPathSegments = string[];

export async function tryGettingDirectoryEntries(path: FsPathSegments): Promise<DirectoryEntry[] | undefined> {
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

export async function getFilenamesInDirectory(path: FsPathSegments, filter?: (file: DirectoryEntry) => boolean): Promise<string[]> {
	const directoryEntries = await fsReadDirectory(getAbsolutePath(path), {
		encoding: 'utf8',
		withFileTypes: true,
	});

	return directoryEntries
		.filter(directoryEntry => directoryEntry.isFile() && (filter === undefined || filter(directoryEntry)))
		.map(directoryEntry => directoryEntry.name);
}

export function readFileContents(path: FsPathSegments): string {
	return fsReadFile(getAbsolutePath(path), { encoding: 'utf8' });
}

export function getPathHierarchy(path: FsPathSegments): FsPathSegments[] {
	return ['/', ...getAbsolutePath(path).split('/').filter(Boolean)].map((_, index, pathSegments) => pathSegments.slice(0, pathSegments.length - index));
}

export function getAbsolutePath(pathSegments: string[]): FsPath {
	return posix.resolve(joinPathSegments(pathSegments)) as FsPath;
}

export function joinPathSegments(pathSegments: string[]): FsPath {
	return posix.join(...pathSegments) as FsPath;
}

export function normalizePath(path: string): FsPath {
	return posix.normalize(path) as FsPath;
}
