import { JsonValue } from 'type-fest';
import { JsonValue as JsonAst, Position as JsonAstPosition } from 'jsonast';

import { Line } from './helpers/text';
import { Snippet, cutSnippet } from './helpers/snippets';
import { isJsonValueObject } from './helpers/json';
import { FsPath, joinPathSegments } from './helpers/fs';
import { PROPERTIES_PATH_STARTING_CHARACTER, PropertiesPath, parsePropertiesPath, formatPropertiesPath } from './helpers/properties';

export type RuleResult = true | RuleError;

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
	InvalidData,
	InvalidParameter,
	Failed,
}

export interface RuleErrorLocation {
	line:   number,
	column: number,
	char:   number,
}

export interface RuleContext {
	contents:   string,
	lines:      Array<Line>,
	jsonValue?: JsonValue,
	jsonAst?:   JsonAst,
	parameter?: JsonValue,
}

export type RulesMap = Map<string, Map<string, Array<RuleObject>>>;

export interface RuleObject {
	name:       string
	status:     RuleStatus,
	target:     RuleTarget,
	parameter?: JsonValue,
}

export type RuleTarget = [FsPath, PropertiesPath];

export enum RuleStatus {
	Off     = 'off',
	Warning = 'warn',
	Error   = 'error',
	Skipped = 'skipped',
}

export function parseRules(ruleObject: JsonValue, selectedRules?: Array<string>): RulesMap {
	const rules = parseRuleObject(ruleObject, [['.'], []]);

	const rulesMap = new Map();
	for (const rule of rules) {
		if (selectedRules !== undefined && !selectedRules.includes(rule.name)) {
			continue;
		}

		const [targetFsPath, targetPropertiesPath] = rule.target;
		const targetFsPathString         = joinPathSegments(targetFsPath);
		const targetPropertiesPathString = formatPropertiesPath(targetPropertiesPath);

		// Group rules by file targets and then by property paths
		const targetFileRules = rulesMap.get(targetFsPathString);
		if (targetFileRules !== undefined) {
			const targetRules = targetFileRules.get(targetPropertiesPathString);
			if (targetRules !== undefined) {
				targetRules.push(rule);
			} else {
				targetFileRules.set(targetPropertiesPathString, [rule]);
			}
		} else {
			rulesMap.set(targetFsPathString, new Map([[targetPropertiesPathString, [rule]]]));
		}
	}

	return rulesMap;
}

function parseRuleObject(ruleObject: JsonValue, parentTarget: RuleTarget): Array<RuleObject> {
	if (!isJsonValueObject(ruleObject)) {
		return [];
	}

	const rules: Array<RuleObject> = [];
	for (const [key, value] of Object.entries(ruleObject)) {
		if (value === null) {
			// TODO: throw an error here?
			continue;
		}

		// Rule state
		if (typeof value === 'string' || typeof value === 'number') {
			const status = parseRuleStatus(value);
			if (status !== RuleStatus.Off) {
				rules.push({ name: key, status, parameter: undefined, target: parentTarget });
			}

			continue;
		}

		// Rule state and parameter
		if (Array.isArray(value)) {
			if (value.length !== 2) {
				// TODO: throw an error here?
				continue;
			}

			const [rawStatus, parameter] = value;
			if (typeof rawStatus !== 'string') {
				// TODO: throw an error here?
				continue;
			}

			const status = parseRuleStatus(rawStatus);
			if (status !== RuleStatus.Off) {
				rules.push({ name: key, status, parameter, target: parentTarget });
			}

			continue;
		}

		// Sub-target
		if (typeof value === 'object') {
			const [parentFsPath, parentPropertiesPath] = parentTarget;
			const childFsPath         = [...parentFsPath];
			const childPropertiesPath = [...parentPropertiesPath];

			// The hashtag indicates the start of the properties path
			if (key.startsWith(PROPERTIES_PATH_STARTING_CHARACTER)) {
				if (parentPropertiesPath.length > 0) {
					// TODO: throw an error here?
					continue;
				}

				childPropertiesPath.push(...parsePropertiesPath(key.slice(1)));
			} else if (parentPropertiesPath.length > 0) {
				childPropertiesPath.push(...parsePropertiesPath(key));
			} else {
				childFsPath.push(key);
			}

			rules.push(...parseRuleObject(value, [childFsPath, childPropertiesPath]));
		}
	}

	return rules;
}

function parseRuleStatus(status: number | string): RuleStatus {
	switch (status) {
		case 0:
		case 'off':   return RuleStatus.Off;

		case 1:
		case 'warn':  return RuleStatus.Warning;

		case 2:
		case 'error': return RuleStatus.Error;
	}

	return RuleStatus.Off;
}
