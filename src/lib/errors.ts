import { Position as JsonAstPosition } from 'jsonast';

import { Line } from './helpers/text';
import { Snippet, cutSnippet } from './helpers/snippets';

export class RuleError extends Error {
	readonly type:     RuleErrorType;
	readonly start?:   RuleErrorLocation;
	readonly end?:     RuleErrorLocation;
	readonly snippet?: Snippet;

	constructor(errorType: RuleErrorType);
	constructor(message: string, start?: RuleErrorLocation, end?: RuleErrorLocation, lines?: Array<Line>);
	constructor(message: string, jsonAstPosition?: JsonAstPosition, lines?: Array<Line>);
	constructor(
		errorTypeOrMessage: string | RuleErrorType,
		startOrJsonAstPos?: RuleErrorLocation | JsonAstPosition,
		endOrLines?: RuleErrorLocation | Array<Line>,
		lines?: Array<Line>
	) {
		// Set the error message
		super(typeof errorTypeOrMessage === 'string' ? errorTypeOrMessage : '');

		this.type  = typeof errorTypeOrMessage === 'number' ? errorTypeOrMessage : RuleErrorType.Failed;
		this.start = (startOrJsonAstPos && 'start' in startOrJsonAstPos) ? { ...startOrJsonAstPos.start } : startOrJsonAstPos;
		this.end   = (startOrJsonAstPos &&   'end' in startOrJsonAstPos) ? { ...startOrJsonAstPos.end   } : !Array.isArray(endOrLines) ? endOrLines : undefined;

		if (this.start && this.end) {
			if (Array.isArray(endOrLines)) {
				this.snippet = cutSnippet(endOrLines, this.start, this.end);
			} else if (lines) {
				this.snippet = cutSnippet(lines, this.start, this.end);
			}
		}

		// Fix the prototype's name
		// https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
		Object.setPrototypeOf(this, RuleError.prototype);
	}
}

export enum RuleErrorType {
	UnknownRule,
	InvalidTargetType,
	InvalidParameter,
	Failed,
}

export interface RuleErrorLocation {
	line:   number,
	column: number,
	char:   number,
}
