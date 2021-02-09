import { matchStrings } from '../helpers/text';
import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.FileContents;

export function validator({ lines, parameter: forbiddenLines }: RuleContext): RuleResult {
	if (!Array.isArray(forbiddenLines)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	for (const forbiddenLine of forbiddenLines) {
		if (typeof forbiddenLine !== 'string') {
			return new RuleError(RuleErrorType.InvalidParameter);
		}

		const index = lines.findIndex(line => matchStrings(forbiddenLine, line.text));
		if (index !== -1) {
			continue;
		}

		return new RuleError('line is forbidden', {
			start: { line: index + 1, column: 1,                            char: lines[index].char },
			end:   { line: index + 1, column: lines[index].text.length + 1, char: lines[index].char + lines[index].text.length },
		});
	}

	return true;
}
