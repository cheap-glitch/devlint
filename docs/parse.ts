import chalk from 'chalk';
import * as tsdoc from '@microsoft/tsdoc';

import { capitalize } from '../src/lib/helpers/text';
import { readFileContents, getFilenamesInDirectory } from '../src/lib/helpers/fs';

// https://github.com/microsoft/tsdoc/blob/master/api-demo/src/simpleDemo.ts
(async () => {
	const parser = new tsdoc.TSDocParser();

	const pathToRulesFolder = [__dirname, '..', '..', 'src', 'rules'];
	const rulesFilenames = await getFilenamesInDirectory(pathToRulesFolder, file => file.name.endsWith('.ts'));

	for (const filename of rulesFilenames) {
		const logError = (message: string): void => {
			console.error(chalk`{blue.bold ${filename.replace('.ts', '')}:} ${capitalize(message)}`);
			process.exitCode = 1;
		};

		const fileContents = await readFileContents([...pathToRulesFolder, filename]);
		const documentationComments = fileContents.match(/\/\*\*.+?\*\//usg);

		if (!documentationComments) {
			logError('missing doc comment');
			continue;
		}

		for (const comment of documentationComments) {
			const context: tsdoc.ParserContext = parser.parseString(comment);
			for (const message of context.log.messages) {
				logError(String(message));
			}

			const documentNode = context.docComment;
			if (!documentNode.summarySection) {
				logError('missing summary section');
			}

			const exampleBlocks = documentNode.getChildNodes().filter(node => {
				if (node.kind !== tsdoc.DocNodeKind.Block) {
					return false;
				}

				const firstChild = node.getChildNodes()[0];
				if (firstChild?.kind !== tsdoc.DocNodeKind.BlockTag) {
					return false;
				}

				const firstGrandchild = firstChild.getChildNodes()[0];
				if (!(firstGrandchild instanceof tsdoc.DocExcerpt) || firstGrandchild?.excerptKind !== tsdoc.ExcerptKind.BlockTag) {
					return false;
				}
				if (String(firstGrandchild.content) !== '@example') {
					return false;
				}

				return true;
			});
			if (exampleBlocks.length !== 2) {
				logError('need exactly two example blocks');
			}

			const [validSnippets, invalidSnippets] = exampleBlocks.map(exampleBlock => {
				const sectionNode = exampleBlock.getChildNodes()[1];
				if (sectionNode === undefined || sectionNode.kind !== tsdoc.DocNodeKind.Section) {
					return [];
				}

				return sectionNode
					.getChildNodes()
					.filter(childNode => childNode.kind === tsdoc.DocNodeKind.FencedCode)
					.map(fencedCodeNode => {
						let lang = '';
						const contents: string[] = [];

						for (const childNode of fencedCodeNode.getChildNodes()) {
							if (!(childNode instanceof tsdoc.DocExcerpt)) {
								continue;
							}

							switch (childNode.excerptKind) {
								case tsdoc.ExcerptKind.FencedCode_Language:
									lang = String(childNode.content);
									break;

								case tsdoc.ExcerptKind.Spacing:
								case tsdoc.ExcerptKind.FencedCode_Code:
									contents.push(String(childNode.content));
									break;

								case tsdoc.ExcerptKind.FencedCode_ClosingFence:
									return {
										lang: lang === '' ? 'text' : lang,
										contents: contents.join('').trim(),
									};

								default:
									break;
							}
						}

						return contents;
					});
			});
			if (validSnippets.length === 0 || invalidSnippets.length === 0) {
				logError('need at least one snippet in each example block');
			}
			if (validSnippets.includes() || invalidSnippets.includes()) {
				logError('invalid code snippet in example block');
			}
		}
	}
})();

// https://github.com/microsoft/tsdoc/blob/master/api-demo/src/Formatter.ts
/*
 * disabled
 * function renderDocNode(docNode: tsdoc.DocNode): string {
 * if (!docNode) {
 * return '';
 * }
 *
 * let result: string = '';
 * if (docNode instanceof tsdoc.DocExcerpt) {
 * result += docNode.content.toString();
 * }
 * for (const childNode of docNode.getChildNodes()) {
 * result += renderDocNode(childNode);
 * }
 *
 * return result;
 * }
 */

// https://github.com/microsoft/tsdoc/blob/600ecd97c94fa21c6122a88a6fa9c689caa85d97/api-demo/src/advancedDemo.ts#L124
/*
 * disabled
 * function dumpTSDocTree(docNode: tsdoc.DocNode, indent = ''): void {
 * if (docNode instanceof tsdoc.DocExcerpt) {
 * console.log(chalk.gray(indent + docNode.excerptKind + ' = ') + chalk.cyan(JSON.stringify(docNode.content.toString())));
 * } else {
 * console.log(indent + docNode.kind);
 * }
 *
 * for (const child of docNode.getChildNodes()) {
 * dumpTSDocTree(child, indent + '  ');
 * }
 * }
 */
