import { posix } from 'path';
import { constants as fsConstants } from 'fs';
import cliquish, { getVerbosityLevel } from 'cliquish';
import { access as testDirectoryAccess } from 'fs/promises';
const { isAbsolute: isAbsolutePath, relative: getRelativePath } = posix;

import { PropertyPath } from './lib/helpers/properties';
import { findGitRepoRoot } from './lib/helpers/git';
import { FsPath, joinPathSegments, getAbsolutePath, normalizePath } from './lib/helpers/fs';

import { loadConfig } from './lib/config';
import { testConditions } from './lib/conditions';
import { RuleStatus, RuleErrorType } from './lib/rules';
import { LintResult, LintStatus, lintDirectory } from './lib/linter';
import { getRuleDocumentationUrl, getTargetHeader } from './lib/reports';
import { getSuccessReport, getErrorReport, getDisabledRuleReport, getSkippedRuleReport, getTotalsReport, getConditionsStatusReport } from './lib/reports';

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
			'absolute-paths': { type: 'boolean', default: false, desc: 'Use absolute paths in the results summary'                                          },
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

	let directoriesToLint: Array<string> = [];
	try {
		directoriesToLint = await Promise.all((options._.length > 0 ? options._ : ['.']).map(async arg => {
			const directory = normalizePath(arg.toString());
			await testDirectoryAccess(directory, fsConstants.R_OK);

			return isAbsolutePath(directory) ? directory : joinPathSegments([currentWorkingDirectory, directory]);
		}));
	} catch (error) {
		console.error(error.message);
		process.exitCode = 1;
	}

	const selectedRules = options.rules === '*' ? undefined : options.rules.split(',');

	// TODO: check depreciations in `parseRules` instead?
	// const depreciatedRules = [...depreciations.keys()];
	// const depreciatedRulesUsed: Array<string> = [];
	// depreciatedRulesUsed.push(...rules.map(rule => rule.name).filter(ruleName => depreciatedRules.includes(ruleName)));

	const reports: Array<string> = [];
	const totals = {
		errors:   0,
		warnings: 0,
		skipped:  0,
	};
	for (const directory of directoriesToLint) {
		const config     = await loadConfig();
		const conditions = await testConditions(directory, config.conditions ?? {});
		const results    = await lintDirectory(directory, config.rules ?? {}, conditions, selectedRules);

		if (verbosityLevel >= 2) {
			const conditionsStatusReport = [...conditions.entries()].map(([name, status]) => getConditionsStatusReport(name, status)).join('\n');
			if (conditionsStatusReport.length > 0) {
				console.log(`\nConditions status in "${getAbsolutePath([directory])}":\n${conditionsStatusReport}`);
			}
		}

		let currentTarget: [FsPath, PropertyPath] = ['', undefined];
		for (const result of results) {
			const report = parseLintResult(result, totals, verbosityLevel, options.skipped);
			if (report === undefined) {
				continue;
			}

			const [fsPath, propertyPath] = result.target;
			if (currentTarget[0] !== fsPath || currentTarget[1] !== propertyPath) {
				reports.push(getTargetHeader(
					options.absolutePaths ? getAbsolutePath([directory, fsPath]) : joinPathSegments([getRelativePath(currentWorkingDirectory, directory), fsPath]),
					propertyPath
				));
				currentTarget = result.target;
			}

			reports.push(report);
		}
	}

	if (totals.errors > 0) {
		process.exitCode = 1;
	}

	if (!options.quiet) {
		if (reports.length > 0) {
			console.log(reports.join('\n'));
		}

		if (Object.values(totals).some(Boolean)) {
			console.log('\n' + getTotalsReport(totals.errors, totals.warnings, totals.skipped) + '\n');
		}
	}

	// TODO
	// if (depreciatedRulesUsed.length > 0) {
	// 	console.log('\n' + getDepreciatedRulesReport([...new Set(depreciatedRulesUsed)]) + '\n');
	// }
}

function parseLintResult(result: LintResult, totals: Record<string, number>, verbosityLevel: number, reportSkippedRules: boolean): string | undefined {
	switch (result.status) {
		case LintStatus.Success:
			return verbosityLevel >= 3 ? getSuccessReport(result) : undefined;

		case LintStatus.SkippedForWrongTargetType:
			return verbosityLevel >= 1 ? getDisabledRuleReport(result, 'rule does not apply to target') : undefined;

		case LintStatus.SkippedForUnfulfilledCondition:
			return verbosityLevel >= 2 ? getDisabledRuleReport(result, `condition "${result.rule.condition?.name ?? ''}" is not fulfilled`) : undefined;

		case LintStatus.Failure: switch (result.error?.type) {
			case RuleErrorType.UnknownRule:
				totals.skipped++;
				return reportSkippedRules ? getSkippedRuleReport(result, 'unknown rule') : undefined;

			case RuleErrorType.InvalidJson:
				totals.skipped++;
				return reportSkippedRules ? getSkippedRuleReport(result, 'invalid JSON encountered') : undefined;

			case RuleErrorType.InvalidTargetType:
				// TODO: return an error report here?
				totals.skipped++;
				return reportSkippedRules ? getSkippedRuleReport(result, 'invalid data or rule does not apply to target') : undefined;

			case RuleErrorType.InvalidParameter:
				totals.skipped++;
				return reportSkippedRules ? getSkippedRuleReport(result, `invalid parameter (see ${getRuleDocumentationUrl(result.rule.name)})`) : undefined;

			case RuleErrorType.Failed: {
				if (result.error === undefined) {
					return undefined;
				}
				switch (result.rule.status) {
					case RuleStatus.Error:   totals.errors++;   break;
					case RuleStatus.Warning: totals.warnings++; break;
				}
				return getErrorReport(result, result.error, verbosityLevel);
			}
		}
	}

	return undefined;
}
