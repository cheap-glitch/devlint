import { readdirSync } from 'fs';
import { JsonValue } from 'type-fest';

import { getLines } from '../src/lib/helpers/text';
import { tryParsingJsonObject, tryParsingJsonAst } from '../src/lib/helpers/json';
import { joinPathSegments, getAbsolutePath } from '../src/lib/helpers/fs';

import { RuleContext, RuleError, RuleErrorType, RuleErrorLocation } from '../src/lib/rules';

interface TestSnippetsCollection {
	passing: Array<TestSnippet>,
	failing: {
		defaultErrorMessage?: string,
		snippets: Array<[TestSnippet, RuleErrorType | string | undefined, RuleErrorLocation | undefined, RuleErrorLocation | undefined]>,
	}
}

type TestSnippet = string | [string, JsonValue];

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
			test([context.contents, context.parameter ? JSON.stringify(context.parameter) : ''].filter(Boolean).join('\n'), () => {
				const result = validator(context);
				if (result instanceof Error) {
					console.error(result);
				}

				expect(result).toBe(true);
			});
		}
		for (const [snippet, errorTypeOrMessage, errorStart, errorEnd] of failingSnippets.snippets) {
			const context = buildSnippetContext(snippet);
			const error   = typeof errorTypeOrMessage === 'number'
				? new RuleError(errorTypeOrMessage)
				: new RuleError(errorTypeOrMessage || failingSnippets.defaultErrorMessage || '', errorStart, errorEnd);

			// eslint-disable-next-line jest/valid-title
			test([context.contents, context.parameter ? JSON.stringify(context.parameter) : ''].filter(Boolean).join('\n'), () => {
				const result = validator(context);

				expect(result).toBeInstanceOf(Error);
				expect(result).toMatchObject({ ...error });
			});
		}
	});
}

function buildSnippetContext(snippet: TestSnippet): RuleContext {
	const [rawContents, parameter] = (typeof snippet === 'string') ? [snippet, undefined] : snippet;

	// Remove the superfluous indentation
	const minIndentationLevel = Math.min(...rawContents.split('\n').filter(line => line.length > 0).map(line => (line.match(/^\t*/) ?? [''])[0].length));
	const contents = rawContents.split('\n').map(line => line.slice(minIndentationLevel)).join('\n');

	return {
		contents, parameter,

		lines:      getLines(contents),
		jsonObject: tryParsingJsonObject(contents),
		jsonAst:    tryParsingJsonAst(contents),
	};
}
