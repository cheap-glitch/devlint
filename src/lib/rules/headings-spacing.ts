import { Line, countWord } from '../helpers/text';
import { isMarkdownHeading } from '../helpers/markdown';
import { isJsonObject, matchJsonValues } from '../helpers/json';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ lines, parameter: optionsObject }: RuleContext): RuleResult {
	if (!isJsonObject(optionsObject) ||
	    Object.keys(optionsObject).some(key => !['above', 'below', 'collapse', 'ignoreAboveFirst'].includes(key)) ||
	    !matchJsonValues({ 'above?': Number, 'below?': Number, 'collapse?': Boolean, 'ignoreAboveFirst?': Boolean }, optionsObject)
	) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const spacingAbove    = typeof optionsObject.above === 'number' ? Math.max(0, optionsObject.above) : undefined;
	const spacingBelow    = typeof optionsObject.below === 'number' ? Math.max(0, optionsObject.below) : undefined;
	const collapseSpacing = optionsObject.below !== undefined ? (optionsObject.collapse ?? true) : false;

	let currentSpacing = 0;
	let lastNonEmptyLine: Line | undefined;
	for (const line of lines) {
		if (line.text.length === 0) {
			currentSpacing ++;
			continue;
		}

		if (lastNonEmptyLine === undefined) {
			lastNonEmptyLine = line;
			if (optionsObject.ignoreAboveFirst ?? true) {
				continue;
			}
		}

		const isCurrentLineHeading      = isMarkdownHeading(line.text);
		const isLastNonEmptyLineHeading = isMarkdownHeading(lastNonEmptyLine.text);

		if (spacingAbove !== undefined && isCurrentLineHeading) {
			let requiredSpacing: number | undefined;
			if (!isLastNonEmptyLineHeading && currentSpacing !== spacingAbove) {
				requiredSpacing = spacingAbove;
			}
			if (isLastNonEmptyLineHeading && !collapseSpacing && currentSpacing !== spacingAbove + (spacingBelow ?? 0)) {
				requiredSpacing = spacingAbove + (spacingBelow ?? 0);
			}

			if (requiredSpacing !== undefined) {
				return new RuleError(`heading must have ${countWord(requiredSpacing, 'empty line')} above it`, { start: { line: line.number, column: 1, char: line.char } }, lines);
			}
		}
		if (spacingBelow !== undefined && !isCurrentLineHeading && isLastNonEmptyLineHeading && currentSpacing !== spacingBelow) {
			return new RuleError(`heading must have ${countWord(spacingBelow, 'empty line')} below it`, { start: { line: lastNonEmptyLine.number, column: 1, char: lastNonEmptyLine.char } }, lines);
		}

		currentSpacing   = 0;
		lastNonEmptyLine = line;
	}

	return true;
}
