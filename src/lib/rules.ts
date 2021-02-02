import { JsonValue, JsonObject } from 'type-fest';
import { JsonValue as JsonAst, JsonObject as JsonObjectAst } from 'jsonast';

import { Line } from './helpers/text';
import { isJsonObject } from './helpers/json';
import { FsPath, joinPathSegments } from './helpers/fs';
import { PROPERTIES_PATH_STARTING_CHARACTER, PropertiesPathSegments, parsePropertiesPath } from './helpers/properties';

import { RuleError, RuleErrorType } from './errors';

export type RuleResult = true | RuleError;

export { RuleError, RuleErrorType };

export interface RuleContext {
	directories:   Array<string>,
	filenames:     Array<string>,
	contents:      string,
	lines:         Array<Line>,
	jsonValue:     JsonValue,
	jsonObject:    JsonObject,
	jsonString:    string,
	jsonAst:       JsonAst,
	jsonObjectAst: JsonObjectAst,
	parameter:     JsonValue,
}

export interface RuleObject {
	name:       string
	status:     RuleStatus,
	target:     RuleTarget,
	parameter?: JsonValue,
	condition?: string,
	permissive: boolean,
}

export type RuleTarget = [FsPath, PropertiesPathSegments];

export enum RuleTargetType {
	DirectoryListing,
	FileContents,
	JsonValue,
	JsonObject,
	JsonString,
}

export enum RuleStatus {
	Off      = 'off',
	Warning  = 'warn',
	Error    = 'error',
	Skipped  = 'skipped',
}

export function buildRuleContext(data: Partial<RuleContext>): RuleContext {
	return {
		filenames:     [],
		directories:   [],
		contents:      '',
		lines:         [],
		jsonValue:     {},
		jsonObject:    {},
		jsonString:    '',
		jsonAst:       { type: 'object', pos: { start: { line: 1, column: 1, char: 0 }, end: { line: 1, column: 1, char: 1 } } },
		jsonObjectAst: { type: 'object', pos: { start: { line: 1, column: 1, char: 0 }, end: { line: 1, column: 1, char: 1 } } },
		parameter:     '',
		...data,
	};
}

export function parseRules(rulesObject: JsonValue): Array<RuleObject> {
	if (!isJsonObject(rulesObject)) {
		return [];
	}

	return parseRulesObject(rulesObject, ['.', []]);
}

function parseRulesObject(rulesObject: JsonObject, parentTarget: RuleTarget): Array<RuleObject> {
	const rules: Array<RuleObject> = [];

	for (const [key, value] of Object.entries(rulesObject)) {
		if (value === null) {
			throw new Error(`invalid rules config: "${key}" has a value of \`null\``);
		}

		// Rule state
		if (typeof value === 'string' || typeof value === 'number') {
			const ruleStatus = parseRuleStatus(value);
			if (ruleStatus === RuleStatus.Off) {
				continue;
			}

			const rule: RuleObject = {
				name:       parseRuleName(key),
				status:     ruleStatus,
				target:     parentTarget,
				permissive: key.includes('?'),
			};
			const condition = parseRuleCondition(key);
			if (condition !== undefined) {
				rule.condition = condition;
			}

			rules.push(rule);
			continue;
		}

		// Rule state and parameter
		if (Array.isArray(value)) {
			if (value.length !== 2) {
				throw new Error(`invalid rules config: the value of "${key}" must be an array of two elements`);
			}

			const [rawStatus, ruleParameter] = value;
			if (typeof rawStatus !== 'string') {
				throw new TypeError(`invalid rules config: the status of "${key}" must be a string`);
			}

			const ruleStatus = parseRuleStatus(rawStatus);
			if (ruleStatus === RuleStatus.Off) {
				continue;
			}

			const rule: RuleObject = {
				name:       parseRuleName(key),
				status:     ruleStatus,
				target:     parentTarget,
				parameter:  ruleParameter,
				permissive: key.includes('?'),
			};
			const condition = parseRuleCondition(key);
			if (condition !== undefined) {
				rule.condition = condition;
			}

			rules.push(rule);
			continue;
		}

		// Sub-target
		if (typeof value === 'object') {
			const [parentFsPath, parentPropertiesPath] = parentTarget;
			const childFsPath         = [parentFsPath];
			const childPropertiesPath = [...parentPropertiesPath];

			// The hashtag indicates the start of the properties path
			if (key.includes(PROPERTIES_PATH_STARTING_CHARACTER)) {
				if (parentPropertiesPath.length > 0) {
					throw new Error(`invalid rules config: "${key}" starts a property path inside another property path`);
				}

				const [fsPath, propertyPath] = key.split('#', 2);
				if (fsPath !== undefined && fsPath.length > 0) {
					childFsPath.push(fsPath);
				}
				if (propertyPath !== undefined && propertyPath.length > 0) {
					childPropertiesPath.push(...parsePropertiesPath(propertyPath));
				}
			} else if (parentPropertiesPath.length > 0) {
				childPropertiesPath.push(...parsePropertiesPath(key));
			} else {
				childFsPath.push(key);
			}

			rules.push(...parseRulesObject(value, [joinPathSegments(childFsPath), childPropertiesPath]));
			continue;
		}

		throw new Error(`invalid rules config: "${key}"`);
	}

	return rules;
}

function parseRuleName(name: string): string {
	return name.replace(/\(\w+\)/, '').replace('?', '').trim();
}

function parseRuleCondition(name: string): string | undefined {
	return name.match(/\((?<condition>\w+)\)/)?.groups?.condition;
}

function parseRuleStatus(status: number | string): RuleStatus {
	switch (status) {
		case 0: case 'off':   return RuleStatus.Off;
		case 1: case 'warn':  return RuleStatus.Warning;
		case 2: case 'error': return RuleStatus.Error;
	}

	return RuleStatus.Off;
}
