import mem from 'mem';
import expandGlob from 'tiny-glob';

import { getLines } from './helpers/text';
import { NestedSetMap } from './helpers/nested-set-map';
import { isGlobPattern, wrapInArray } from './helpers/utilities';
import { parsePropertyPath, normalizePropertyPath } from './helpers/properties';
import { joinPathSegments, getAbsolutePath, normalizePath, getFilenamesInDirectory, tryReadingFileContents } from './helpers/fs';
import { isJsonObject, isJsonArray, isJsonObjectAst, isJsonArrayAst, tryParsingJsonValue, tryParsingJsonAst, tryGettingJsonObjectProperty, tryGettingJsonAstProperty } from './helpers/json';
import { loadConfig } from './config';
import { RuleError, RuleErrorType } from './errors';
import { RuleTargetType, parseRules } from './rules';
import { processConditionalExpression } from './conditions';

import type { RuleResult } from './errors';
import type { RuleObject, RuleContext, RulesMap } from './rules';
import type { Line } from './helpers/text';
import type { FsPath } from './helpers/fs';
import type { PropertyPath } from './helpers/properties';
import type { JsonValue as JsonAst } from 'jsonast';
import type { JsonValue, JsonObject } from 'type-fest';

const BUILTIN_RULE_PLUGINS_DIR_PATH = [__dirname, 'rules'];
const BUILTIN_RULE_PLUGINS_FILENAMES = mem(() => getFilenamesInDirectory(BUILTIN_RULE_PLUGINS_DIR_PATH));

export interface LintResult {
	rule: RuleObject;
	status: LintStatus;
	target: [FsPath, PropertyPath];
	error?: RuleError;
}

export enum LintStatus {
	Success,
	Failure,
	SkippedForWrongTargetType,
	SkippedForUnfulfilledCondition,
}

export async function lint(directories: FsPath[], selectedRules?: string[]): Promise<Map<FsPath, { conditions: Map<string, boolean>; results: LintResult[] }>> {
	const results: Map<FsPath, { conditions: Map<string, boolean>; results: LintResult[] }> = new Map();
	for (const directory of directories) {
		// TODO [>=0.8.0]: avoid loading the config for every directory
		const config = await loadConfig();

		if (!isJsonObject(config.conditions)) {
			throw new Error('The value of "conditions" must be an object');
		}
		if (!isJsonObject(config.rules)) {
			throw new Error('The value of "rules" must be an object');
		}

		results.set(directory, await lintDirectory(directory, config.rules ?? {}, config.conditions ?? {}, selectedRules));
	}

	return results;
}

