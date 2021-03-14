import { findMatchLocation } from '../helpers/text';
import { parseMarkdownHeaders, getMarkdownHeaders, isMatchingHeader } from '../helpers/markdown';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ contents, lines, parameter: rawHeaders }: RuleContext): RuleResult {
	if (!Array.isArray(rawHeaders)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const headers = parseMarkdownHeaders(rawHeaders);
	if (headers instanceof Error) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const textHeaders = getMarkdownHeaders(contents);

	let lastIndex = -1;
	for (const textHeader of textHeaders) {
		const index = headers.findIndex(header => isMatchingHeader(textHeader, header));
		if (index === -1) {
			continue;
		}
		if (index >= lastIndex) {
			lastIndex = index;
			continue;
		}

		const headerBefore = headers.slice(0, index).reverse().find(header => textHeaders.some(textHeader => isMatchingHeader(textHeader, header)));
		const headerAfter  = headers.slice(index + 1).find(header => textHeaders.some(textHeader => isMatchingHeader(textHeader, header)));

		if (headerBefore !== undefined && headerAfter !== undefined) {
			return new RuleError(
				`header "${textHeader.text}" should be placed between "${headerBefore.text}" and "${headerAfter.text}"`,
				findMatchLocation(lines, textHeader.fullMatch, textHeader.char),
				lines
			);
		}

		if (headerAfter !== undefined) {
			return new RuleError(
				`header "${textHeader.text}" should be placed before "${headerAfter.text}"`,
				findMatchLocation(lines, textHeader.fullMatch, textHeader.char),
				lines
			);
		}

		/* istanbul ignore next */
		return new RuleError(`header "${textHeader.text}" isn't placed in the right order`, findMatchLocation(lines, textHeader.fullMatch, textHeader.char), lines);
	}

	return true;
}
