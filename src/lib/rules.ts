import { JsonObject, JsonValue } from 'type-fest';
import { JsonValue as JsonAst } from 'jsonast';

import { Line } from '../helpers/text';
import { joinPathSegments } from '../helpers/fs';

export type RuleResult = true | RuleError;

export class RuleError extends Error {
	readonly type:    RuleErrorType;
	readonly message: string;
	readonly start:   RuleErrorLocation | undefined;
	readonly end:     RuleErrorLocation | undefined;

	constructor(data: string | RuleErrorType, start?: RuleErrorLocation, end?: RuleErrorLocation) {
		const message = typeof data === 'string' ? data : '';
		super(message);
		this.message = message;

		this.type  = typeof data === 'number' ? data : RuleErrorType.Failed;
		this.start = start;
		this.end   = end;
	}
}

export enum RuleErrorType {
	UnknownRule,
	MissingData,
	InvalidParameters,
	Failed,
}

export interface RuleErrorLocation {
	line:   number,
	column: number,
	char:   number,
}

export interface RuleContext {
	contents:    string,
	lines:       Array<Line>,
	jsonObject?: JsonObject,
	jsonAst?:    JsonAst,
	parameters?: JsonValue,
}

export type RulesMap = Map<string, Map<string, Array<RuleObject>>>;

export interface RuleObject {
	name:        string
	status:      RuleStatus,
	target:      Array<string>,
	parameters?: JsonValue,
}

export enum RuleStatus {
	Off     = 'off',
	Warning = 'warn',
	Error   = 'error',
	Skipped = 'skipped',
}

export function parseRules(ruleObject: JsonValue): RulesMap {
	const rulesMap = new Map();

	for (const rule of parseRuleObject(ruleObject, ['.'])) {
		const [targetFilePath, targetPropertiesPathSegments] = splitTargetPaths(rule.target);
		if (targetFilePath === undefined || targetPropertiesPathSegments === undefined) {
			// TODO: report some error/warning?
			continue;
		}

		const targetPropertiesPath = targetPropertiesPathSegments.join('.');
		rule.target = targetPropertiesPathSegments;

		// Group rules by file targets and then by property paths
		const targetFileRules = rulesMap.get(targetFilePath);
		if (targetFileRules !== undefined) {
			const targetRules = targetFileRules.get(targetPropertiesPath);
			if (targetRules !== undefined) {
				targetRules.push(rule);
			} else {
				targetFileRules.set(targetPropertiesPath, [rule]);
			}
		} else {
			rulesMap.set(targetFilePath, new Map([[targetPropertiesPath, [rule]]]));
		}
	}

	return rulesMap;
}

// Extract and merge the file path segments together while splitting the properties path as needed
function splitTargetPaths(target: Array<string>): [string, Array<string>] | [undefined, undefined] {
	const separatorIndex         = target.indexOf('#');
	const filePathSegments       = separatorIndex !== -1 ? target.slice(0, separatorIndex)  : target;
	const propertiesPathSegments = separatorIndex !== -1 ? target.slice(separatorIndex + 1) : [];

	// Return `undefined` if the target is missing a file path
	if (filePathSegments.length === 0) {
		return [undefined, undefined];
	}

	return [joinPathSegments(filePathSegments), propertiesPathSegments.flatMap(segment => segment.split('.')).filter(Boolean)];
}

function parseRuleObject(ruleObject: JsonValue, parentTarget: Array<string>): Array<RuleObject> {
	if (ruleObject === null || typeof ruleObject !== 'object' || Array.isArray(ruleObject)) {
		return [];
	}

	return Object.entries(ruleObject).reduce((rules: Array<RuleObject>, [key, value]) => {
		if (value === null) {
			// TODO: throw an error here?
			return rules;
		}

		// Rule state
		if (typeof value === 'string' || typeof value === 'number') {
			const status = parseRuleStatus(value);
			if (status !== RuleStatus.Off) {
				rules.push({ name: key, status, parameters: undefined, target: parentTarget });
			}
		}

		// Rule state and parameters
		if (Array.isArray(value) && value.length >= 2) {
			const rawStatus = value[0];
			if (typeof rawStatus !== 'string') {
				// TODO: throw an error here?
				return rules;
			}

			const status = parseRuleStatus(rawStatus);
			if (status !== RuleStatus.Off) {
				rules.push({ name: key, status, parameters: value[1], target: parentTarget });
			}
		}

		// Sub-target
		if (typeof value === 'object') {
			const childTarget = key.startsWith('#') ? ['#', key.slice(1)] : [key];

			rules.push(...parseRuleObject(value, [...parentTarget, ...childTarget]));
		}

		return rules;
	}, []);
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
