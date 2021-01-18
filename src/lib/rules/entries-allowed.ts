import { matchStrings } from './helpers';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.DirectoryListing;

export function validator({ filenames, directories, parameter: allowedEntries }: RuleContext): RuleResult {
	if (!Array.isArray(allowedEntries)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	directories: for (const directory of directories) {
		for (const entry of allowedEntries) {
			if (typeof entry !== 'string') {
				return new RuleError(RuleErrorType.InvalidParameter);
			}

			if (entry.endsWith('/') && matchStrings(entry.slice(0, -1), directory)) {
				continue directories;
			}
		}

		return new RuleError(`directory "${directory}" isn't allowed`);
	}

	filenames: for (const filename of filenames) {
		for (const entry of allowedEntries) {
			if (typeof entry !== 'string') {
				return new RuleError(RuleErrorType.InvalidParameter);
			}

			if (!entry.endsWith('/') && matchStrings(entry, filename)) {
				continue filenames;
			}
		}

		return new RuleError(`file "${filename}" isn't allowed`);
	}

	return true;
}
