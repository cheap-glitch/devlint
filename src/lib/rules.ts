import { JsonValue, JsonObject, JsonArray } from 'type-fest';
import { JsonValue as JsonAst, JsonObject as JsonObjectAst, JsonArray as JsonArrayAst } from 'jsonast';

import { Line } from './helpers/text';
import { NestedSetMap, insertInNestedSetMap } from './helpers/utilities';
import { FsPath, joinPathSegments, normalizePath } from './helpers/fs';
import { PROPERTY_PATH_STARTING_CHARACTER, PropertyPath, joinPropertyPathSegments, normalizePropertyPath } from './helpers/properties';

export { RuleResult, RuleError, RuleErrorType } from './errors';

export interface RuleObject {
	name:          string
	status:        RuleStatus,
	parameter?:    JsonValue,
	condition?:    { name: string, isNegated: boolean },
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

export type RulesMap = NestedSetMap<FsPath, PropertyPath, RuleObject>;

export function parseRules(rulesMap: RulesMap, rulesObject: JsonObject): Array<RuleObject> {
	const rulesList: Array<RuleObject> = [];
	// TODO: wrap function call in try/catch block?
	parseRulesObject(rulesMap, rulesList, rulesObject, '.' as FsPath, undefined as PropertyPath);

	return rulesList;
}

function parseRulesObject(rulesMap: RulesMap, rulesList: Array<RuleObject>, rulesObject: JsonObject, fsPath: FsPath, propertyPath: PropertyPath): void {
	for (const [key, value] of Object.entries(rulesObject)) {
		if (value === null) {
			throw new Error(`invalid rule declaration: "${key}" has a value of \`null\``);
		}

		// Rule definition
		if (typeof value === 'string' || typeof value === 'number' || Array.isArray(value)) {
			const ruleName = key;
			if (Array.isArray(value) && value.length !== 2) {
				throw new TypeError(`invalid rule declaration: the value of "${ruleName}" must be an array of two elements`);
			}

			const rawStatus = Array.isArray(value) ? value[0] : value;
			if (typeof rawStatus !== 'string' && typeof rawStatus !== 'number') {
				throw new TypeError(`invalid rule declaration: the status of "${ruleName}" must be a string of a number`);
			}

			const status = parseRuleStatus(rawStatus, ruleName);
			if (status === RuleStatus.Off) {
				continue;
			}

			const parameter = Array.isArray(value) ? value[1] : undefined;
			for (const ruleDeclaration of ruleName.split(',')) {
				const match = ruleDeclaration.trim().match(/^(?<name>[\w-]+)(?<flags>[!?]{0,2})(?: *\((?<condition>(?: *!?\w+)(?: +(?:&&|\|\|) +(?:!?\w+) *)*)\))?$/u);
				if (!match || !match.groups || !match.groups.name) {
					// TODO: don't throw an error here?
					throw new Error(`invalid rule declaration: "${ruleDeclaration}"`);
				}

				const ruleObject: RuleObject = { name: match.groups.name, status };
				if (parameter !== undefined) {
					ruleObject.parameter = parameter;
				}
				if (match.groups.flags.includes('!')) {
					ruleObject.isStrict = true;
				}
				if (match.groups.flags.includes('?')) {
					ruleObject.isPermissive = true;
				}
				if (match.groups.condition !== undefined) {
					ruleObject.condition = match.groups.condition.replaceAll(/ {2,}/ug, ' ').trim();
				}

				rulesList.push(ruleObject);
				insertInNestedSetMap(rulesMap, normalizePath(fsPath), normalizePropertyPath(propertyPath), ruleObject);
			}

			continue;
		}

		// Sub-target
		if (typeof value === 'object') {
			const target = key;
			if (target.includes(PROPERTY_PATH_STARTING_CHARACTER)) {
				if (propertyPath !== undefined) {
					throw new Error(`invalid rule declaration: "${target}" starts a property path inside another property path`);
				}

				const [fsSubpath, propertySubpath] = target.split('#', 2);

				parseRulesObject(rulesMap, rulesList, value, joinPathSegments([fsPath, fsSubpath]), propertySubpath as PropertyPath);
				continue;
			}

			if (propertyPath !== undefined) {
				parseRulesObject(rulesMap, rulesList, value, fsPath, joinPropertyPathSegments([propertyPath, target]));
				continue;
			}

			parseRulesObject(rulesMap, rulesList, value, joinPathSegments([fsPath, target]), propertyPath);
			continue;
		}

		throw new Error(`invalid rule declaration: "${key}"`);
	}
}

function parseRuleStatus(rawStatus: number | string, ruleName: string): RuleStatus {
	switch (rawStatus) {
		case 0: case 'off':   return RuleStatus.Off;
		case 1: case 'warn':  return RuleStatus.Warning;
		case 2: case 'error': return RuleStatus.Error;

		default: throw new Error(`invalid rule declaration: "${ruleName}" has an invalid status of "${rawStatus}"`);
	}
}
