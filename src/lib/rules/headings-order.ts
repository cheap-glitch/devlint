import { findMatchLocation } from '../helpers/text';
import { parseMarkdownHeadings, getMarkdownHeadings, isMatchingHeading } from '../helpers/markdown';
import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ contents, lines, parameter: rawHeadings }: RuleContext): RuleResult {
	if (!Array.isArray(rawHeadings)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const headings = parseMarkdownHeadings(rawHeadings);
	if (headings instanceof Error) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const textHeadings = getMarkdownHeadings(contents);

	let lastIndex = -1;
	for (const textHeading of textHeadings) {
		const index = headings.findIndex(heading => isMatchingHeading(textHeading, heading));
		if (index === -1) {
			continue;
		}
		if (index >= lastIndex) {
			lastIndex = index;
			continue;
		}

		const headingBefore = headings
			.slice(0, index)
			.reverse()
			.find(previousHeading => textHeadings.some(heading => isMatchingHeading(previousHeading, heading)));

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- In this case, there's always at least one heading after the current one
		const headingAfter = headings
			.slice(index + 1)
			.find(nextHeading => textHeadings.some(heading => isMatchingHeading(nextHeading, heading)))!;

		if (headingBefore !== undefined) {
			return new RuleError(
				`heading "${textHeading.text}" should be placed between "${headingBefore.text}" and "${headingAfter.text}"`,
				findMatchLocation(lines, textHeading.fullMatch, textHeading.char),
				lines,
			);
		}

		return new RuleError(
			`heading "${textHeading.text}" should be placed before "${headingAfter.text}"`,
			findMatchLocation(lines, textHeading.fullMatch, textHeading.char),
			lines,
		);
	}

	return true;
}
