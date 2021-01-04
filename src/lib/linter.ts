import { getLines } from './helpers/text';
import { getAbsolutePath, getFilenamesInDirectory, tryReadingFileContents } from './helpers/fs';
import { isJsonObjectValue, tryParsingJsonObject, tryParsingJsonAst, tryGettingJsonObjectProperty, tryGettingJsonAstProperty } from './helpers/json';

import { RuleObject, RulesMap, RuleContext, RuleResult, RuleError, RuleErrorType } from './rules';

const pathToRulesFolder = [__dirname, 'rules'];

export async function lint(workingDirectory: string, rules: RulesMap): Promise<Map<[string, string], Array<[RuleObject, RuleResult]>>> {
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
			contents:   fileContents,
			lines:      getLines(fileContents),
			jsonObject: tryParsingJsonObject(fileContents),
			jsonAst:    tryParsingJsonAst(fileContents),
			parameters: undefined,
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
						context.parameters = rule.parameters;
						result = validators[rule.name](context);
					// Target is a property in the file (assumed to be JSON)
					} else {
						if (context.jsonObject !== undefined && context.jsonAst !== undefined) {
							const propertyValue = tryGettingJsonObjectProperty(context.jsonObject, targetPropertiesPath);
							const propertyAst   = tryGettingJsonAstProperty(context.jsonAst,       targetPropertiesPath);

							if (isJsonObjectValue(propertyValue) && propertyAst !== undefined) {
								const textSlice = context.contents.slice(propertyAst.pos.start.char, propertyAst.pos.end.char);
								result = validators[rule.name]({
									contents:   textSlice,
									lines:      getLines(textSlice),
									jsonObject: propertyValue,
									jsonAst:    propertyAst,
									parameters: rule.parameters,
								});
							}
						}
					}
				}

				return [rule, result];
			}));
		}
	}));

	return resultsMap;
}
