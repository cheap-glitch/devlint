import yargs from 'yargs';
import { posix } from 'path';
import { constants as fsConstants } from 'fs';
import { access as testDirectoryAccess } from 'fs/promises';

import { findGitRepoRoot } from './lib/helpers/git';
import { insertValueInNestedMap } from './lib/helpers/utilities';
import { FsPath, joinPathSegments, getAbsolutePath } from './lib/helpers/fs';
import { PropertiesPath, joinPropertiesPathSegments } from './lib/helpers/properties';

import { loadConfig } from './lib/config';
import { depreciations } from './lib/depreciations';
import { testConditions } from './lib/conditions';
import { SkippedRuleReason, lintDirectory } from './lib/linter';
import { RuleStatus, RuleErrorType, parseRules } from './lib/rules';
import { getRuleDocumentationUrl, formatTargetPath } from './lib/reports';
import { conditionStatusReport, ruleErrorReport, disabledRuleReport, skippedRuleReport, totalsReport, depreciatedRulesReport } from './lib/reports';

const { isAbsolute: isAbsolutePath, normalize: normalizePath } = posix;

export async function cli(): Promise<void> {
	const options = yargs(process.argv.slice(2))
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
			quiet:      { type: 'boolean', default: false, alias: 'q', description: 'Do not print anything to stdout'                                                    },
			// FIXME when https://github.com/yargs/yargs/issues/1679 is done
			'git-root': { type: 'boolean', default: true,              description: 'Lint from the root of the current git repo (disable with --no-git-root)'            },
			rules:      { type: 'string',  default: '*',               description: 'Specify exactly which rules to use by passing a comma-separated list of rule names' },
			skipped:    { type: 'boolean', default: true,              description: 'Print a report for skipped rules (disable with --no-skipped)'                       },
			v:          { type: 'count',   default: 0,                 description: 'Enable verbose output (repeat to increase the verbosity level)'                     },
			verbose:    { type: 'number',                              description: 'Enable verbose output (pass a number bewteen 1 and 3 to set the verbosity level)'   },
		})
		.completion('completion', 'Generate auto-completion script')
		.epilogue('Enable auto-completion with one of the following commands:\n  Linux  devlint completion >> ~/.bashrc\n  OSX    devlint completion >> ~/.bash_profile\n')
		.epilogue('https://devlint.org')
		.epilogue('Copyright © 2021-present, cheap glitch')
		.epilogue('This software is distributed under the ISC license')
		.argv;

	const selectedRules = (options.rules === '*') ? undefined : options.rules.split(',');

	let verbosityLevel = options.v;
	if (!Number.isNaN(options.verbose)) {
		if (options.verbose !== undefined) {
			verbosityLevel = Math.max(0, Math.trunc(options.verbose));
		} else if (process.argv.includes('--verbose')) {
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

	const depreciatedRules = Object.keys(depreciations);
	const depreciatedRulesUsed: Array<string> = [];

	const totals = {
		errors:   0,
		warnings: 0,
		skipped:  0,
	};
	for (const directory of lintedDirectories) {
		// TODO: avoid loading the config for every directory
		const config = await loadConfig();

		const rules = parseRules(config?.rules ?? {}).filter(rule => selectedRules === undefined || selectedRules.includes(rule.name));
		if (rules.length === 0) {
			continue;
		}

		depreciatedRulesUsed.push(...rules.map(rule => rule.name).filter(ruleName => depreciatedRules.includes(ruleName)));

		const conditions = await testConditions(directory, config?.conditions ?? {});
		const results    = await lintDirectory(directory, rules, conditions);

		const reports: Map<FsPath, Map<PropertiesPath, Array<string>>> = new Map();
		for (const [index, result] of results.entries()) {
			const rule = rules[index];

			const report = (() => {
				if (result === true) {
					return '';
				}

				if (typeof result === 'number') {
					switch (result) {
						case SkippedRuleReason.ConditionIsFalse:
							return verbosityLevel >= 2 ? disabledRuleReport(verbosityLevel, rule, `condition "${rule.condition}" is false`) : '';

						case SkippedRuleReason.WrongTargetType:
							return verbosityLevel >= 1 ? disabledRuleReport(verbosityLevel, rule, "rule doesn't apply to target type") : '';
					}
				}

				switch (result.type) {
					case RuleErrorType.UnknownRule:
						totals.skipped++;
						return options.skipped ? skippedRuleReport(verbosityLevel, rule, 'unknown rule') : '';

					case RuleErrorType.InvalidTargetType:
						// TODO: return an error report here?
						totals.skipped++;
						return options.skipped ? skippedRuleReport(verbosityLevel, rule, 'invalid data or rule does not apply to target') : '';

					case RuleErrorType.InvalidParameter:
						totals.skipped++;
						return options.skipped ? skippedRuleReport(verbosityLevel, rule, `invalid parameter (see ${getRuleDocumentationUrl(rule.name)})`) : '';

					case RuleErrorType.Failed:
						switch (rule.status) {
							case RuleStatus.Error:   totals.errors++;   break;
							case RuleStatus.Warning: totals.warnings++; break;
						}
						return ruleErrorReport(verbosityLevel, rule, result);
				}
			})();

			if (report.length === 0) {
				continue;
			}

			const [targetFsPath, targetPropertiesPathSegments] = rule.target;
			insertValueInNestedMap(reports, targetFsPath, joinPropertiesPathSegments(targetPropertiesPathSegments), [report]);
		}

		if (options.quiet) {
			continue;
		}

		if (verbosityLevel >= 1) {
			const conditionsStatusReport = Object.entries(conditions).map(([name, status]) => conditionStatusReport(name, status)).join('\n');
			if (conditionsStatusReport.length > 0) {
				console.log(`\nConditions status in ${getAbsolutePath([directory])}:\n` + conditionsStatusReport);
			}
		}

		for (const [targetFsPath, targetFsReports] of reports.entries()) {
			for (const [targetPropertiesPath, targetPropertiesReports] of targetFsReports.entries()) {
				console.log(
					'\n' +
					formatTargetPath(getAbsolutePath([directory, targetFsPath]), targetPropertiesPath) +
					'\n' +
					targetPropertiesReports.join(verbosityLevel >= 1 ? '\n\n' : '\n')
				);
			}
		}
	}

	if (!options.quiet && Object.values(totals).some(Boolean)) {
		console.log('\n' + totalsReport(totals.errors, totals.warnings, totals.skipped) + '\n');
	}
	if (totals.errors > 0) {
		process.exitCode = 1;
	}

	if (depreciatedRulesUsed.length > 0) {
		console.log('\n' + depreciatedRulesReport([...new Set(depreciatedRulesUsed)]) + '\n');
	}
}
