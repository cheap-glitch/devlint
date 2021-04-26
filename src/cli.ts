import yargs from 'yargs';
import { posix } from 'path';
import { constants as fsConstants } from 'fs';
import { access as testDirectoryAccess } from 'fs/promises';

import { findGitRepoRoot } from './lib/helpers/git';
import { joinPathSegments, getAbsolutePath } from './lib/helpers/fs';

import { loadConfig } from './lib/config';
import { depreciations } from './lib/depreciations';
import { testConditions } from './lib/conditions';
import { LintStatus, lintDirectory } from './lib/linter';
import { RuleStatus, RuleErrorType, parseRules } from './lib/rules';
import { getRuleDocumentationUrl, formatTargetPath, getErrorReport, getDisabledRuleReport, getSkippedRuleReport, getTotalsReport, getConditionsStatusReport, getDepreciatedRulesReport } from './lib/reports';

const { isAbsolute: isAbsolutePath, normalize: normalizePath } = posix;

export async function cli(): Promise<void> {
	const options = yargs(process.argv.slice(2))
		.parserConfiguration({
			'duplicate-arguments-array': false,
			'strip-aliased':             true,
			'strip-dashed':              true,
		})
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		.usage(`DevLint v${require(getAbsolutePath([__dirname, '..', '..', 'package.json'])).version}\n`)
		.usage('Usage:\n  $0 [OPTION]... [DIR]...\n')
		.usage(`Arguments:\n  <DIR>  Path to a directory/git repo (if no paths are specified,\n${' '.repeat(9)}defaults to the current working directory)`)
		.example([
			['$0',               'Lint in the current directory'],
			['$0 /a/b/c ../d/e', 'Lint in the specified directories'],
			['$0 --rules a,b,c', 'Lint using only the listed rules'],
			['$0 -vv',           'Set the verbosity level to 2'],
		])
		.options({
			// FIXME when https://github.com/yargs/yargs/issues/1679 is done
			'git-root': {             type: 'boolean', default: true, desc: 'Lint from the root of the current git repo (disable with --no-git-root)'            },
			quiet:      { alias: 'q', type: 'boolean',                desc: 'Do not print anything to stdout'                                                    },
			rules:      {             type: 'string',  default: '*',  desc: 'Specify exactly which rules to use by passing a comma-separated list of rule names' },
			skipped:    {             type: 'boolean', default: true, desc: 'Print a report for skipped rules (disable with --no-skipped)'                       },
			v:          {             type: 'count',                  desc: 'Enable verbose output (repeat to increase the verbosity level)'                     },
			verbose:    {             type: 'number',                 desc: 'Enable verbose output (pass a number bewteen 1 and 3 to set the verbosity level)'   },
		})
		.conflicts('quiet', 'verbose')
		.completion('completion', 'Generate auto-completion script')
		.epilogue('Enable auto-completion with one of the following commands:\n  Linux  devlint completion >> ~/.bashrc\n  OSX    devlint completion >> ~/.bash_profile\n')
		.epilogue('https://devlint.org')
		.epilogue('Copyright © 2021-present, cheap glitch')
		.epilogue('This software is distributed under the ISC license')
		.showHelpOnFail(false, 'Try --help for more information')
		.argv;

	const selectedRules = (options.rules === '*') ? undefined : options.rules.split(',');

	let verbosityLevel = options.v;
	if (!Number.isNaN(options.verbose)) {
		if (options.verbose !== undefined) {
			verbosityLevel = Math.max(0, Math.trunc(options.verbose));
		} else if ('verbose' in options) {
			verbosityLevel = 1;
		}
	}

	let currentWorkingDirectory = process.cwd();
	if (options.gitRoot) {
		const gitRepoRoot = await findGitRepoRoot([currentWorkingDirectory]);
		if (gitRepoRoot !== undefined) {
			currentWorkingDirectory = gitRepoRoot;
		}
	}

	const lintedDirectories = await Promise.all((options._.length > 0 ? options._ : ['.']).map(async arg => {
		const directory = normalizePath(arg.toString());
		await testDirectoryAccess(directory, fsConstants.R_OK);

		return isAbsolutePath(directory) ? directory : joinPathSegments([currentWorkingDirectory, directory]);
	}));

	const totals = {
		errors:   0,
		warnings: 0,
		skipped:  0,
	};

	const selectedRulesNames = (options.rules === '*') ? undefined : options.rules.split(',');

	const depreciatedRules = Object.keys(depreciations);
	const depreciatedRulesUsed: Array<string> = [];

	for (const directory of lintedDirectories) {
		// TODO: avoid loading the config for every directory
		const config = await loadConfig();

		const rules = parseRules(config?.rules ?? {});
		const selectedRules = (selectedRulesNames === undefined) ? rules : rules.filter(rule => selectedRulesNames.includes(rule.name));
		if (selectedRules.length === 0) {
			continue;
		}

		// TODO: check depreciations in `parseRules` instead?
		depreciatedRulesUsed.push(...rules.map(rule => rule.name).filter(ruleName => depreciatedRules.includes(ruleName)));

		const conditions = await testConditions(directory, config?.conditions ?? {});
		const results    = await lintDirectory(directory, selectedRules, conditions);

		for (const [fsPath, fsTargetResults] of results.entries()) {
			for (const [propertyPath, propertyTargetResults] of fsTargetResults.entries()) {
				const reports: Array<string> = [];
				for (const result of propertyTargetResults) {
					switch (result.status) {
						case LintStatus.SkippedForWrongTargetType:
							if (verbosityLevel >= 1) {
								reports.push(getDisabledRuleReport(result, "rule doesn't apply to target type"));
							}
							break;

						case LintStatus.SkippedForUnfulfilledCondition:
							if (verbosityLevel >= 2) {
								reports.push(getDisabledRuleReport(result, `condition "${result.rule.condition}" is false`));
							}
							break;

						case LintStatus.Error: switch (result.error?.type) {
							case RuleErrorType.UnknownRule:
								totals.skipped++;
								if (options.skipped) {
									reports.push(getSkippedRuleReport(result, 'unknown rule'));
								}
								break;

							case RuleErrorType.InvalidJson:
								totals.skipped++;
								if (options.skipped) {
									reports.push(getSkippedRuleReport(result, 'invalid JSON encountered'));
								}
								break;

							case RuleErrorType.InvalidTargetType:
								// TODO: return an error report here?
								totals.skipped++;
								if (options.skipped) {
									reports.push(getSkippedRuleReport(result, 'invalid data or rule does not apply to target'));
								}
								break;

							case RuleErrorType.InvalidParameter:
								totals.skipped++;
								if (options.skipped) {
									reports.push(getSkippedRuleReport(result, `invalid parameter (see ${getRuleDocumentationUrl(result.rule.name)})`));
								}
								break;

							case RuleErrorType.Failed:
								if (result.error === undefined) {
									break;
								}
								switch (result.rule.status) {
									case RuleStatus.Error:   totals.errors++;   break;
									case RuleStatus.Warning: totals.warnings++; break;
								}
								reports.push(getErrorReport(result, result.error, verbosityLevel));
						}
					}
				}

				if (options.quiet || reports.length === 0) {
					continue;
				}

				console.log(
					'\n' +
					formatTargetPath(lintedDirectories.length > 1 ? getAbsolutePath([directory, fsPath]) : fsPath, propertyPath) +
					'\n' +
					reports.join(verbosityLevel >= 1 ? '\n\n' : '\n')
				);
			}
		}

		if (verbosityLevel >= 2) {
			const conditionsStatusReport = Object.entries(conditions).map(([name, status]) => getConditionsStatusReport(name, status)).join('\n');
			if (conditionsStatusReport.length > 0) {
				console.log(`\nConditions status in ${getAbsolutePath([directory])}:\n` + conditionsStatusReport);
			}
		}
	}

	if (!options.quiet && Object.values(totals).some(Boolean)) {
		console.log('\n' + getTotalsReport(totals.errors, totals.warnings, totals.skipped) + '\n');
	}
	if (totals.errors > 0) {
		process.exitCode = 1;
	}

	if (depreciatedRulesUsed.length > 0) {
		console.log('\n' + getDepreciatedRulesReport([...new Set(depreciatedRulesUsed)]) + '\n');
	}
}
