import mem from 'mem';
import { JsonValue } from 'type-fest';
import { JsonValue as JsonAst } from 'jsonast';

import { Line, getLines } from './helpers/text';
import { insertInNestedSetMap } from './helpers/utilities';
import { PropertiesPath, joinPropertiesPathSegments } from './helpers/properties';
import { isJsonObject, isJsonArray, isJsonObjectAst, isJsonArrayAst } from './helpers/json';
import { FsPath, joinPathSegments, getAbsolutePath, getFilenamesInDirectory, tryReadingFileContents } from './helpers/fs';
import { tryParsingJsonValue, tryParsingJsonAst, tryGettingJsonObjectProperty, tryGettingJsonAstProperty } from './helpers/json';

import { RuleResult, RuleError, RuleErrorType } from './errors';
import { RuleTargetType, RuleObject, RuleContext } from './rules';

export interface Plugin {
	targetType: RuleTargetType,
	validator:  (context: RuleContext) => RuleResult,
}

export interface LintResult {
	rule:   RuleObject,
	status: LintStatus,
	error?: RuleError,
}

export enum LintStatus {
	Pending,
	Success,
	Error,
	SkippedForWrongTargetType,
	SkippedForUnfulfilledCondition,
}

const BUILTIN_RULE_PLUGINS_DIR_PATH  = [__dirname, 'rules'];
const BUILTIN_RULE_PLUGINS_FILENAMES = mem(() => getFilenamesInDirectory(BUILTIN_RULE_PLUGINS_DIR_PATH));

export async function lintDirectory(workingDirectory: string, rules: Array<RuleObject>, conditions: Record<string, boolean>): Promise<Map<FsPath, Map<PropertiesPath, Set<LintResult>>>> {
	const lints: Map<FsPath, Map<PropertiesPath, Set<LintResult>>> = new Map();

	const plugins: Map<string, Plugin> = new Map();
	const pluginsFilenames = await BUILTIN_RULE_PLUGINS_FILENAMES();

	// Filter invalid or inapplicable rules and load their corresponding plugins
	// TODO: only load each plugin once (=> keep a list of loaded plugins in the global scope | actually, is this really needed ? since Node will probably cache them anyway)
	const filteredRules = rules.filter(rule => {
		if (rule.condition !== undefined && conditions[rule.condition] !== (rule?.conditionExpectedResult ?? true)) {
			insertInNestedSetMap(lints, rule.target[0], joinPropertiesPathSegments(rule.target[1]), { rule, status: LintStatus.SkippedForUnfulfilledCondition });
			return false;
		}
		if (!pluginsFilenames.includes(rule.name + '.js')) {
			insertInNestedSetMap(lints, rule.target[0], joinPropertiesPathSegments(rule.target[1]), { rule, status: LintStatus.Error, error: new RuleError(RuleErrorType.UnknownRule) });
			return false;
		}

		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { targetType, validator } = require(getAbsolutePath([...BUILTIN_RULE_PLUGINS_DIR_PATH, rule.name + '.js']));
		if (targetType === undefined) {
			throw new Error(`missing target type for rule "${rule.name}"`);
		}
		if (validator === undefined) {
			throw new Error(`missing validator function for rule "${rule.name}"`);
		}
		plugins.set(rule.name, { targetType, validator });

		return true;
	});

	// Group pending lint results by filesystem path & property path
	// TODO: filter some rules with wrong target type here (e.g.: file-based rule targeting a directory)
	await Promise.all(filteredRules.map(async (rule) => {
		const [targetFsPath, targetPropertyPathSegments] = rule.target;
		insertInNestedSetMap(lints, targetFsPath, joinPropertiesPathSegments(targetPropertyPathSegments), { rule, status: LintStatus.Pending });
	}));

	await Promise.all([...lints.entries()].map(async ([targetFsPath, fsTargetLints]) => {
		const fileContents = await tryReadingFileContents([workingDirectory, targetFsPath]);

		const lines     = fileContents !== undefined ? getLines(fileContents)            : [];
		// TODO: don't try parsing files that don't need to be
		const jsonValue = fileContents !== undefined ? tryParsingJsonValue(fileContents) : new SyntaxError();
		const jsonAst   = fileContents !== undefined ? tryParsingJsonAst(fileContents)   : new SyntaxError();

		await Promise.all([...fsTargetLints.entries()].flatMap(async ([, propertyTargetLints]) => [...propertyTargetLints].map(async (lint) => {
			if (lint.status !== LintStatus.Pending) {
				return;
			}

			const rulePlugin = plugins.get(lint.rule.name);
			if (rulePlugin === undefined) {
				// FIXME: this should never happen anyway
				throw new Error();
			}

			const result = await executeRuleValidator(workingDirectory, lint.rule, rulePlugin, fileContents, lines, jsonValue, jsonAst);
			if (result === true) {
				lint.status = LintStatus.Success;
				return;
			}
			if (result instanceof RuleError) {
				lint.status = LintStatus.Error;
				lint.error  = result;
				return;
			}

			lint.status = result;
		})));
	}));

	return lints;
}

