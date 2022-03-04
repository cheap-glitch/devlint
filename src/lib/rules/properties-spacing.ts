import { RuleTargetType, RuleError, RuleErrorType } from '../rules';

import type { RuleContext, RuleResult } from '../rules';

export const targetType = RuleTargetType.JsonObject;

export function validator({ lines, jsonObjectAst, parameter: spacing }: RuleContext): RuleResult {
	if (spacing !== 'around' && spacing !== 'between') {
		return new RuleError(RuleErrorType.InvalidParameter);
	}
	if (jsonObjectAst.members === undefined) {
		return true;
	}

	for (const [propertyIndex, { key, value: jsonObjectAstValue }] of jsonObjectAst.members.entries()) {
		let errorMessage: string | undefined;

		const lineAbove = lines[key.pos.start.line - 2]?.text;
		if (spacing === 'between' && propertyIndex === 0) {
			if (lineAbove === '') {
				errorMessage = 'extra empty line above property key';
			}
		} else if (lineAbove !== '') {
			errorMessage = 'missing empty line above property key';
		}

		if (errorMessage !== undefined) {
			return new RuleError(errorMessage, { start: key.pos.start, end: key.pos.start }, lines);
		}

		const lineBelow = lines[jsonObjectAstValue.pos.end.line].text;
		if (spacing === 'between' && propertyIndex === jsonObjectAst.members.length - 1) {
			if (lineBelow === '') {
				errorMessage = 'extra empty line below property value';
			}
		} else if (lineBelow !== '') {
			errorMessage = 'missing empty line below property value';
		}

		if (errorMessage !== undefined) {
			return new RuleError(errorMessage, { start: jsonObjectAstValue.pos.end, end: jsonObjectAstValue.pos.end }, lines);
		}
	}

	return true;
}
