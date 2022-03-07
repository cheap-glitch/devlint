import { tryGettingPathStats } from '../helpers/fs';
import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.DirectoryListing;

export async function validator({ workingDirectory, parameter: forbiddenPaths }: RuleContext): Promise<RuleResult> {
	if (!Array.isArray(forbiddenPaths)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const path of forbiddenPaths) {
		if (typeof path !== 'string') {
			return new RuleError(RuleErrorType.InvalidParameter);
		}

		const isFilePath = !path.endsWith('/');
		const isDirectoryPath = path.endsWith('/');

		/*
		 * TODO [>=0.4.0]: normalize the path?
		 * TODO [>=0.5.0]: expand globs here?
		 */
		const stats = await tryGettingPathStats([workingDirectory, path]);
		if (isDirectoryPath && stats?.isDirectory() || isFilePath && stats?.isFile()) {
			return new RuleError(`${isDirectoryPath ? 'directory' : 'file'} "${path}" is forbidden`);
		}
	}

	return true;
}