async function executeRuleValidator(
	workingDirectory: FsPath,
	rule: RuleObject,
	{ targetType, validator }: Plugin,
	fileContents: string | undefined,
	lines: Array<Line>,
	jsonValue: JsonValue | SyntaxError,
	jsonAst: JsonAst | SyntaxError,
): Promise<LintStatus | RuleResult> {
	const isRulePermissive = rule.isPermissive ?? false;
	const [targetFsPath, targetPropertiesPathSegments] = rule.target;

	/**
	 * Directory
	 */
	if (targetType === RuleTargetType.DirectoryListing) {
		if (targetPropertiesPathSegments.length > 0) {
			return isRulePermissive ? LintStatus.SkippedForWrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
		}

		// TODO: test that the path is also an accessible directory
		// TODO: fetch directory listing
		return await validator(buildRuleContext({ workingDirectory: joinPathSegments([workingDirectory, targetFsPath]), parameter: rule.parameter }));
	}

	/**
	 * File
	 */
	if (targetType === RuleTargetType.FileContents) {
		if (targetPropertiesPathSegments.length > 0) {
			return isRulePermissive ? LintStatus.SkippedForWrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
		}
		if (fileContents === undefined) {
			// TODO: throw/return error on missing/unaccessible file?
			return true;
		}

		return await validator(buildRuleContext({ contents: fileContents, lines, parameter: rule.parameter }));
	}

	/**
	 * JSON value
	 */
	if (fileContents === undefined) {
		// TODO: thow/return error on missing/unaccessible file?
		return true;
	}
	if (jsonValue instanceof SyntaxError) {
		// TODO [>=0.5.0]: exploit line & column numbers
		return new RuleError(jsonValue.message ?? 'invalid JSON encountered');
	}
	if (jsonAst instanceof SyntaxError) {
		// TODO [>=0.5.0]: exploit line & column numbers
		return new RuleError(jsonAst.message ?? 'invalid JSON encountered');
	}
	if ((targetType === RuleTargetType.JsonValue || targetType === RuleTargetType.JsonString) && targetPropertiesPathSegments.length === 0) {
		return new RuleError(RuleErrorType.InvalidTargetType);
	}

	const propertyValue = tryGettingJsonObjectProperty(jsonValue, targetPropertiesPathSegments);
	const propertyAst   = tryGettingJsonAstProperty(jsonAst,      targetPropertiesPathSegments);
	if (propertyValue === undefined || propertyAst === undefined) {
		// The property doesn't exist in the object, so the rule is ignored
		// TODO: throw/return error if the property is required
		return true;
	}

	const context = buildRuleContext({
		contents:  fileContents.slice(propertyAst.pos.start.char, propertyAst.pos.end.char + 1),
		lines:     (lines ?? []).slice(propertyAst.pos.start.line - 1, propertyAst.pos.end.line - 1),
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

	return await validator(context);
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
