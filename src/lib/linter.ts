import mem from 'mem';
import expandGlob from 'tiny-glob';
import { JsonValue as JsonAst } from 'jsonast';
import { JsonValue, JsonObject } from 'type-fest';

import { Line, getLines } from './helpers/text';
import { PropertyPath, parsePropertyPath, normalizePropertyPath } from './helpers/properties';
import { isJsonObject, isJsonArray, isJsonObjectAst, isJsonArrayAst } from './helpers/json';
import { NestedSetMap, isGlobPattern, wrapInArray, insertInNestedSetMap } from './helpers/utilities';
import { tryParsingJsonValue, tryParsingJsonAst, tryGettingJsonObjectProperty, tryGettingJsonAstProperty } from './helpers/json';
import { FsPath, joinPathSegments, getAbsolutePath, normalizePath, getFilenamesInDirectory, tryReadingFileContents } from './helpers/fs';

import { loadConfig } from './config';
import { RuleResult, RuleError, RuleErrorType } from './errors';
import { RuleTargetType, RuleObject, RuleContext, RulesMap, parseRules } from './rules';

const BUILTIN_RULE_PLUGINS_DIR_PATH  = [__dirname, 'rules'];
const BUILTIN_RULE_PLUGINS_FILENAMES = mem(() => getFilenamesInDirectory(BUILTIN_RULE_PLUGINS_DIR_PATH));

export interface LintResult {
	rule:   RuleObject,
	status: LintStatus,
	target: [FsPath, PropertyPath],
	error?: RuleError,
}

export enum LintStatus {
	Success,
	Failure,
	SkippedForWrongTargetType,
	SkippedForUnfulfilledCondition,
}

export async function lint(directories: Array<FsPath>, selectedRules?: Array<string>): Promise<Map<FsPath, { conditions: Map<string, boolean>, results: Array<LintResult> }>> {
	const results: Map<FsPath, { conditions: Map<string, boolean>, results: Array<LintResult> }> = new Map();
	for (const directory of directories) {
		// TODO: avoid loading the config for every directory
		const config = await loadConfig();
		if (!isJsonObject(config.rules) || !isJsonObject(config.conditions)) {
			throw new Error('invalid config: conditions & rules definitions must be objects');
		}

		results.set(directory, await lintDirectory(directory, config.rules ?? {}, config.conditions ?? {}, selectedRules));
	}

	return results;
}

