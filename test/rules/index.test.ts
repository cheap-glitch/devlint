import { tmpdir as getOsTemporaryDirectory } from 'os';
import { readdirSync as getDirectoryListing, writeFileSync as createFile, mkdirSync as createDirectory, mkdtempSync as createTemporaryDirectory, rmSync as removeDirectory } from 'fs';

import { getLines } from '../../src/lib/helpers/text';
import { RuleError } from '../../src/lib/errors';
import { RuleTargetType } from '../../src/lib/rules';
import { buildRuleContext } from '../../src/lib/linter';
import { joinPathSegments, getAbsolutePath } from '../../src/lib/helpers/fs';
import { isJsonObject, isJsonArray, isJsonObjectAst, isJsonArrayAst, tryParsingJsonValue, tryParsingJsonAst, tryGettingJsonAstProperty } from '../../src/lib/helpers/json';

import type { RuleErrorType, RuleErrorPosition } from '../../src/lib/errors';
import type { RuleContext } from '../../src/lib/rules';
import type { JsonValue as JsonAst } from 'jsonast';
import type { JsonValue } from 'type-fest';

type TestSnippet = string | [string, JsonValue];

interface TestSnippetsCollection {
	passing: Record<string, TestSnippet>;
	failing: Record<string, [TestSnippet, RuleErrorType | string, RuleErrorPosition | undefined, RuleErrorPosition | undefined]>;
}

const pathToRulePlugins = joinPathSegments([__dirname, '..', '..', 'build', 'src', 'lib', 'rules']);
const pathToTestSnippets = [__dirname, 'snippets'];
const selectedRules = (process.env.RULE || process.env.RULES || '').split(/[ ,]/u).filter(Boolean);
const testSnippetsEntries = getDirectoryListing(getAbsolutePath(pathToTestSnippets), { withFileTypes: true });

let testTemporaryDirectory: string;
beforeAll(() => {
	testTemporaryDirectory = createTemporaryDirectory(joinPathSegments([getOsTemporaryDirectory(), 'devlint-']));
});
afterAll(() => {
	removeDirectory(testTemporaryDirectory, {
		force: true,
		recursive: true,
		maxRetries: 3,
	});
});

for (const entry of testSnippetsEntries) {
	if (!entry.isFile() || !entry.name.endsWith('.js')) {
		continue;
	}

	const filename = entry.name;
	const ruleName = filename.replace(/\.js$/u, '');
	if (selectedRules.length > 0 && !selectedRules.some(selectedRuleName => ruleName.startsWith(selectedRuleName))) {
		continue;
	}

	// eslint-disable-next-line @typescript-eslint/no-var-requires -- Only load the necessary rules
	const { targetType, validator } = require(getAbsolutePath([pathToRulePlugins, filename]));
	// eslint-disable-next-line @typescript-eslint/no-var-requires -- Only load the necessary test snippets
	const { passing: passingSnippets, failing: failingSnippets }: TestSnippetsCollection = require(getAbsolutePath([...pathToTestSnippets, filename]));

	describe(ruleName, () => {
		describe('passing', () => {
			for (const [title, snippet] of Object.entries(passingSnippets)) {
				test(title, async () => {
					expect(await validator(buildSnippetContext(ruleName, targetType, snippet))).toBe(true);
				});
			}
		});

		describe('failing', () => {
			for (const [title, [snippet, errorTypeOrMessage, errorStart, errorEnd]] of Object.entries(failingSnippets)) {
				test(title, async () => {
					const context = buildSnippetContext(ruleName, targetType, snippet);
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

					const result = await validator(context);

					expect(result).toBeInstanceOf(Error);
					expect(result).toMatchObject({ ...error });
					expect(result.message).toBe(error.message);
				});
			}
		});
	});
}

function buildSnippetContext(ruleName: string, targetType: RuleTargetType, snippet: TestSnippet): RuleContext {
	const [rawContents, parameter] = typeof snippet === 'string' ? [snippet, undefined] : snippet;

	const contents = rawContents.replace(/^\n/u, '').replace(/^\t{3}/ugm, '').replaceAll('\\n', '\n');
	const lines = getLines(contents);
	const jsonValue = tryParsingJsonValue(contents);
	let jsonAst: JsonAst | SyntaxError | undefined = tryParsingJsonAst(contents);

	switch (targetType) {
		case RuleTargetType.DirectoryListing: {
			const ruleTemporaryDirectory = createTemporaryDirectory(joinPathSegments([testTemporaryDirectory, ruleName + '-']));

			// Treat each line of the snippet as a path to create in the temp dir
			for (const path of contents.trim().split('\n')) {
				if (path.length === 0) {
					continue;
				}

				if (path.endsWith('/')) {
					createDirectory(joinPathSegments([ruleTemporaryDirectory, path.slice(0, -1)]), { recursive: true });
				} else {
					createFile(joinPathSegments([ruleTemporaryDirectory, path]), '');
				}
			}

			return buildRuleContext({ workingDirectory: ruleTemporaryDirectory, parameter });
		}

		case RuleTargetType.FileContents:
			return buildRuleContext({ contents, lines, parameter });

		default:
			if ((jsonAst instanceof SyntaxError || jsonAst === undefined) && !(jsonValue instanceof SyntaxError) && typeof jsonValue !== 'object') {
				// FIXME [>=1.0.0]: Primitives & arrays need to be wrapped in an object, otherwise `jsonast` throws an error
				jsonAst = tryParsingJsonAst(`{"prop":${contents}}`);
				if (!(jsonAst instanceof SyntaxError) && jsonAst !== undefined) {
					jsonAst = tryGettingJsonAstProperty(jsonAst, ['prop']);
				}
			}
			if (jsonValue instanceof SyntaxError || jsonAst instanceof SyntaxError || jsonAst === undefined) {
				throw new SyntaxError('Invalid JSON value or AST');
			}

			switch (targetType) {
				case RuleTargetType.JsonValue:
					return buildRuleContext({ contents, lines, jsonValue, jsonAst, parameter });

				case RuleTargetType.JsonObject:
					if (!isJsonObject(jsonValue) || !isJsonObjectAst(jsonAst)) {
						throw new SyntaxError('Invalid JSON value or AST');
					}

					return buildRuleContext({ contents, lines, jsonObject: jsonValue, jsonObjectAst: jsonAst, parameter });

				case RuleTargetType.JsonArray:
					if (!isJsonArray(jsonValue) || !isJsonArrayAst(jsonAst)) {
						throw new SyntaxError('Invalid JSON value or AST');
					}

					return buildRuleContext({ contents, lines, jsonArray: jsonValue, jsonArrayAst: jsonAst, parameter });

				case RuleTargetType.JsonString:
					if (typeof jsonValue !== 'string') {
						throw new SyntaxError('invalid JSON value or AST');
					}

					return buildRuleContext({ contents, lines, jsonString: jsonValue, jsonAst, parameter });

				default: throw new Error(`Unknown rule target type "${targetType}"`);
			}
	}

	return buildRuleContext({});
}
