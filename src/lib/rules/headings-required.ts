import { parseMarkdownHeadings, getMarkdownHeadings, isMatchingHeading } from '../helpers/markdown';
import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ contents, parameter: rawHeadings }: RuleContext): RuleResult {
	if (!Array.isArray(rawHeadings)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const requiredHeadings = parseMarkdownHeadings(rawHeadings);
	if (requiredHeadings instanceof Error) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const headings = getMarkdownHeadings(contents);

	for (const requiredHeading of requiredHeadings) {
		if (!headings.some(heading => isMatchingHeading(heading, requiredHeading))) {
			return new RuleError(`required heading "${requiredHeading.text}" is missing`);
		}
	}

	return true;
}
