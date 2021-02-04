import { getLines } from './helpers/text';
import { FsPath, joinPathSegments, tryReadingFileContents } from './helpers/fs';
import { isJsonObject, isJsonObjectAst, tryParsingJsonValue, tryParsingJsonAst, tryGettingJsonObjectProperty, tryGettingJsonAstProperty } from './helpers/json';

import { loadBuiltinPlugins } from './plugins';
import { RuleTargetType, RuleObject, RuleResult, RuleError, RuleErrorType, RuleContext, buildRuleContext } from './rules';

export enum SkippedRuleReason {
	ConditionIsFalse,
	WrongTargetType,
}

export async function lintDirectory(workingDirectory: string, rules: Array<RuleObject>, conditions: Record<string, boolean>): Promise<Array<RuleResult | SkippedRuleReason>> {
	const plugins = await loadBuiltinPlugins(new Set(rules.map(rule => rule.name + '.js')));

	// Load and parse all the targeted files only once
	const targetsFsResources: Record<FsPath, Partial<RuleContext>> = Object.fromEntries(
		await Promise.all([...new Set(rules.map(rule => rule.target[0]))].map(async (targetFsPath) => {
			const fileContents = await tryReadingFileContents([workingDirectory, targetFsPath]);

			return [targetFsPath, {
				contents:    fileContents,
				lines:       fileContents !== undefined ? getLines(fileContents)            : [],
				jsonValue:   fileContents !== undefined ? tryParsingJsonValue(fileContents) : undefined,
				jsonAst:     fileContents !== undefined ? tryParsingJsonAst(fileContents)   : undefined,
			}];
		}))
	);

	return rules.map(rule => {
		if (rule.condition !== undefined && conditions[rule.condition] !== true) {
			return SkippedRuleReason.ConditionIsFalse;
		}
		if (plugins[rule.name] === undefined) {
			return new RuleError(RuleErrorType.UnknownRule);
		}

		const { targetType, validator }                    = plugins[rule.name];
		const [targetFsPath, targetPropertiesPathSegments] = rule.target;
		const { contents, lines, jsonValue, jsonAst }      = targetsFsResources[targetFsPath];

		/**
		 * Directory target
		 */
		if (targetType === RuleTargetType.DirectoryListing) {
			if (targetPropertiesPathSegments.length > 0) {
				return rule.permissive ? SkippedRuleReason.WrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
			}
			// TODO: test that the path is an accessible directory

			return validator(buildRuleContext({ workingDirectory: joinPathSegments([workingDirectory, targetFsPath]), parameter: rule.parameter }));
		}

		/**
		 * File target
		 */
		if (targetType === RuleTargetType.FileContents) {
			if (targetPropertiesPathSegments.length > 0) {
				return rule.permissive ? SkippedRuleReason.WrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
			}
			if (contents === undefined) {
				// TODO: thow/return error on missing/unaccessible file?
				return true;
			}

			return validator(buildRuleContext({ contents, lines, parameter: rule.parameter }));
		}

		/**
		 * JSON value target
		 */
		if (contents === undefined) {
			// TODO: thow/return error on missing/unaccessible file?
			return true;
		}
		if (jsonValue === undefined || jsonAst === undefined) {
			return new RuleError(RuleErrorType.InvalidTargetType);
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
					return rule.permissive ? SkippedRuleReason.WrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
				}
				context.jsonObject    = propertyValue;
				context.jsonObjectAst = propertyAst;
				break;

			case RuleTargetType.JsonString:
				if (typeof propertyValue !== 'string' || propertyAst.type !== 'string') {
					return rule.permissive ? SkippedRuleReason.WrongTargetType : new RuleError(RuleErrorType.InvalidTargetType);
				}
				context.jsonString = propertyValue;
				context.jsonAst    = propertyAst;
				break;
		}

		return validator(context);
	});
}
