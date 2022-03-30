import { posix } from 'path';
import { constants as fsConstants } from 'fs';
import { cliquish, getVerbosityLevel } from 'cliquish';
import { access as testDirectoryAccess } from 'fs/promises';

import { LintStatus, lint } from './lib/linter';
import { RuleStatus, RuleErrorType } from './lib/rules';
import { getWorkingDirectory, joinPathSegments, getAbsolutePath, normalizePath } from './lib/helpers/fs';
import { getRuleDocumentationUrl, getTargetHeader, getSuccessReport, getErrorReport, getDisabledRuleReport, getSkippedRuleReport, getTotalsReport, getConditionsStatusReport } from './lib/reports';

import type { FsPath } from './lib/helpers/fs';
import type { LintResult } from './lib/linter';
import type { PropertyPath } from './lib/helpers/properties';

export async function cli(): Promise<void> {
	const options
		= await cliquish({
			synopsis: '$0 [OPTION] [DIR...]',
			arguments: {
				dir: [
					'Path to a directory or git repo (if no paths are specified,',
					'defaults to the current working directory)',
				],
			},
			websiteUrl: 'https://devlint.org',
			enableCompletion: true,
			advancedVerboseFlags: true,
		})
		.options({
			// FIXME [>=0.9.0]: https://github.com/yargs/yargs/issues/1679
			'absolute-paths': { type: 'boolean', default: false, desc: 'Use absolute paths in the results summary' },
			'git-root': { type: 'boolean', default: true, desc: 'Lint from the root of the current git repo (disable with --no-git-root)' },
			'rules': { type: 'string', default: '*', desc: 'Specify exactly which rules to use by passing a comma-separated list of rule names' },
			'skipped': { type: 'boolean', default: true, desc: 'Print a report for skipped rules (disable with --no-skipped)' },
		})
		.example([
			['$0', 'Lint in the current directory'],
			['$0 /a/b/c ../d/e', 'Lint in the specified directories'],
			['$0 --rules a,b,c', 'Lint using only the listed rules'],
			['$0 -vv', 'Set the verbosity level to 2'],
		])
		.parse();

	const verbosityLevel = getVerbosityLevel(options);
	const workingDirectory = await getWorkingDirectory(options.gitRoot);

	let directories: FsPath[] = [];
	try {
		directories = await Promise.all((options._.length > 0 ? options._ : ['.']).map(async argument => {
			const directory = normalizePath(String(argument));
			await testDirectoryAccess(directory, fsConstants.R_OK);

			return posix.isAbsolute(directory) ? directory : joinPathSegments([workingDirectory, directory]);
		}));
	} catch (error) {
		console.error(error.message);
		process.exitCode = 1;
	}

	const results = await lint(directories, options.rules === '*' ? undefined : options.rules.split(','));

	const reports: string[] = [];
	/*! const jsonReports: Record<FsPath, Record<PropertyPath, Array<JsonObject>>> = []; */
	const totals = {
		errors: 0,
		warnings: 0,
		skipped: 0,
	};
	for (const [directory, { conditions, results: directoryResults }] of results) {
		if (verbosityLevel >= 2 && conditions.size > 0) {
			// TODO [2022-03-01]: move this in `reports.ts`
			console.log('\n' + getAbsolutePath([directory]) + '\n');
			for (const [name, status] of conditions.entries()) {
				console.log(getConditionsStatusReport(name, status));
			}
		}

		let currentTarget = ['' as FsPath, undefined as PropertyPath];
		for (const result of directoryResults) {
			const report = parseLintResult(result, totals, {
				verbosityLevel,
				reportSkippedRules: options.skipped,
			});

			if (report === undefined) {
				continue;
			}

			const [fsPath, propertyPath] = result.target;
			if (currentTarget[0] !== fsPath || currentTarget[1] !== propertyPath) {
				reports.push(getTargetHeader(
					options.absolutePaths ? getAbsolutePath([directory, fsPath]) : joinPathSegments([posix.relative(workingDirectory, directory), fsPath]),
					propertyPath,
				));
				currentTarget = result.target;
			}

			reports.push(report);
		}
	}

	if (totals.errors > 0) {
		process.exitCode = 1;
	}

	if (options.quiet) {
		return;
	}

	if (reports.length > 0) {
		console.log(reports.join('\n'));
	}

	if (Object.values(totals).some(Boolean)) {
		console.log('\n' + getTotalsReport(totals.errors, totals.warnings, totals.skipped) + '\n');
	} else if (reports.length > 0) {
		console.log();
	}

	// TODO [>=4.0.0]: check depreciations in `parseRules` instead?
	/*
	 *!
	 *const depreciatedRules = [...depreciations.keys()];
	 *const depreciatedRulesUsed: Array<string> = [];
	 *depreciatedRulesUsed.push(...rules.map(rule => rule.name).filter(ruleName => depreciatedRules.includes(ruleName)));
	 *if (depreciatedRulesUsed.length > 0) {
	 *console.log('\n' + getDepreciatedRulesReport([...new Set(depreciatedRulesUsed)]) + '\n');
	 *}
	 */
}

function parseLintResult(result: LintResult, totals: Record<string, number>, { verbosityLevel, reportSkippedRules }: { verbosityLevel: number; reportSkippedRules: boolean }): string | undefined {
	switch (result.status) {
		case LintStatus.Success:
			return verbosityLevel >= 3 ? getSuccessReport(result) : undefined;

		case LintStatus.SkippedForWrongTargetType:
			return verbosityLevel >= 1 ? getDisabledRuleReport(result, 'rule does not apply to target') : undefined;

		case LintStatus.SkippedForUnfulfilledCondition:
			return verbosityLevel >= 2 ? getDisabledRuleReport(result, `condition "${result.rule.condition}" is not fulfilled`) : undefined;

		case LintStatus.Failure: switch (result.error?.type) {
			case RuleErrorType.UnknownRule:
				totals.skipped++;

				return reportSkippedRules ? getSkippedRuleReport(result, 'unknown rule') : undefined;

			case RuleErrorType.InvalidJson:
				totals.skipped++;

				return reportSkippedRules ? getSkippedRuleReport(result, 'invalid JSON encountered') : undefined;

			case RuleErrorType.InvalidTargetType:
				// TODO [>0.5.0]: return an error report here?
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
					case RuleStatus.Error:
						totals.errors++;
						break;

					case RuleStatus.Warning:
						totals.warnings++;
						break;

					default: break;
				}

				return getErrorReport(result, result.error, verbosityLevel);
			}

			// TODO [>0.4.0]: Print a message for the other possible error types in verbose mode
			default: return;
		}

		default: throw new Error(`Unknown lint result "${result.status}"`);
	}

	return undefined;
}
