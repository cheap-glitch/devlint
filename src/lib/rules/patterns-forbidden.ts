import { isRegex, findMatchLocation } from '../helpers/text';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ contents, lines, parameter: forbiddenPatterns }: RuleContext): RuleResult {
	if (!Array.isArray(forbiddenPatterns)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const pattern of forbiddenPatterns) {
		if (typeof pattern !== 'string') {
			return new RuleError(RuleErrorType.InvalidParameter);
		}

		let match = undefined;
		let matchIndex = -1;
		if (isRegex(pattern)) {
			const results = contents.match(new RegExp(pattern.slice(1, -1)));
			if (results) {
				match = results[0];
				matchIndex = results?.index ?? -1;
			}
		} else {
			match = pattern;
			matchIndex = contents.indexOf(pattern);
		}

		if (match !== undefined && matchIndex !== -1) {
			return new RuleError(`pattern "${match}" is forbidden`, findMatchLocation(lines, match, matchIndex), lines);
		}
	}

	return true;
}
