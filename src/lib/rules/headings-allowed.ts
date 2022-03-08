import { findMatchLocation } from '../helpers/text';
import { parseMarkdownHeadings, getMarkdownHeadings, isMatchingHeading } from '../helpers/markdown';
import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ contents, lines, parameter: rawHeadings }: RuleContext): RuleResult {
	if (!Array.isArray(rawHeadings)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const allowedHeadings = parseMarkdownHeadings(rawHeadings);
	if (allowedHeadings instanceof Error) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const checkedLevels = new Set(allowedHeadings.map(({ level }) => level));
	for (const heading of getMarkdownHeadings(contents)) {
		if (!checkedLevels.has(0) && !checkedLevels.has(heading.level)) {
			continue;
		}

		if (allowedHeadings.every(allowedHeading => !isMatchingHeading(heading, allowedHeading))) {
			return new RuleError(`heading "${heading.text}" is not allowed`, findMatchLocation(lines, heading.fullMatch, heading.char), lines);
		}
	}

	return true;
}
