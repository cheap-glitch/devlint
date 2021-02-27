import { getLines } from './helpers/text';
import { joinPathSegments, tryReadingFileContents } from './helpers/fs';
import { isJsonObject, isJsonArray, isJsonObjectAst, isJsonArrayAst } from './helpers/json';
import { tryParsingJsonValue, tryParsingJsonAst, tryGettingJsonObjectProperty, tryGettingJsonAstProperty } from './helpers/json';

import { loadBuiltinPlugins } from './plugins';
import { RuleTargetType, RuleObject, RuleResult, RuleError, RuleErrorType, buildRuleContext } from './rules';

export enum SkippedRuleReason {
	ConditionIsFalse,
	WrongTargetType,
}

export async function lintDirectory(workingDirectory: string, rules: Array<RuleObject>, conditions: Record<string, boolean>): Promise<Array<RuleResult | SkippedRuleReason>> {
	const plugins       = await loadBuiltinPlugins(new Set(rules.map(rule => rule.name + '.js')));
	const targetedFiles = [...new Set(rules.map(rule => rule.target[0]))];

	// Load and parse all the targeted files only once
	const targetsFsResources = Object.fromEntries(await Promise.all(targetedFiles.map(async (targetFsPath) => {
		const fileContents = await tryReadingFileContents([workingDirectory, targetFsPath]);

		return [targetFsPath, {
			contents:  fileContents,
			lines:     fileContents !== undefined ? getLines(fileContents)            : [],
			jsonValue: fileContents !== undefined ? tryParsingJsonValue(fileContents) : new SyntaxError(),
			jsonAst:   fileContents !== undefined ? tryParsingJsonAst(fileContents)   : new SyntaxError(),
		}];
	})));

	return await Promise.all(rules.map(async (rule) => {
		if (rule.condition !== undefined && conditions[rule.condition] !== (rule?.conditionExpectedResult ?? true)) {
			return SkippedRuleReason.ConditionIsFalse;
		}
		if (plugins[rule.name] === undefined) {
			return new RuleError(RuleErrorType.UnknownRule);
		}

		const { targetType, validator } = plugins[rule.name];

		const [targetFsPath, targetPropertiesPathSegments] = rule.target;
		const { contents, lines, jsonValue, jsonAst } = targetsFsResources[targetFsPath];

		const isRulePermissive = rule.isPermissive ?? false;

		/**
		 * Directory
		 */
		if (targetType === RuleTargetType.DirectoryListing) {
			if (targetPropertiesPathSegments.length > 0) {
				return isRulePermissive ? SkippedRuleReason.WrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
			}
			// TODO: test that the path is an accessible directory

			return await validator(buildRuleContext({ workingDirectory: joinPathSegments([workingDirectory, targetFsPath]), parameter: rule.parameter }));
		}

		/**
		 * File
		 */
		if (targetType === RuleTargetType.FileContents) {
			if (targetPropertiesPathSegments.length > 0) {
				return isRulePermissive ? SkippedRuleReason.WrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
			}
			if (contents === undefined) {
				// TODO: thow/return error on missing/unaccessible file?
				return true;
			}

			return await validator(buildRuleContext({ contents, lines, parameter: rule.parameter }));
		}

		/**
		 * JSON value
		 */
		if (contents === undefined) {
			// TODO: thow/return error on missing/unaccessible file?
			return true;
		}
		if (jsonValue instanceof SyntaxError || jsonAst instanceof SyntaxError) {
			// TODO [>=0.5.0]: exploit line & column numbers
			return new RuleError(jsonValue.message ?? jsonAst.message ?? 'invalid JSON encountered');
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
			contents:  contents.slice(propertyAst.pos.start.char, propertyAst.pos.end.char + 1),
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
					return isRulePermissive ? SkippedRuleReason.WrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
				}
				context.jsonObject    = propertyValue;
				context.jsonObjectAst = propertyAst;
				break;

			case RuleTargetType.JsonArray:
				if (!isJsonArray(propertyValue) || !isJsonArrayAst(propertyAst)) {
					return isRulePermissive ? SkippedRuleReason.WrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
				}
				context.jsonArray    = propertyValue;
				context.jsonArrayAst = propertyAst;
				break;

			case RuleTargetType.JsonString:
				if (typeof propertyValue !== 'string' || propertyAst.type !== 'string') {
					return isRulePermissive ? SkippedRuleReason.WrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
				}
				context.jsonString = propertyValue;
				context.jsonAst    = propertyAst;
				break;
		}

		return await validator(context);
	}));
}
