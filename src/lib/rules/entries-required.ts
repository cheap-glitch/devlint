import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.DirectoryListing;

export function validator({ filenames, directories, parameter: requiredEntries }: RuleContext): RuleResult {
	if (!Array.isArray(requiredEntries)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const entry of requiredEntries) {
		if (typeof entry !== 'string') {
			return new RuleError(RuleErrorType.InvalidParameter);
		}

		if (entry.endsWith('/')) {
			if (!directories.includes(entry.slice(0, -1))) {
				return new RuleError(`directory "${entry}/" is required`);
			}
		} else if (!filenames.includes(entry)) {
			return new RuleError(`file "${entry}" is required`);
		}
	}

	return true;
}
