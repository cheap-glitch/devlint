import { findMatchLocation } from '../helpers/text';
import { parseMarkdownHeadings, getMarkdownHeadings, isMatchingHeading } from '../helpers/markdown';
import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ contents, lines, parameter: rawHeadings }: RuleContext): RuleResult {
	if (!Array.isArray(rawHeadings)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const forbiddenHeadings = parseMarkdownHeadings(rawHeadings);
	if (forbiddenHeadings instanceof Error) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const heading of getMarkdownHeadings(contents)) {
		if (forbiddenHeadings.some(forbiddenHeading => isMatchingHeading(heading, forbiddenHeading))) {
			return new RuleError(`heading "${heading.text}" is forbidden`, findMatchLocation(lines, heading.fullMatch, heading.char), lines);
		}
	}

	return true;
}
