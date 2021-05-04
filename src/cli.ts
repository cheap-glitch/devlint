import { posix } from 'path';
import { constants as fsConstants } from 'fs';
import { access as testDirectoryAccess } from 'fs/promises';

import cliquish, { getVerbosityLevel } from 'cliquish';

import { findGitRepoRoot } from './lib/helpers/git';
import { joinPathSegments, getAbsolutePath } from './lib/helpers/fs';

import { loadConfig } from './lib/config';
import { depreciations } from './lib/depreciations';
import { testConditions } from './lib/conditions';
import { LintStatus, lintDirectory } from './lib/linter';
import { RuleStatus, RuleErrorType, parseRules } from './lib/rules';
import { getRuleDocumentationUrl, formatTargetPath, getErrorReport, getDisabledRuleReport, getSkippedRuleReport, getTotalsReport, getConditionsStatusReport, getDepreciatedRulesReport } from './lib/reports';

const { isAbsolute: isAbsolutePath, normalize: normalizePath, relative: getRelativePath } = posix;

export async function cli(): Promise<void> {
	const options =
		cliquish({
			synopsis: '$0 [<option>]... [<dir>]...',
			arguments: {
				dir: [
					'Path to a directory or git repo (if no paths are specified,',
					'defaults to the current working directory)',
				],
			},
			websiteUrl:           'https://devlint.org',
			enableCompletion:     true,
			advancedVerboseFlags: true,
		})
		.options({
			// FIXME: https://github.com/yargs/yargs/issues/1679
			'absolute-paths': { type: 'boolean', default: false, desc: 'Use absolute paths in the results summary' },
			'git-root':       { type: 'boolean', default: true,  desc: 'Lint from the root of the current git repo (disable with --no-git-root)'            },
			rules:            { type: 'string',  default: '*',   desc: 'Specify exactly which rules to use by passing a comma-separated list of rule names' },
			skipped:          { type: 'boolean', default: true,  desc: 'Print a report for skipped rules (disable with --no-skipped)'                       },
		})
		.example([
			['$0',               'Lint in the current directory'],
			['$0 /a/b/c ../d/e', 'Lint in the specified directories'],
			['$0 --rules a,b,c', 'Lint using only the listed rules'],
			['$0 -vv',           'Set the verbosity level to 2'],
		])
		.parse();

	const verbosityLevel = getVerbosityLevel(options);

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
		const relativePath = getRelativePath(currentWorkingDirectory, directory);
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

		if (verbosityLevel >= 2) {
			const conditionsStatusReport = Object.entries(conditions).map(([name, status]) => getConditionsStatusReport(name, status)).join('\n');
			if (conditionsStatusReport.length > 0) {
				console.log(`\nConditions status in ${getAbsolutePath([directory])}:\n` + conditionsStatusReport);
			}
		}

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
					formatTargetPath(options.absolutePaths ? getAbsolutePath([directory, fsPath]) : joinPathSegments([relativePath, fsPath]), propertyPath) +
					'\n' +
					reports.join(verbosityLevel >= 1 ? '\n\n' : '\n')
				);
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