export async function lintDirectory(directory: FsPath, rulesObject: JsonObject, conditionsObject: JsonObject, selectedRules?: Array<string>): Promise<{ conditions: Map<string, boolean>, results: Array<LintResult> }> {
	const pluginsFilenames = await BUILTIN_RULE_PLUGINS_FILENAMES();

	const conditionsMap: Map<string, Array<boolean>> = new Map();
	const conditionsRules: NestedSetMap<FsPath, PropertyPath, RuleObject & { conditionName?: string, subConditionIndex?: number }> = new Map();
	for (const [conditionName, conditionRulesObjects] of Object.entries(conditionsObject)) {
		conditionsMap.set(conditionName, []);

		for (const [subConditionIndex, subConditionRulesObject] of wrapInArray(conditionRulesObjects).entries()) {
			if (!isJsonObject(subConditionRulesObject)) {
				// TODO: error message
				throw new Error('TODO');
			}

			const addedRules: Array<RuleObject & { conditionName?: string, subConditionIndex?: number }> = parseRules(conditionsRules, subConditionRulesObject);
			for (const rule of addedRules) {
				rule.conditionName     = conditionName;
				rule.subConditionIndex = subConditionIndex;
			}
		}
	}
	expandFsGlobs(directory, conditionsRules);

	// TODO: deduplicate following code
	await Promise.allSettled([...conditionsRules.entries()].map(async ([fsPath, fsTargetRules]) => {
		if (isGlobPattern(fsPath)) {
			return;
		}

		const fileContents = await tryReadingFileContents([directory, fsPath]);
		const lines        = fileContents !== undefined ? getLines(fileContents)            : [];
		const jsonValue    = fileContents !== undefined ? tryParsingJsonValue(fileContents) : new SyntaxError();
		const jsonAst      = fileContents !== undefined ? tryParsingJsonAst(fileContents)   : new SyntaxError();

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

				const result = await executeRuleValidator(directory, rule, fsPath, propertyPath, targetType, validator, fileContents, lines, jsonValue, jsonAst);
				subConditionsResults[rule.subConditionIndex] = result === true;
			}
		}
	}));
	const conditions: Map<string, boolean> = new Map();
	for (const [conditionName, subConditionsResults] of conditionsMap.entries()) {
		conditions.set(conditionName, subConditionsResults.includes(true));
	}

	const rules: RulesMap = new Map();
	parseRules(rules, rulesObject);
	expandFsGlobs(directory, rules);

	const results: Array<LintResult> = [];
	await Promise.allSettled([...rules.entries()].map(async ([fsPath, fsTargetRules]) => {
		if (isGlobPattern(fsPath)) {
			return;
		}

		// TODO: expand property-path globs
		// TODO: don't try parsing files that don't need to be parsed
		const fileContents = await tryReadingFileContents([directory, fsPath]);
		const lines        = fileContents !== undefined ? getLines(fileContents)            : [];
		const jsonValue    = fileContents !== undefined ? tryParsingJsonValue(fileContents) : new SyntaxError();
		const jsonAst      = fileContents !== undefined ? tryParsingJsonAst(fileContents)   : new SyntaxError();

		for (const [propertyPath, propertyTargetRules] of fsTargetRules.entries()) {
			// TODO: filter some rules with wrong target type here? (e.g.: file-based rule targeting a directory)
			for (const rule of propertyTargetRules) {
				if (selectedRules !== undefined && !selectedRules.includes(rule.name)) {
					continue;
				}

				if (conditions.size > 0 && rule.condition !== undefined) {
					const conditionState = conditions.get(rule.condition.name);
					if (conditionState === undefined) {
						// TODO: return a failure result instead of throwing
						throw new Error(`unknown condition "${rule.condition.name}"`);
					}

					if (conditionState === rule.condition.isNegated) {
						results.push({ rule, target: [fsPath, propertyPath], status: LintStatus.SkippedForUnfulfilledCondition });
						continue;
					}
				}

				if (!pluginsFilenames.includes(rule.name + '.js')) {
					results.push({ rule, target: [fsPath, propertyPath], status: LintStatus.Failure, error: new RuleError(RuleErrorType.UnknownRule) });
					continue;
				}
				const { targetType, validator } = loadRulePlugin(rule.name);

				// eslint-ignore-next-line unicorn/no-await-in-loop
				const result = await executeRuleValidator(directory, rule, fsPath, propertyPath, targetType, validator, fileContents, lines, jsonValue, jsonAst);
				if (result instanceof RuleError) {
					results.push({ rule, target: [fsPath, propertyPath], status: LintStatus.Failure, error: result });
					continue;
				}
				results.push({ rule, target: [fsPath, propertyPath], status: LintStatus.Success });
			}
		}
	}));

	return { conditions, results };
}

