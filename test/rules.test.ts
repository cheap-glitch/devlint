import { readdirSync } from 'fs';
import { JsonValue } from 'type-fest';

import { getLines } from '../src/helpers/text';
import { tryParsingJsonObject, tryParsingJsonAst } from '../src/helpers/json';
import { getAbsolutePath, getFilenamesInDirectory } from '../src/helpers/fs';

import { RuleContext, RuleError, RuleErrorLocation } from '../src/lib/rules';

interface TestSnippetsCollection {
	passing: Array<TestSnippet>,
	failing: {
		defaultErrorMessage?: string,
		snippets: Array<[TestSnippet, { message?: string, start: RuleErrorLocation, end?: RuleErrorLocation }]>,
	}
}

type TestSnippet = string | [string, JsonValue];

function buildSnippetContext(snippet: TestSnippet): RuleContext {
	const [contents, parameters] = (typeof snippet === 'string') ? [snippet, undefined] : snippet;

	return {
		contents,
		parameters,
		lines:      getLines(contents),
		jsonObject: tryParsingJsonObject(contents),
		jsonAst:    tryParsingJsonAst(contents),
	};
}

const rulesToTest = readdirSync(getAbsolutePath([__dirname, 'snippets']), { withFileTypes: true })
	            .filter(directoryEntry => directoryEntry.isFile() && directoryEntry.name.endsWith('.js'))
	            .map(file => file.name);

for (const filename of rulesToTest) {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const validator = require(getAbsolutePath([__dirname, '..', 'build', 'src', 'rules', filename])).default;
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { passing: passingSnippets, failing: failingSnippets }: TestSnippetsCollection = require(getAbsolutePath([__dirname, 'snippets', filename]));

	// eslint-disable-next-line jest/valid-title
	describe(filename.replace(/\.js$/, ''), () => {
		for (const snippet of passingSnippets) {
			const context = buildSnippetContext(snippet);

			// eslint-disable-next-line jest/valid-title
			test(JSON.stringify(snippet), () => expect(validator(context)).toBe(true));
		}
		for (const [snippet, error] of failingSnippets.snippets) {
			const context = buildSnippetContext(snippet);

			// eslint-disable-next-line jest/valid-title
			test(JSON.stringify(snippet), () => {
				const result = validator(context);

				expect(result).toBeInstanceOf(Error);
				expect(result).toMatchObject({ ...new RuleError(error.message || failingSnippets.defaultErrorMessage || '', error.start, error.end) });
			});
		}
	});
}

afterAll(async () => {
	const untestedRules = (await getFilenamesInDirectory(getAbsolutePath([__dirname, '..', 'build', 'src', 'rules']), file => !rulesToTest.includes(file.name)))
	if (untestedRules.length > 0) {
		console.warn('Untested rules:\n' + untestedRules.map(rule => '  * ' + rule.replace('.js', '')).join('\n'));
	}
});