export async function lintDirectory(
	directory: FsPath,
	rulesObject: JsonObject,
	conditionsObject: JsonObject,
	selectedRules?: string[],
): Promise<{ conditions: Map<string, boolean>; results: LintResult[] }> {
	// eslint-disable-next-line new-cap -- Capitalization indicates the function will always return the same value
	const pluginsFilenames = await BUILTIN_RULE_PLUGINS_FILENAMES();

	const conditionsMap = new Map<string, boolean[]>();
	const conditionsRules: RulesMap<{ conditionName?: string; subConditionIndex?: number }> = new NestedSetMap();

	for (const [conditionName, conditionRulesObjects] of Object.entries(conditionsObject)) {
		conditionsMap.set(conditionName, []);

		for (const [subConditionIndex, subConditionRulesObject] of wrapInArray(conditionRulesObjects).entries()) {
			if (!isJsonObject(subConditionRulesObject)) {
				// TODO [>0.3.0]: Replace all plain Error with custom error classes
				throw new Error(`The value(s) of "${conditionName}" must be object(s)`);
			}

			parseRules(conditionsRules, subConditionRulesObject, {
				conditionName,
				subConditionIndex,
			});
		}
	}
	expandFsGlobs(directory, conditionsRules);

	// TODO [>=0.4.0]: Deduplicate the following code
	await Promise.allSettled(conditionsRules.entriesArray().map(async ([fsPath, fsTargetRules]) => {
		if (isGlobPattern(fsPath)) {
			return;
		}

		const fileContents = await tryReadingFileContents([directory, fsPath]);
		const lines = fileContents === undefined ? [] : getLines(fileContents);
		const jsonAst = fileContents === undefined ? new SyntaxError('Invalid JSON AST') : tryParsingJsonAst(fileContents);
		const jsonValue = fileContents === undefined ? new SyntaxError('Invalid JSON value') : tryParsingJsonValue(fileContents);

		for (const [propertyPath, propertyTargetRules] of fsTargetRules.entries()) {
			for (const rule of propertyTargetRules) {
				if (rule.conditionName === undefined || rule.subConditionIndex === undefined) {
					continue;
				}

				const subConditionsResults = conditionsMap.get(rule.conditionName);
				if (subConditionsResults === undefined) {
					continue;
				}
				if (subConditionsResults[rule.subConditionIndex] === false) {
					// For a sub-condition to be true, all of its rules must pass
					continue;
				}

				if (!pluginsFilenames.includes(rule.name + '.js')) {
					subConditionsResults[rule.subConditionIndex] = false;
					continue;
				}
				const { targetType, validator } = loadRulePlugin(rule.name);

				const result = executeRuleValidator(directory, rule, fsPath, propertyPath, targetType, validator, fileContents, lines, jsonValue, jsonAst);
				subConditionsResults[rule.subConditionIndex] = result === true;
			}
		}
	}));
	const conditions: Map<string, boolean> = new Map();
	for (const [conditionName, subConditionsResults] of conditionsMap.entries()) {
		conditions.set(conditionName, subConditionsResults.includes(true));
	}

	const rules: RulesMap = new NestedSetMap();
	parseRules(rules, rulesObject);
	expandFsGlobs(directory, rules);

	const results: LintResult[] = [];
	await Promise.allSettled(rules.entriesArray().map(async ([fsPath, fsTargetRules]) => {
		if (isGlobPattern(fsPath)) {
			return;
		}

		/*
		 * TODO [>=0.4.0]: don't try parsing files that don't need to be parsed
		 * TODO [>=0.5.0]: expand property-path globs
		 */
		const fileContents = await tryReadingFileContents([directory, fsPath]);
		const lines = fileContents === undefined ? [] : getLines(fileContents);
		const jsonAst = fileContents === undefined ? new SyntaxError('Invalid JSON AST') : tryParsingJsonAst(fileContents);
		const jsonValue = fileContents === undefined ? new SyntaxError('Invalid JSON value') : tryParsingJsonValue(fileContents);

		for (const [propertyPath, propertyTargetRules] of fsTargetRules.entries()) {
			// TODO [>=4.0.0]: filter some rules with wrong target type here? (e.g.: file-based rule targeting a directory)
			for (const rule of propertyTargetRules) {
				if (selectedRules !== undefined && !selectedRules.includes(rule.name)) {
					continue;
				}

				if (conditions.size > 0 && rule.condition !== undefined && !processConditionalExpression(conditions, rule.condition)) {
					results.push({
						rule,
						target: [fsPath, propertyPath],
						status: LintStatus.SkippedForUnfulfilledCondition,
					});
					continue;
				}

				if (!pluginsFilenames.includes(rule.name + '.js')) {
					results.push({
						rule,
						target: [fsPath, propertyPath],
						status: LintStatus.Failure,
						error: new RuleError(RuleErrorType.UnknownRule),
					});
					continue;
				}

				const { targetType, validator } = loadRulePlugin(rule.name);
				const result = executeRuleValidator(directory, rule, fsPath, propertyPath, targetType, validator, fileContents, lines, jsonValue, jsonAst);

				if (result instanceof RuleError) {
					results.push({
						rule,
						target: [fsPath, propertyPath],
						status: LintStatus.Failure,
						error: result,
					});
					continue;
				}

				results.push({
					rule,
					target: [fsPath, propertyPath],
					status: LintStatus.Success,
				});
			}
		}
	}));

	return { conditions, results };
}

