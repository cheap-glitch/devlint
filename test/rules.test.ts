import { readdirSync } from 'fs';
import { JsonValue } from 'type-fest';

import { getLines } from '../src/lib/helpers/text';
import { joinPathSegments, getAbsolutePath } from '../src/lib/helpers/fs';
import { isJsonObject, isJsonObjectAst, tryParsingJsonValue, tryParsingJsonAst } from '../src/lib/helpers/json';

import { RuleError, RuleErrorType, RuleErrorLocation } from '../src/lib/errors';
import { RuleTargetType, RuleContext, buildRuleContext } from '../src/lib/rules';

interface TestSnippetsCollection {
	passing: Array<TestSnippet>,
	failing: Array<[TestSnippet, RuleErrorType | string, RuleErrorLocation | undefined, RuleErrorLocation | undefined]>,
}

type TestSnippet = string | [string, JsonValue];

const pathToRulePlugins  = joinPathSegments([__dirname, '..', 'build', 'src', 'lib', 'rules']);
const pathToTestSnippets = [__dirname, 'assets', 'snippets'];

const rulesToTest = readdirSync(getAbsolutePath(pathToTestSnippets), { withFileTypes: true })
	            .filter(directoryEntry => directoryEntry.isFile() && directoryEntry.name.endsWith('.js'))
	            .map(file => file.name);

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
				test([context.contents, context.parameter ?? ''].filter(Boolean).map(data => JSON.stringify(data)).join(' '), () => {
					expect(validator(context)).toBe(true);
				});
			}
		});

		describe('failing', () => {
			for (const [snippet, errorTypeOrMessage, errorStart, errorEnd] of failingSnippets) {
				const context = buildSnippetContext(targetType, snippet);
				const error = typeof errorTypeOrMessage === 'number'
					? new RuleError(errorTypeOrMessage)
					: new RuleError(errorTypeOrMessage, errorStart, errorEnd);

				// eslint-disable-next-line jest/valid-title
				test([context.contents, context.parameter ?? ''].filter(Boolean).map(data => JSON.stringify(data)).join(' '), () => {
					const result = validator(context);

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

	const contents  = (/^\s*{/.test(rawContents) && /}\s*$/.test(rawContents)) ? rawContents.trim().replace(/^\t+/gm, '') : rawContents;
	const lines     = getLines(contents);
	const jsonValue = tryParsingJsonValue(contents);
	const jsonAst   = tryParsingJsonAst(contents);

	switch (targetType) {
		// TODO
		case RuleTargetType.DirectoryListing:
			throw new TypeError();

		case RuleTargetType.FileContents:
			return buildRuleContext({ contents, lines, parameter });

		default:
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

				case RuleTargetType.JsonString:
					if (typeof jsonValue !== 'string') {
						throw new TypeError();
					}
					return buildRuleContext({ contents, lines, jsonString: jsonValue, jsonAst: jsonAst, parameter });
			}
	}

	return buildRuleContext({});
}
