import { matchStrings } from './helpers';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.DirectoryListing;

export function validator({ filenames, directories, parameter: forbiddenEntries }: RuleContext): RuleResult {
	if (!Array.isArray(forbiddenEntries)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const entry of forbiddenEntries) {
		if (typeof entry !== 'string') {
			return new RuleError(RuleErrorType.InvalidParameter);
		}

		if (entry.endsWith('/')) {
			for (const directory of directories) {
				if (matchStrings(entry.slice(0, -1), directory)) {
					return new RuleError(`directory "${directory}" is forbidden`);
				}
			}
		} else {
			for (const filename of filenames) {
				if (matchStrings(entry, filename)) {
					return new RuleError(`file "${filename}" is forbidden`);
				}
			}
		}
	}

	return true;
}
