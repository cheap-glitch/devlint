import { JsonValue, JsonObject, JsonArray } from 'type-fest';
import { JsonValue as JsonAst, JsonObject as JsonObjectAst, JsonArray as JsonArrayAst } from 'jsonast';

import { Line } from './helpers/text';
import { isJsonObject } from './helpers/json';
import { insertInNestedSetMap } from './helpers/utilities';
import { FsPath, joinPathSegments } from './helpers/fs';
import { PROPERTY_PATH_STARTING_CHARACTER, PropertyPath, joinPropertyPathSegments } from './helpers/properties';

export { RuleResult, RuleError, RuleErrorType } from './errors';

export interface RuleObject {
	name:          string
	status:        RuleStatus,
	parameter?:    JsonValue,
	condition?:    { name: string, negated: boolean },
	isStrict?:     boolean,
	isPermissive?: boolean,
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

export enum RuleTargetType {
	DirectoryListing,
	FileContents,
	JsonValue,
	JsonObject,
	JsonArray,
	JsonString,
}

export enum RuleStatus {
	Off      = 'off',
	Warning  = 'warn',
	Error    = 'error',
}

type RulesMap = Map<FsPath, Map<PropertyPath, Set<RuleObject>>>;

export function parseRules(rulesObject: JsonValue): RulesMap {
	if (!isJsonObject(rulesObject)) {
		return new Map();
	}

	return parseRulesObject(new Map(), rulesObject, ['.', undefined]);
}

function parseRulesObject(rulesMap: RulesMap, rulesObject: JsonObject, [fsPath, propertyPath]: [FsPath, PropertyPath]): RulesMap {
	for (const [key, value] of Object.entries(rulesObject)) {
		if (value === null) {
			throw new Error(`invalid rule declaration: "${key}" has a value of \`null\``);
		}

		// Rule definition
		if (typeof value === 'string' || typeof value === 'number' || Array.isArray(value)) {
			if (Array.isArray(value) && value.length !== 2) {
				throw new Error(`invalid rule declaration: the value of "${key}" must be an array of two elements`);
			}

			const rawStatus = Array.isArray(value) ? value[0] : value;
			if (typeof rawStatus !== 'string' && typeof rawStatus !== 'number') {
				throw new TypeError(`invalid rule declaration: the status of "${key}" must be a string of a number`);
			}

			const status = parseRuleStatus(rawStatus);
			if (status === RuleStatus.Off) {
				continue;
			}

			// TODO: normalize property path ↓
			insertInNestedSetMap(rulesMap, fsPath, propertyPath, buildRuleObjects(key, status, Array.isArray(value) ? value[1] : undefined));
			continue;
		}

		// Sub-target
		if (typeof value === 'object') {
			if (key.includes(PROPERTY_PATH_STARTING_CHARACTER)) {
				if (propertyPath !== undefined) {
					throw new Error(`invalid rule declaration: "${key}" starts a property path inside another property path`);
				}

				const [fsSubpath, propertySubpath] = key.split('#', 2);

				parseRulesObject(rulesMap, value, [joinPathSegments([fsPath, fsSubpath]), propertySubpath]);
				continue;
			}

			if (propertyPath !== undefined) {
				parseRulesObject(rulesMap, value, [fsPath, joinPropertyPathSegments([propertyPath, key])]);
				continue;
			}

			parseRulesObject(rulesMap, value, [joinPathSegments([fsPath, key]), undefined]);
			continue;
		}

		throw new Error(`invalid rule declaration: "${key}"`);
	}

	return rulesMap;
}

function parseRuleStatus(rawStatus: number | string): RuleStatus {
	switch (rawStatus) {
		case 0: case 'off':   return RuleStatus.Off;
		case 1: case 'warn':  return RuleStatus.Warning;
		case 2: case 'error': return RuleStatus.Error;

		default: throw new Error(`invalid rule declaration: "${rawStatus}" status is invalid`);
	}
}

function buildRuleObjects(key: string, status: RuleStatus, parameter?: JsonValue): Set<RuleObject> {
	const ruleObjects: Set<RuleObject> = new Set();
	for (const ruleDeclaration of key.split(',')) {
		const match = ruleDeclaration.trim().match(/^(?<name>[\w-]+)(?<flags>[!?]{0,2})(?: *\((?<not>!)?(?<condition>\w+)\))?$/);
		if (!match || !match.groups || !match.groups.name) {
			// TODO: don't throw an error here?
			throw new Error(`invalid rule declaration: "${ruleDeclaration}"`);
		}

		const rule: RuleObject = { name: match.groups.name, status };

		if (parameter !== undefined) {
			rule.parameter = parameter;
		}
		if (match.groups.flags.includes('!')) {
			rule.isStrict = true;
		}
		if (match.groups.flags.includes('?')) {
			rule.isPermissive = true;
		}
		if (match.groups.condition !== undefined) {
			rule.condition = {
				name:    match.groups.condition,
				negated: match.groups.not !== undefined,
			};
		}

		ruleObjects.add(rule);
	}

	return ruleObjects;
}
