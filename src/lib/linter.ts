import { homedir } from 'os';
import { JsonValue } from 'type-fest';

import { getLines } from './helpers/text';
import { getAbsolutePath, getFilenamesInDirectory, readFileContents, tryReadingFileContents } from './helpers/fs';
import { isJsonValueObject, tryParsingJsonValue, tryParsingJsonAst, tryGettingJsonObjectProperty, tryGettingJsonAstProperty } from './helpers/json';

import { RuleObject, RuleContext, RuleResult, RuleError, RuleErrorType, parseRules } from './rules';

const pathToRulesFolder = [__dirname, 'rules'];

export async function lint(workingDirectory: string, rulesNames?: Array<string>): Promise<Map<[string, string], Array<[RuleObject, RuleResult]>>> {
	let config: JsonValue;
	try {
		config = JSON.parse(await readFileContents([homedir(), '.devlintrc.json']));
	} catch(error) {
		error.message = 'Failed to parse config file: ' + error.message;
		throw error;
	}
	if (!isJsonValueObject(config)) {
		throw new Error('Invalid config object');
	}

	const rules = parseRules(config?.rules ?? {}, rulesNames);
	if (rules.size === 0) {
		return new Map();
	}

	const requiredValidators = new Set([...rules.values()].flatMap(targetFileRules => [...targetFileRules.values()].flatMap(rules => rules.map(({ name }) => name + '.js'))));
	const validators = Object.fromEntries(
		(await getFilenamesInDirectory(pathToRulesFolder, file => requiredValidators.has(file.name))).map(filename => {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			return [filename.replace('.js', ''), require(getAbsolutePath([...pathToRulesFolder, filename])).default];
		})
	);

	const resultsMap = new Map();
	await Promise.all([...rules].map(async ([targetFsPathString, targetFileRules]) => {
		const fileContents = await tryReadingFileContents([workingDirectory, targetFsPathString]);
		if (fileContents instanceof Error) {
			// TODO: error? warning?
			return;
		}

		const context: RuleContext = {
			contents:  fileContents,
			lines:     getLines(fileContents),
			jsonValue: tryParsingJsonValue(fileContents),
			jsonAst:   tryParsingJsonAst(fileContents),
			parameter: undefined,
		};

		for (const [target, rules] of targetFileRules) {
			resultsMap.set([targetFsPathString, target], rules.map(rule => {
				let result: RuleResult = new RuleError(RuleErrorType.InvalidData);

				if (validators[rule.name] === undefined) {
					result = new RuleError(RuleErrorType.UnknownRule);
				} else {
					const [, targetPropertiesPath] = rule.target;

					// Target is the whole file
					if (targetPropertiesPath.length === 0) {
						context.parameter = rule.parameter;
						result = validators[rule.name](context);
					// Target is a property in the file (assumed to be JSON)
					} else if (isJsonValueObject(context.jsonValue) && context.jsonAst !== undefined) {
						const propertyValue = tryGettingJsonObjectProperty(context.jsonValue, targetPropertiesPath);
						const propertyAst   = tryGettingJsonAstProperty(context.jsonAst, targetPropertiesPath);

						if (propertyValue === undefined || propertyAst === undefined) {
							// The property doesn't exist in the object, so the rule is not considered at all
							result = true;
						} else {
							result = validators[rule.name]({
								contents:  context.contents.slice(propertyAst.pos.start.char, propertyAst.pos.end.char),
								lines:     context.lines.slice(propertyAst.pos.start.line - 1, propertyAst.pos.end.line),
								jsonValue: propertyValue,
								jsonAst:   propertyAst,
								parameter: rule.parameter,
							});
						}
					}
				}

				return [rule, result];
			}));
		}
	}));

	return resultsMap;
}
