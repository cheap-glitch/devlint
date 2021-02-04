import { tryGettingPathStats } from '../helpers/fs';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.DirectoryListing;

export async function validator({ workingDirectory, parameter: forbiddenEntries }: RuleContext): Promise<RuleResult> {
	if (!Array.isArray(forbiddenEntries)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const path of forbiddenEntries) {
		if (typeof path !== 'string') {
			return new RuleError(RuleErrorType.InvalidParameter);
		}

		const isDirPath  =  path.endsWith('/');
		const isFilePath = !path.endsWith('/');

		// TODO: normalize the path
		const stats = await tryGettingPathStats([workingDirectory, path]);

		if (stats !== undefined && ((isDirPath && stats.isDirectory()) || (isFilePath && stats.isFile()))) {
			return new RuleError(`${isDirPath ? 'directory' : 'file'} "${path}" is forbidden`);
		}
	}

	return true;
}
