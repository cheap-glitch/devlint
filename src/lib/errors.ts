import { Position as JsonAstLocation } from 'jsonast';

import { Line } from './helpers/text';
import { Snippet, cutSnippet } from './helpers/snippets';

export class RuleError extends Error {
	readonly type:     RuleErrorType;
	readonly start?:   RuleErrorPosition;
	readonly end?:     RuleErrorPosition;
	readonly snippet?: Snippet;

	constructor(errorType: RuleErrorType);
	constructor(message: string, location?: RuleErrorLocation | JsonAstLocation, lines?: Array<Line>);
	constructor(
		errorTypeOrMessage: RuleErrorType | string,
		location?: RuleErrorLocation | JsonAstLocation,
		lines?: Array<Line>
	) {
		// Set the error message
		super(typeof errorTypeOrMessage === 'string' ? errorTypeOrMessage : '');

		this.type  = typeof errorTypeOrMessage === 'number' ? errorTypeOrMessage : RuleErrorType.Failed;
		this.start = location?.start;
		this.end   = location?.end;

		if (this.start !== undefined && this.end !== undefined && lines !== undefined) {
			this.snippet = cutSnippet(lines, this.start, this.end);
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
	InvalidJson,
}

export interface RuleErrorLocation {
	start?: RuleErrorPosition,
	end?:   RuleErrorPosition,
}

export interface RuleErrorPosition {
	line:   number,
	column: number,
	char:   number,
}
