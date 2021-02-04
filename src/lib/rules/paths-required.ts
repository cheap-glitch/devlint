import { tryGettingPathStats } from '../helpers/fs';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.DirectoryListing;

export async function validator({ workingDirectory, parameter: requiredEntries }: RuleContext): Promise<RuleResult> {
	if (!Array.isArray(requiredEntries)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const path of requiredEntries) {
		if (typeof path !== 'string') {
			return new RuleError(RuleErrorType.InvalidParameter);
		}

		const isDirPath  =  path.endsWith('/');
		const isFilePath = !path.endsWith('/');

		// TODO: normalize the path
		const stats = await tryGettingPathStats([workingDirectory, path]);

		if (stats === undefined || (isDirPath && !stats.isDirectory()) || (isFilePath && !stats.isFile())) {
			return new RuleError(`required ${isDirPath ? 'directory' : 'file'} "${path}" is missing`);
		}
	}

	return true;
}