async function executeRuleValidator(
	workingDirectory: FsPath,
	rule:             RuleObject,
	fsPath:           FsPath,
	propertyPath:     PropertyPath,
	targetType:       RuleTargetType,
	validator:        (context: RuleContext) => RuleResult,
	fileContents:     string | undefined,
	lines:            Array<Line>,
	jsonValue:        JsonValue | SyntaxError,
	jsonAst:          JsonAst | SyntaxError,
): Promise<LintStatus | RuleResult> {
	const isRuleStrict     = rule.isStrict     ?? false;
	const isRulePermissive = rule.isPermissive ?? false;

	/**
	 * Directory
	 */
	if (targetType === RuleTargetType.DirectoryListing) {
		if (propertyPath !== undefined) {
			return isRulePermissive ? LintStatus.SkippedForWrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
		}

		// TODO: test that the path is also an accessible directory
		// TODO: fetch directory listing only once
		return validator(buildRuleContext({
			workingDirectory: joinPathSegments([workingDirectory, fsPath]),
			parameter:        rule.parameter,
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
	const propertyValue        = tryGettingJsonObjectProperty(jsonValue, propertyPathSegments);
	const propertyAst          = tryGettingJsonAstProperty(jsonAst,      propertyPathSegments);

	if (propertyValue === undefined || propertyAst === undefined) {
		return isRuleStrict ? new RuleError(RuleErrorType.MissingTarget) : true;
	}

	const context = buildRuleContext({
		contents:  fileContents.slice(propertyAst.pos.start.char, propertyAst.pos.end.char + 1),
		lines:     lines?.slice(propertyAst.pos.start.line - 1, propertyAst.pos.end.line) ?? [],
		parameter: rule.parameter,
	});

	switch (targetType) {
		case RuleTargetType.JsonValue:
			context.jsonValue = propertyValue;
			context.jsonAst   = propertyAst;
			break;

		case RuleTargetType.JsonObject:
			if (!isJsonObject(propertyValue) || !isJsonObjectAst(propertyAst)) {
				return isRulePermissive ? LintStatus.SkippedForWrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
			}
			context.jsonObject    = propertyValue;
			context.jsonObjectAst = propertyAst;
			break;

		case RuleTargetType.JsonArray:
			if (!isJsonArray(propertyValue) || !isJsonArrayAst(propertyAst)) {
				return isRulePermissive ? LintStatus.SkippedForWrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
			}
			context.jsonArray    = propertyValue;
			context.jsonArrayAst = propertyAst;
			break;

		case RuleTargetType.JsonString:
			if (typeof propertyValue !== 'string' || propertyAst.type !== 'string') {
				return isRulePermissive ? LintStatus.SkippedForWrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
			}
			context.jsonString = propertyValue;
			context.jsonAst    = propertyAst;
			break;
	}

	return validator(context);
}

function loadRulePlugin(pluginName: string): { targetType: RuleTargetType, validator: (context: RuleContext) => RuleResult } {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const plugin = require(getAbsolutePath([...BUILTIN_RULE_PLUGINS_DIR_PATH, pluginName + '.js']));
	if (plugin.targetType === undefined) {
		throw new Error(`missing target type for rule "${pluginName}"`);
	}
	if (plugin.validator === undefined) {
		throw new Error(`missing validator function for rule "${pluginName}"`);
	}

	return plugin;
}

async function expandFsGlobs(workingDirectory: FsPath, rules: RulesMap): Promise<void> {
	await Promise.allSettled([...rules.entries()].map(async ([fsPath, fsTargetRules]) => {
		if (!isGlobPattern(fsPath)) {
			return;
		}

		const paths = await expandGlob(fsPath, {
			dot:       true,
			cwd:       workingDirectory,
			filesOnly: !fsPath.endsWith('/'),
		});
		for (const path of paths) {
			for (const [propertyPath, propertyTargetRules] of fsTargetRules.entries()) {
				insertInNestedSetMap(rules, normalizePath(path), normalizePropertyPath(propertyPath), propertyTargetRules);
			}
		}
	}));
}

export function buildRuleContext(data: Partial<RuleContext>): RuleContext {
	return {
		workingDirectory: '.',
		contents:         '',
		lines:            [],
		jsonValue:        {},
		jsonObject:       {},
		jsonArray:        [],
		jsonString:       '',
		jsonAst:          { type: 'object', pos: { start: { line: 1, column: 1, char: 0 }, end: { line: 1, column: 1, char: 1 } } },
		jsonObjectAst:    { type: 'object', pos: { start: { line: 1, column: 1, char: 0 }, end: { line: 1, column: 1, char: 1 } } },
		jsonArrayAst:     { type: 'array',  pos: { start: { line: 1, column: 1, char: 0 }, end: { line: 1, column: 1, char: 1 } } },
		parameter:        '',
		...data,
	};
}
