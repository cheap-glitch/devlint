/* eslint-disable jest/valid-title, @typescript-eslint/no-var-requires */

import { JsonValue } from 'type-fest';
import { readdirSync } from 'fs';
import { JsonValue as JsonAst } from 'jsonast';

import { getLines } from '../../src/lib/helpers/text';
import { joinPathSegments, getAbsolutePath } from '../../src/lib/helpers/fs';
import { isJsonObject, isJsonArray, isJsonObjectAst, isJsonArrayAst, tryParsingJsonValue, tryParsingJsonAst, tryGettingJsonAstProperty } from '../../src/lib/helpers/json';

import { buildRuleContext } from '../../src/lib/linter';
import { RuleTargetType, RuleContext } from '../../src/lib/rules';
import { RuleError, RuleErrorType, RuleErrorPosition } from '../../src/lib/errors';

const pathToRulePlugins  = joinPathSegments([__dirname, '..', '..', 'build', 'src', 'lib', 'rules']);
const pathToTestSnippets = [__dirname, 'snippets'];

type TestSnippet = string | [string, JsonValue];

interface TestSnippetsCollection {
	passing: Record<string, TestSnippet>,
	failing: Record<string, [TestSnippet, RuleErrorType | string, RuleErrorPosition | undefined, RuleErrorPosition | undefined]>,
}

const ruleNames   = (process.env.RULE || process.env.RULES || '').split(/[ ,]/).filter(Boolean);
const rulesToTest = readdirSync(getAbsolutePath(pathToTestSnippets), { withFileTypes: true })
	            .filter(directoryEntry => directoryEntry.isFile() && directoryEntry.name.endsWith('.js'))
	            .map(file => file.name)
		    .filter(rule => ruleNames.length === 0 || ruleNames.includes(rule.replace('.js', '')));

for (const filename of rulesToTest) {
	const { targetType, validator } = require(getAbsolutePath([pathToRulePlugins, filename]));
	const { passing: passingSnippets, failing: failingSnippets }: TestSnippetsCollection = require(getAbsolutePath([...pathToTestSnippets, filename]));

	describe(filename.replace(/\.js$/, ''), () => {

		describe('passing', () => {
			for (const [title, snippet] of Object.entries(passingSnippets)) {
				test(title, async () => expect(await validator(buildSnippetContext(targetType, snippet))).toBe(true));
			}
		});

		describe('failing', () => {
			for (const [title, [snippet, errorTypeOrMessage, errorStart, errorEnd]] of Object.entries(failingSnippets)) {
				const context   = buildSnippetContext(targetType, snippet);
				const jsonValue = tryParsingJsonValue(context.contents);

				const error = typeof errorTypeOrMessage === 'number'
					? new RuleError(errorTypeOrMessage)
					: new RuleError(errorTypeOrMessage, {
						start: errorStart === undefined && !(jsonValue instanceof SyntaxError) && typeof jsonValue !== 'object'
							? { line: 1, column: 9, char: 8 }
							: errorStart,
						end: errorEnd === undefined && !(jsonValue instanceof SyntaxError) && typeof jsonValue !== 'object'
							? { line: 1, column: 9 + context.contents.length, char: 8 + context.contents.length }
							: errorEnd,
					});

				test(title, async () => {
					const result = await validator(context);

					expect(result).toBeInstanceOf(Error);
					expect(result).toMatchObject({ ...error });
					expect(result.message).toBe(error.message);
				});
			}
		});
	});
}

function buildSnippetContext(targetType: RuleTargetType, snippet: TestSnippet): RuleContext {
	const [rawContents, parameter] = (typeof snippet === 'string') ? [snippet, undefined] : snippet;

	const contents  = rawContents.replace(/^\n/, '').replace(/^\t{3}/gm, '').replaceAll('\\n', '\n');
	const lines     = getLines(contents);
	const jsonValue = tryParsingJsonValue(contents);
	let jsonAst: JsonAst | SyntaxError | undefined = tryParsingJsonAst(contents);

	switch (targetType) {
		// TODO
		case RuleTargetType.DirectoryListing:
			throw new TypeError();

		case RuleTargetType.FileContents:
			return buildRuleContext({ contents, lines, parameter });

		default:
			if ((jsonAst instanceof SyntaxError || jsonAst === undefined) && !(jsonValue instanceof SyntaxError) && typeof jsonValue !== 'object') {
				// FIXME: primitives & arrays need to be wrapped in an object, otherwise `jsonast` throws an error
				jsonAst = tryParsingJsonAst(`{"prop":${contents}}`);
				if (!(jsonAst instanceof SyntaxError) && jsonAst !== undefined) {
					jsonAst = tryGettingJsonAstProperty(jsonAst, ['prop']);
				}
			}
			if (jsonValue instanceof SyntaxError || jsonAst instanceof SyntaxError || jsonAst === undefined) {
				throw new TypeError();
			}

			switch(targetType) {
				case RuleTargetType.JsonValue:
					return buildRuleContext({ contents, lines, jsonValue, jsonAst, parameter });

				case RuleTargetType.JsonObject:
					if (!isJsonObject(jsonValue) || !isJsonObjectAst(jsonAst)) {
						throw new TypeError();
					}
					return buildRuleContext({ contents, lines, jsonObject: jsonValue, jsonObjectAst: jsonAst, parameter });

				case RuleTargetType.JsonArray:
					if (!isJsonArray(jsonValue) || !isJsonArrayAst(jsonAst)) {
						throw new TypeError();
					}
					return buildRuleContext({ contents, lines, jsonArray: jsonValue, jsonArrayAst: jsonAst, parameter });

				case RuleTargetType.JsonString:
					if (typeof jsonValue !== 'string') {
						throw new TypeError();
					}
					return buildRuleContext({ contents, lines, jsonString: jsonValue, jsonAst: jsonAst, parameter });
			}
	}

	return buildRuleContext({});
}
