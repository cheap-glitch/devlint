import { readdirSync } from 'fs';
import { JsonValue } from 'type-fest';

import { getLines } from '../../src/lib/helpers/text';
import { joinPathSegments, getAbsolutePath } from '../../src/lib/helpers/fs';
import { isJsonObject, isJsonArray, isJsonObjectAst, isJsonArrayAst, tryParsingJsonValue, tryParsingJsonAst, tryGettingJsonAstProperty } from '../../src/lib/helpers/json';

import { RuleError, RuleErrorType, RuleErrorPosition } from '../../src/lib/errors';
import { RuleTargetType, RuleContext, buildRuleContext } from '../../src/lib/rules';

const pathToRulePlugins  = joinPathSegments([__dirname, '..', '..', 'build', 'src', 'lib', 'rules']);
const pathToTestSnippets = [__dirname, 'snippets'];

type TestSnippet = string | [string, JsonValue];

interface TestSnippetsCollection {
	passing: Array<TestSnippet>,
	failing: Array<[TestSnippet, RuleErrorType | string, RuleErrorPosition | undefined, RuleErrorPosition | undefined]>,
}

const ruleNames   = (process.env.RULE || process.env.RULES || '').split(/[ ,]/).filter(Boolean);
const rulesToTest = readdirSync(getAbsolutePath(pathToTestSnippets), { withFileTypes: true })
	            .filter(directoryEntry => directoryEntry.isFile() && directoryEntry.name.endsWith('.js'))
	            .map(file => file.name)
		    .filter(rule => ruleNames.length === 0 || ruleNames.includes(rule.replace('.js', '')));

for (const filename of rulesToTest) {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { targetType, validator } = require(getAbsolutePath([pathToRulePlugins, filename]));
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { passing: passingSnippets, failing: failingSnippets }: TestSnippetsCollection = require(getAbsolutePath([...pathToTestSnippets, filename]));

	// eslint-disable-next-line jest/valid-title
	describe(filename.replace(/\.js$/, ''), () => {
		describe('passing', () => {
			for (const snippet of passingSnippets) {
				const context = buildSnippetContext(targetType, snippet);

				// eslint-disable-next-line jest/valid-title
				test([context.contents, context.parameter ?? ''].filter(Boolean).map(data => JSON.stringify(data)).join(' '), async () => {
					expect(await validator(context)).toBe(true);
				});
			}
		});

		describe('failing', () => {
			for (const [snippet, errorTypeOrMessage, errorStart, errorEnd] of failingSnippets) {
				const context = buildSnippetContext(targetType, snippet);
				const error = typeof errorTypeOrMessage === 'number'
					? new RuleError(errorTypeOrMessage)
					: new RuleError(errorTypeOrMessage, {
						start: errorStart === undefined && typeof tryParsingJsonValue(context.contents) !== 'object'
							? { line: 1, column: 9, char: 8 }
							: errorStart,
						end: errorEnd === undefined   && typeof tryParsingJsonValue(context.contents) !== 'object'
							? { line: 1, column: 9 + context.contents.length, char: 8 + context.contents.length }
							: errorEnd,
					});

				// eslint-disable-next-line jest/valid-title
				test([context.contents, context.parameter ?? ''].filter(Boolean).map(data => JSON.stringify(data)).join(' '), async () => {
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

	const contents  = rawContents.trim().startsWith('{') && rawContents.trim().endsWith('}') ? rawContents.trim().replace(/^\t+/gm, '') : rawContents;
	const lines     = getLines(contents);
	const jsonValue = tryParsingJsonValue(contents);
	let jsonAst     = tryParsingJsonAst(contents);

	switch (targetType) {
		// TODO
		case RuleTargetType.DirectoryListing:
			throw new TypeError();

		case RuleTargetType.FileContents:
			return buildRuleContext({ contents, lines, parameter });

		default:
			if (jsonAst === undefined && typeof jsonValue !== 'object') {
				// FIXME: fork jsonast ?
				jsonAst = tryParsingJsonAst(`{"prop":${contents}}`);
				if (jsonAst !== undefined) {
					jsonAst = tryGettingJsonAstProperty(jsonAst, ['prop']);
				}
			}
			if (jsonValue === undefined || jsonAst === undefined) {
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
