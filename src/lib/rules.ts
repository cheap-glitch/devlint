import { JsonObject, JsonValue } from 'type-fest';
import { JsonValue as JsonAst } from 'jsonast';

import { Line } from './helpers/text';
import { isJsonObjectValue } from './helpers/json';
import { FsPath, joinPathSegments } from './helpers/fs';
import { PropertiesPath, parsePropertiesPath, formatPropertiesPath } from './helpers/properties';

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
	InvalidData,
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
	target:      RuleTarget,
	parameters?: JsonValue,
}

export type RuleTarget = [FsPath, PropertiesPath];

export enum RuleStatus {
	Off     = 'off',
	Warning = 'warn',
	Error   = 'error',
	Skipped = 'skipped',
}

export function parseRules(ruleObject: JsonValue, selectedRules?: Array<string>): RulesMap {
	const rulesMap = new Map();

	for (const rule of parseRuleObject(ruleObject, [['.'], []])) {
		if (selectedRules !== undefined && !selectedRules.includes(rule.name)) {
			continue;
		}

		const [targetFsPath, targetPropertiesPath] = rule.target;
		if (targetFsPath.length === 0) {
			// TODO: report some error/warning?
			continue;
		}

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
	if (!isJsonObjectValue(ruleObject)) {
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
			const [fsPath, propertiesPath] = parentTarget;

			// The hashtag indicates the start of the properties path
			if (key.startsWith('#')) {
				if (propertiesPath.length > 0) {
					// TODO: throw an error here?
					return rules;
				}

				propertiesPath.push(key.slice(1));
			} else if (propertiesPath.length > 0) {
				propertiesPath.push(...parsePropertiesPath(key));
			} else {
				fsPath.push(key);
			}

			rules.push(...parseRuleObject(value, [fsPath, propertiesPath]));
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