function executeRuleValidator(
	workingDirectory: FsPath,
	rule: RuleObject,
	fsPath: FsPath,
	propertyPath: PropertyPath,
	targetType: RuleTargetType,
	validator: (context: RuleContext) => RuleResult,
	fileContents: string | undefined,
	lines: Line[],
	jsonValue: JsonValue | SyntaxError,
	jsonAst: JsonAst | SyntaxError,
): LintStatus | RuleResult {
	const isRuleStrict = rule.isStrict ?? false;
	const isRulePermissive = rule.isPermissive ?? false;

	/**
	 * Directory
	 */
	if (targetType === RuleTargetType.DirectoryListing) {
		if (propertyPath !== undefined) {
			return isRulePermissive ? LintStatus.SkippedForWrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
		}

		/*
		 * TODO [>=0.4.0]: fetch directory listing only once
		 * TODO [>=0.5.0]: test that the path is also an accessible directory
		 */
		return validator(buildRuleContext({
			workingDirectory: joinPathSegments([workingDirectory, fsPath]),
			parameter: rule.parameter,
		}));
	}

	/**
	 * File
	 */
	if (targetType === RuleTargetType.FileContents) {
		if (propertyPath !== undefined) {
			return isRulePermissive ? LintStatus.SkippedForWrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
		}
		if (fileContents === undefined) {
			return isRuleStrict ? new RuleError(RuleErrorType.MissingTarget) : true;
		}

		return validator(buildRuleContext({ contents: fileContents, lines, parameter: rule.parameter }));
	}

	/**
	 * JSON property/value
	 */
	if (fileContents === undefined) {
		return isRuleStrict ? new RuleError(RuleErrorType.MissingTarget) : true;
	}
	if (jsonValue instanceof SyntaxError) {
		// TODO [>=0.3.0]: exploit line & column numbers
		return new RuleError(jsonValue.message ?? 'invalid JSON encountered');
	}
	if (jsonAst instanceof SyntaxError) {
		// TODO [>=0.3.0]: exploit line & column numbers
		return new RuleError(jsonAst.message ?? 'invalid JSON encountered');
	}
	if ((targetType === RuleTargetType.JsonValue || targetType === RuleTargetType.JsonString) && propertyPath === undefined) {
		return new RuleError(RuleErrorType.InvalidTargetType);
	}

	const propertyPathSegments = parsePropertyPath(propertyPath);
	const propertyValue = tryGettingJsonObjectProperty(jsonValue, propertyPathSegments);
	const propertyAst = tryGettingJsonAstProperty(jsonAst, propertyPathSegments);

	if (propertyValue === undefined || propertyAst === undefined) {
		return isRuleStrict ? new RuleError(RuleErrorType.MissingTarget) : true;
	}

	const context = buildRuleContext({
		contents: fileContents.slice(propertyAst.pos.start.char, propertyAst.pos.end.char + 1),
		lines: lines?.slice(propertyAst.pos.start.line - 1, propertyAst.pos.end.line) ?? [],
		parameter: rule.parameter,
	});

	switch (targetType) {
		case RuleTargetType.JsonValue:
			context.jsonValue = propertyValue;
			context.jsonAst = propertyAst;
			break;

		case RuleTargetType.JsonObject:
			if (!isJsonObject(propertyValue) || !isJsonObjectAst(propertyAst)) {
				return isRulePermissive ? LintStatus.SkippedForWrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
			}
			context.jsonObject = propertyValue;
			context.jsonObjectAst = propertyAst;
			break;

		case RuleTargetType.JsonArray:
			if (!isJsonArray(propertyValue) || !isJsonArrayAst(propertyAst)) {
				/*
				 * Allow rules targeting arrays to also work on primitive values (i.e. consider primitive values as arrays containing a single element)
				 * TODO [>=0.4.0]: is this behavior always useful/wanted?
				 */
				if (!isJsonObject(propertyValue) && !isJsonObjectAst(propertyAst)) {
					context.jsonArray = [propertyValue];
					context.jsonArrayAst = {
						type: 'array',
						pos: propertyAst.pos,
						elements: [propertyAst],
					};
					break;
				}

				return isRulePermissive ? LintStatus.SkippedForWrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
			}
			context.jsonArray = propertyValue;
			context.jsonArrayAst = propertyAst;
			break;

		case RuleTargetType.JsonString:
			if (typeof propertyValue !== 'string' || propertyAst.type !== 'string') {
				return isRulePermissive ? LintStatus.SkippedForWrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
			}
			context.jsonString = propertyValue;
			context.jsonAst = propertyAst;
			break;

		default: throw new Error(`Invalid rule target type "${targetType}"`);
	}

	return validator(context);
}

function loadRulePlugin(pluginName: string): { targetType: RuleTargetType; validator: (context: RuleContext) => RuleResult } {
	// eslint-disable-next-line @typescript-eslint/no-var-requires -- Allows loading only the necessary plugins
	const plugin = require(getAbsolutePath([...BUILTIN_RULE_PLUGINS_DIR_PATH, pluginName + '.js']));
	if (plugin.targetType === undefined) {
		throw new Error(`Missing target type for rule "${pluginName}"`);
	}
	if (plugin.validator === undefined) {
		throw new Error(`Missing validator function for rule "${pluginName}"`);
	}

	return plugin;
}

async function expandFsGlobs(workingDirectory: FsPath, rules: RulesMap): Promise<void> {
	await Promise.allSettled(rules.entriesArray().map(async ([fsPath, fsTargetRules]) => {
		if (!isGlobPattern(fsPath)) {
			return;
		}

		const paths = await expandGlob(fsPath, {
			dot: true,
			cwd: workingDirectory,
			filesOnly: !fsPath.endsWith('/'),
		});
		for (const path of paths) {
			for (const [propertyPath, propertyTargetRules] of fsTargetRules.entries()) {
				rules.set(normalizePath(path), normalizePropertyPath(propertyPath), propertyTargetRules);
			}
		}
	}));
}

export function buildRuleContext(data: Partial<RuleContext>): RuleContext {
	return {
		workingDirectory: '.',
		contents: '',
		lines: [],
		jsonValue: {},
		jsonObject: {},
		jsonArray: [],
		jsonString: '',
		jsonAst: {
			type: 'object',
			pos: {
				start: {
					line: 1,
					column: 1,
					char: 0,
				},
				end: {
					line: 1,
					column: 1,
					char: 1,
				},
			},
		},
		jsonObjectAst: {
			type: 'object',
			pos: {
				start: {
					line: 1,
					column: 1,
					char: 0,
				},
				end: {
					line: 1,
					column: 1,
					char: 1,
				},
			},
		},
		jsonArrayAst: {
			type: 'array',
			pos: {
				start: {
					line: 1,
					column: 1,
					char: 0,
				},
				end: {
					line: 1,
					column: 1,
					char: 1,
				},
			},
		},
		parameter: '',
		...data,
	};
}
