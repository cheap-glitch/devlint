import yargs from 'yargs';

import { joinPathSegments, getAbsolutePath } from './lib/helpers/fs';

import { lint } from './lib/linter';
import { RuleStatus, RuleErrorType } from './lib/rules';
import { formattedHeader, ruleErrorReport, skippedRuleReport, totalsReport } from './lib/reports';

export async function cli(): Promise<void> {
	const options = yargs(process.argv.slice(2))
		.usage('Usage:\n  $0 [OPTION]... [DIR]\n\nArguments:\n  <DIR>  The directory in which to lint  [default: "."]')
		.example([
			['$0',                                     'Lint in the current directory'],
			['$0 path/to/directory',                   'Lint in the specified directory'],
			['$0 --rules lines-no-empty,match-object', 'Lint using only the listed rules'],
		])
		.options({
			fix:   { type: 'boolean', default: false,             description: 'Automatically fix problems'                               },
			quiet: { type: 'boolean', default: false, alias: 'q', description: 'Do not print anything to stdout'                          },
			rules: { type: 'string',  default: '*',               description: 'Specify a comma-separated list of rule names to consider' },
		})
		.epilogue('https://devlint.org')
		.epilogue('Copyright © 2021-present, cheap glitch')
		.epilogue('This software is distributed under the ISC license')
		.argv;

	const workingDirectory = (typeof options._[0] === 'string') ? options._[0] : '.';

	const results = await lint(joinPathSegments([process.cwd(), workingDirectory]), (options.rules === '*') ? undefined : options.rules.split(','));
	const totals  = {
		errors:   0,
		warnings: 0,
		skipped:  0,
	};

	for (const [[targetFsPath, targetPropertiesPathSegments], targetResults] of results) {
		const reports = targetResults.map(([rule, result]) => {
			if (result === true) {
				return '';
			}

			switch (result.type) {
				case RuleErrorType.UnknownRule:
					totals.skipped++;
					return skippedRuleReport(rule, 'unknown rule');

				case RuleErrorType.InvalidData:
					totals.skipped++;
					return skippedRuleReport(rule, 'invalid data or rule does not apply to target');

				case RuleErrorType.InvalidParameters:
					totals.skipped++;
					return skippedRuleReport(rule, `invalid parameters (cf. https://devlint.org/rules/${rule.name})`);

				case RuleErrorType.Failed:
					switch (rule.status) {
						case RuleStatus.Error:   totals.errors++;   break;
						case RuleStatus.Warning: totals.warnings++; break;
					}
					return ruleErrorReport(rule, result);
			}

			return undefined;
		})
		.filter(Boolean);

		if (!options.quiet && reports.length > 0) {
			const fullTargetPath = getAbsolutePath([process.cwd(), workingDirectory, targetFsPath]) + targetPropertiesPathSegments.replace('.', '#');
			console.log('\n' + formattedHeader(fullTargetPath) + '\n' + reports.join('\n'));
		}
	}

	if (!options.quiet && Object.values(totals).some(Boolean)) {
		console.log('\n' + totalsReport(totals.errors, totals.warnings, totals.skipped) + '\n');
	}
	if (totals.errors > 0) {
		process.exitCode = 1;
	}
}
