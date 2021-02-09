import { FsPath, FsPathSegments, joinPathSegments, getPathHierarchy, tryGettingDirectoryEntries } from './fs';

// Export async function isPathIgnored(testedPath: FsPathSegments): Promise<boolean> {
// 	for (const path of getPathHierarchy(testedPath)) {
// 		if (await isGitRoot(path)) {
// 			break;
// 		}
// 	}

// 	return false;
// }

export async function findGitRepoRoot(startingPath: FsPathSegments): Promise<FsPath | undefined> {
	for (const path of getPathHierarchy(startingPath)) {
		if (await isGitRoot(path)) {
			return joinPathSegments(path);
		}
	}

	return undefined;
}

export async function isGitRoot(path: FsPathSegments): Promise<boolean> {
	const entries = await tryGettingDirectoryEntries(path);

	return entries !== undefined && entries.some(entry => entry.isDirectory() && entry.name === '.git');
}
