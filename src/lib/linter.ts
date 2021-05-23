import mem from 'mem';
import expandGlob from 'tiny-glob';
import { JsonValue } from 'type-fest';
import { JsonValue as JsonAst } from 'jsonast';

import { Line, getLines } from './helpers/text';
import { isGlobPattern, insertInNestedSetMap } from './helpers/utilities';
import { PropertyPath, parsePropertyPath, normalizePropertyPath } from './helpers/properties';
import { isJsonObject, isJsonArray, isJsonObjectAst, isJsonArrayAst } from './helpers/json';
import { tryParsingJsonValue, tryParsingJsonAst, tryGettingJsonObjectProperty, tryGettingJsonAstProperty } from './helpers/json';
import { FsPath, joinPathSegments, getAbsolutePath, normalizePath, getFilenamesInDirectory, tryReadingFileContents } from './helpers/fs';

import { loadConfig } from './config';
import { testConditions } from './conditions';
import { RuleResult, RuleError, RuleErrorType } from './errors';
import { RuleTargetType, RuleObject, RuleContext, parseRules } from './rules';

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
		const config     = await loadConfig();
		const conditions = await testConditions(directory, config.conditions ?? {});

		results.set(directory, { conditions, results: await lintDirectory(directory, config.rules ?? {}, conditions, selectedRules) });
	}

	return results;
}

export async function lintDirectory(directory: FsPath, rulesObject: JsonValue, conditions?: Map<string, boolean>, selectedRules?: Array<string>): Promise<Array<LintResult>> {
	const pluginsFilenames = await BUILTIN_RULE_PLUGINS_FILENAMES();
	const rules = parseRules(rulesObject);
	const results: Array<LintResult> = [];

	// Expand file-system globs
	await Promise.allSettled([...rules.entries()].map(async ([fsPath, fsTargetRules]) => {
		if (!isGlobPattern(fsPath)) {
			return;
		}

		const paths = await expandGlob(fsPath, {
			dot:       true,
			cwd:       directory,
			filesOnly: !fsPath.endsWith('/'),
		});
		for (const path of paths) {
			for (const [propertyPath, propertyTargetRules] of fsTargetRules.entries()) {
				insertInNestedSetMap(rules, normalizePath(path), normalizePropertyPath(propertyPath), propertyTargetRules);
			}
		}
	}));

	await Promise.allSettled([...rules.entries()].map(async ([fsPath, fsTargetRules]) => {
		if (isGlobPattern(fsPath)) {
			return;
		}

		const fileContents = await tryReadingFileContents([directory, fsPath]);

		// TODO: don't try parsing files that don't need to be parsed
		const lines     = fileContents !== undefined ? getLines(fileContents)            : [];
		const jsonValue = fileContents !== undefined ? tryParsingJsonValue(fileContents) : new SyntaxError();
		const jsonAst   = fileContents !== undefined ? tryParsingJsonAst(fileContents)   : new SyntaxError();

		// TODO: expand property-path globs here?

		// TODO: rewrite using Promise.allSettled()? (seems like it can cause race conditions)
		// await Promise.allSettled([...fsTargetRules.entries()].flatMap(async ([, propertyTargetRules]) => [...propertyTargetRules].map(async (lint) => {
		for (const [propertyPath, propertyTargetRules] of fsTargetRules.entries()) {
			for (const rule of propertyTargetRules) {
				// TODO: filter some rules with wrong target type here? (e.g.: file-based rule targeting a directory)
				if (selectedRules !== undefined && !selectedRules.includes(rule.name)) {
					continue;
				}
				if (conditions !== undefined && rule.condition !== undefined) {
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

				// eslint-disable-next-line @typescript-eslint/no-var-requires
				const { targetType, validator } = require(getAbsolutePath([...BUILTIN_RULE_PLUGINS_DIR_PATH, rule.name + '.js']));
				if (targetType === undefined) {
					throw new Error(`missing target type for rule "${rule.name}"`);
				}
				if (validator === undefined) {
					throw new Error(`missing validator function for rule "${rule.name}"`);
				}

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

	return results;
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
