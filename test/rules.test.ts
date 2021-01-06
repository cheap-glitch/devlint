import { readdirSync } from 'fs';
import { JsonValue } from 'type-fest';

import { getLines } from '../src/lib/helpers/text';
import { tryParsingJsonObject, tryParsingJsonAst } from '../src/lib/helpers/json';
import { joinPathSegments, getAbsolutePath } from '../src/lib/helpers/fs';

import { RuleContext, RuleError, RuleErrorLocation } from '../src/lib/rules';

interface TestSnippetsCollection {
	passing: Array<TestSnippet>,
	failing: {
		defaultErrorMessage?: string,
		snippets: Array<[TestSnippet, string | undefined, RuleErrorLocation | undefined, RuleErrorLocation | undefined]>,
	}
}

type TestSnippet = string | [string, JsonValue];

function buildSnippetContext(snippet: TestSnippet): RuleContext {
	const [contents, parameter] = (typeof snippet === 'string') ? [snippet, undefined] : snippet;

	return {
		contents, parameter,

		lines:      getLines(contents),
		jsonObject: tryParsingJsonObject(contents),
		jsonAst:    tryParsingJsonAst(contents),
	};
}

const pathToRuleModules = joinPathSegments([__dirname, '..', 'build', 'src', 'lib', 'rules']);
const rulesToTest = readdirSync(getAbsolutePath([__dirname, 'snippets']), { withFileTypes: true })
	            .filter(directoryEntry => directoryEntry.isFile() && directoryEntry.name.endsWith('.js'))
	            .map(file => file.name);

for (const filename of rulesToTest) {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const validator = require(getAbsolutePath([pathToRuleModules, filename])).default;
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { passing: passingSnippets, failing: failingSnippets }: TestSnippetsCollection = require(getAbsolutePath([__dirname, 'snippets', filename]));

	// eslint-disable-next-line jest/valid-title
	describe(filename.replace(/\.js$/, ''), () => {
		for (const snippet of passingSnippets) {
			const context = buildSnippetContext(snippet);

			// eslint-disable-next-line jest/valid-title
			test(JSON.stringify(snippet), () => expect(validator(context)).toBe(true));
		}
		for (const [snippet, errorMessage, errorStart, errorEnd] of failingSnippets.snippets) {
			const context = buildSnippetContext(snippet);

			// eslint-disable-next-line jest/valid-title
			test(JSON.stringify(snippet), () => {
				const result = validator(context);

				expect(result).toBeInstanceOf(Error);
				expect(result).toMatchObject({ ...new RuleError(errorMessage || failingSnippets.defaultErrorMessage || '', errorStart, errorEnd) });
			});
		}
	});
}
