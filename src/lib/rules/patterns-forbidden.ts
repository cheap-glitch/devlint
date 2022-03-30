import { isRegex, buildRegex, findMatchLocation } from '../helpers/text';
import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ contents, lines, parameter: forbiddenPatterns }: RuleContext): RuleResult {
	if (!Array.isArray(forbiddenPatterns)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const pattern of forbiddenPatterns) {
		if (typeof pattern !== 'string') {
			return new RuleError(RuleErrorType.InvalidParameter);
		}

		let match;
		let matchIndex = -1;
		if (isRegex(pattern)) {
			const results = contents.match(buildRegex(pattern));
			if (results) {
				match = results[0];
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- If there's a result, it also has an index
				matchIndex = results.index!;
			}
		} else {
			match = pattern;
			matchIndex = contents.indexOf(pattern);
		}

		if (match !== undefined && matchIndex !== -1) {
			return new RuleError(`pattern ${JSON.stringify(match)} is forbidden`, findMatchLocation(lines, match, matchIndex), lines);
		}
	}

	return true;
}
