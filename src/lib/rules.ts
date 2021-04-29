import { JsonValue, JsonObject, JsonArray } from 'type-fest';
import { JsonValue as JsonAst, JsonObject as JsonObjectAst, JsonArray as JsonArrayAst } from 'jsonast';

import { Line } from './helpers/text';
import { isJsonObject } from './helpers/json';
import { FsPath, joinPathSegments } from './helpers/fs';
import { PROPERTY_PATH_STARTING_CHARACTER, PropertyPathSegments, parsePropertyPath } from './helpers/properties';

export { RuleResult, RuleError, RuleErrorType } from './errors';

export enum RuleStatus {
	Off      = 'off',
	Warning  = 'warn',
	Error    = 'error',
}

export type RuleTarget = [FsPath, PropertyPathSegments];

export enum RuleTargetType {
	DirectoryListing,
	FileContents,
	JsonValue,
	JsonObject,
	JsonArray,
	JsonString,
}

export interface RuleObject {
	name:                     string
	status:                   RuleStatus,
	target:                   RuleTarget,
	parameter?:               JsonValue,
	condition?:               string,
	conditionExpectedResult?: boolean,
	isPermissive?:            boolean,
}

export interface RuleContext {
	workingDirectory: string,
	contents:         string,
	lines:            Array<Line>,
	jsonValue:        JsonValue,
	jsonObject:       JsonObject,
	jsonArray:        JsonArray,
	jsonString:       string,
	jsonAst:          JsonAst,
	jsonObjectAst:    JsonObjectAst,
	jsonArrayAst:     JsonArrayAst,
	parameter:        JsonValue,
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
			throw new Error(`invalid rule configuration: "${key}" has a value of \`null\``);
		}

		// Rule state
		if (typeof value === 'string' || typeof value === 'number') {
			const status = parseRuleStatus(value);
			if (status === RuleStatus.Off) {
				continue;
			}

			rules.push(...buildRuleObjects(key, status, parentTarget));
			continue;
		}

		// Rule state and parameter
		if (Array.isArray(value)) {
			if (value.length !== 2) {
				throw new Error(`invalid rule configuration: the value of "${key}" must be an array of two elements`);
			}

			const [rawStatus, parameter] = value;
			if (typeof rawStatus !== 'string' && typeof rawStatus !== 'number') {
				throw new TypeError(`invalid rule configuration: the status of "${key}" must be a string`);
			}

			const status = parseRuleStatus(rawStatus);
			if (status === RuleStatus.Off) {
				continue;
			}

			rules.push(...buildRuleObjects(key, status, parentTarget, parameter));
			continue;
		}

		// Sub-target
		if (typeof value === 'object') {
			const [parentFsPath, parentPropertyPath] = parentTarget;
			const childFsPath         = [parentFsPath];
			const childPropertyPath = [...parentPropertyPath];

			// The hashtag indicates the start of the property path
			if (key.includes(PROPERTY_PATH_STARTING_CHARACTER)) {
				if (parentPropertyPath.length > 0) {
					throw new Error(`invalid rule configuration: "${key}" starts a property path inside another property path`);
				}

				const [fsPath, propertyPath] = key.split('#', 2);
				if (fsPath !== undefined && fsPath.length > 0) {
					childFsPath.push(fsPath);
				}
				if (propertyPath !== undefined && propertyPath.length > 0) {
					childPropertyPath.push(...parsePropertyPath(propertyPath));
				}
			} else if (parentPropertyPath.length > 0) {
				childPropertyPath.push(...parsePropertyPath(key));
			} else {
				childFsPath.push(key);
			}

			rules.push(...parseRulesObject(value, [joinPathSegments(childFsPath), childPropertyPath]));
			continue;
		}

		throw new Error(`invalid rule configuration: "${key}"`);
	}

	return rules;
}

function buildRuleObjects(key: string, status: RuleStatus, target: RuleTarget, parameter?: JsonValue): Array<RuleObject> {
	return key.split(',').map(ruleDeclaration => {
		const match = ruleDeclaration.trim().match(/^(?<name>[\w-]+)\??(?: *\((?<not>!)?(?<condition>\w+)\))?$/);
		if (!match || !match.groups || !match.groups.name) {
			throw new Error(`invalid rule declaration: "${ruleDeclaration}"`);
		}

		const rule: RuleObject = { name: match.groups.name, status, target };

		if (parameter !== undefined) {
			rule.parameter = parameter;
		}
		if (ruleDeclaration.includes('?')) {
			rule.isPermissive = true;
		}
		if (match.groups.condition !== undefined) {
			rule.condition = match.groups.condition;
		}
		if (match.groups.not !== undefined) {
			rule.conditionExpectedResult = false;
		}

		return rule;
	});
}

function parseRuleStatus(status: number | string): RuleStatus {
	switch (status) {
		case 0: case 'off':   return RuleStatus.Off;
		case 1: case 'warn':  return RuleStatus.Warning;
		case 2: case 'error': return RuleStatus.Error;
	}

	return RuleStatus.Off;
}
