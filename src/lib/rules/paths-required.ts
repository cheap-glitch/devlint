import { tryGettingPathStats } from '../helpers/fs';
import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.DirectoryListing;

export async function validator({ workingDirectory, parameter: requiredPaths }: RuleContext): Promise<RuleResult> {
	if (!Array.isArray(requiredPaths)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const path of requiredPaths) {
		if (typeof path !== 'string') {
			return new RuleError(RuleErrorType.InvalidParameter);
		}

		const isFilePath = !path.endsWith('/');
		const isDirectoryPath = path.endsWith('/');

		const stats = await tryGettingPathStats([workingDirectory, path]);
		if (!stats || isDirectoryPath && !stats.isDirectory() || isFilePath && !stats.isFile()) {
			return new RuleError(`required ${isDirectoryPath ? 'directory' : 'file'} "${path}" is missing`);
		}
	}

	return true;
}
