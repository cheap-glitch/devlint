import { getLines } from './helpers/text';
import { joinPathSegments, tryGettingDirectoryListing, tryReadingFileContents } from './helpers/fs';
import { isJsonValueObject, isJsonAstObject, tryParsingJsonValue, tryParsingJsonAst, tryGettingJsonObjectProperty, tryGettingJsonAstProperty } from './helpers/json';

import { loadConfig } from './config';
import { loadBuiltinPlugins } from './plugins';
import { RuleTargetType, RuleObject, RuleResult, RuleError, RuleErrorType, parseRules, buildRuleContext } from './rules';

export async function lint(directories: Array<string>, rulesNames?: Array<string>): Promise<Map<[string, string], Array<[RuleObject, RuleResult]>>> {
	const results = new Map();
	for (const workingDirectory of directories) {
		const config = await loadConfig();

		const rules = parseRules(config?.rules ?? {}, rulesNames);
		if (rules.size === 0) {
			return new Map();
		}

		const requiredRules = new Set([...rules.values()].flatMap(targetFsRules => [...targetFsRules.values()].flatMap(rules => rules.map(({ name }) => name + '.js'))));
		const loadedRules   = await loadBuiltinPlugins(requiredRules);

		await Promise.all([...rules.entries()].map(async ([targetFsPathString, targetFsRules]) => {
			const directoryListing = await tryGettingDirectoryListing([workingDirectory, targetFsPathString]);
			const fileContents     = await tryReadingFileContents([workingDirectory, targetFsPathString]);
			const fileLines        = fileContents !== undefined ? getLines(fileContents) : [];
			const jsonValue        = fileContents !== undefined ? tryParsingJsonValue(fileContents) : undefined;
			const jsonAst          = fileContents !== undefined ? tryParsingJsonAst(fileContents)   : undefined;

			[...targetFsRules.entries()].forEach(([targetPropertiesPathString, rules]) => results.set(
				[joinPathSegments([workingDirectory, targetFsPathString]), targetPropertiesPathString],
				rules.map(rule => [rule, (() => {
					if (loadedRules[rule.name] === undefined) {
						return new RuleError(RuleErrorType.UnknownRule);
					}

					const [, targetPropertiesPath]  = rule.target;
					const { targetType, validator } = loadedRules[rule.name];

					/**
					 * Directory target
					 */
					if (targetType === RuleTargetType.DirectoryListing) {
						if (targetPropertiesPath.length > 0) {
							return new RuleError(RuleErrorType.InvalidTargetType);
						}

						// TODO: thow/return error on missing/unaccessible directory?
						return directoryListing !== undefined ? validator(buildRuleContext({ ...directoryListing, parameter: rule.parameter })) : true;
					}

					/**
					 * File target
					 */
					if (targetType === RuleTargetType.FileContents) {
						if (targetPropertiesPath.length > 0) {
							return new RuleError(RuleErrorType.InvalidTargetType);
						}

						// TODO: thow/return error on missing/unaccessible file?
						return fileContents !== undefined
							? validator(buildRuleContext({ contents: fileContents, lines: fileLines, parameter: rule.parameter }))
							: true;
					}

					/**
					 * JSON value target
					 */
					if (fileContents === undefined) {
						// TODO: thow/return error on missing/unaccessible file?
						return true;
					}
					if (jsonValue === undefined || jsonAst === undefined) {
						return new RuleError(RuleErrorType.InvalidTargetType);
					}
					if ((targetType === RuleTargetType.JsonValue || targetType === RuleTargetType.JsonString) && targetPropertiesPath.length === 0) {
						return new RuleError(RuleErrorType.InvalidTargetType);
					}

					const propertyValue = tryGettingJsonObjectProperty(jsonValue, targetPropertiesPath);
					const propertyAst   = tryGettingJsonAstProperty(jsonAst,      targetPropertiesPath);
					if (propertyValue === undefined || propertyAst === undefined) {
						// The property doesn't exist in the object, so the rule is ignored
						// TODO: throw/return error if the property is required
						return true;
					}

					const context = buildRuleContext({
						contents:  fileContents.slice(propertyAst.pos.start.char, propertyAst.pos.end.char + 1),
						lines:     fileLines.slice(propertyAst.pos.start.line - 1, propertyAst.pos.end.line),
						parameter: rule.parameter,
					});

					switch (targetType) {
						case RuleTargetType.JsonValue:
							context.jsonValue = propertyValue;
							context.jsonAst   = propertyAst;
							break;

						case RuleTargetType.JsonObject:
							if (!isJsonValueObject(propertyValue) || !isJsonAstObject(propertyAst)) {
								return new RuleError(RuleErrorType.InvalidTargetType);
							}
							context.jsonObject    = propertyValue;
							context.jsonObjectAst = propertyAst;
							break;

						case RuleTargetType.JsonString:
							if (typeof propertyValue !== 'string' || propertyAst.type !== 'string') {
								return new RuleError(RuleErrorType.InvalidTargetType);
							}
							context.jsonString = propertyValue;
							context.jsonAst    = propertyAst;
							break;
					}

					return validator(context);
				})()])
			));
		}));
	}

	return results;
}
