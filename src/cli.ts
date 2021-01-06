import yargs from 'yargs';

import { joinPathSegments, getAbsolutePath } from './lib/helpers/fs';
import { PROPERTIES_PATH_STARTING_CHARACTER } from './lib/helpers/properties';

import { lint } from './lib/linter';
import { RuleStatus, RuleErrorType } from './lib/rules';
import { formatHeader, ruleErrorReport, skippedRuleReport, totalsReport } from './lib/reports';

export async function cli(): Promise<void> {
	const options = yargs(process.argv.slice(2))
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		.usage(`DevLint v${require(getAbsolutePath([__dirname, '..', '..', 'package.json'])).version}\n`)
		.usage('Usage:\n  $0 [OPTION]... [DIR]\n\nArguments:\n  <DIR>  The directory in which to lint  [default: "."]')
		.example([
			['$0',                   'Lint in the current directory'],
			['$0 path/to/directory', 'Lint in the specified directory'],
			['$0 --rules a,b,c',     'Lint using only the listed rules'],
			['$0 -vv',               'Set the verbosity level to 2'],
		])
		.options({
			fix:     { type: 'boolean', default: false,             description: 'Automatically fix problems'                                                         },
			quiet:   { type: 'boolean', default: false, alias: 'q', description: 'Do not print anything to stdout'                                                    },
			rules:   { type: 'string',  default: '*',               description: 'Specify exactly which rules to use by passing a comma-separated list of rule names' },
			skipped: { type: 'boolean', default: true,              description: 'Print skipped rules (disable with --no-skipped)'                                    },
			v:       { type: 'count',   default: 0,                 description: 'Enable verbose output (repeat to increase the verbosity level)'                     },
			verbose: { type: 'number',                              description: 'Enable verbose output (pass a number bewteen 1 and 3 to set the verbosity level)'   },
		})
		.completion('completion', 'Generate auto-completion script')
		.epilogue('Enable auto-completion with one of the following commands:\n  Linux  devlint completion >> ~/.bashrc\n  OSX    devlint completion >> ~/.bash_profile\n')
		.epilogue('https://devlint.org')
		.epilogue('Copyright © 2021-present, cheap glitch')
		.epilogue('This software is distributed under the ISC license')
		.argv;

	let verbosityLevel = options.v;
	if (!Number.isNaN(options.verbose)) {
		if (options.verbose !== undefined) {
			verbosityLevel = Math.max(0, Math.trunc(options.verbose));
		} else if (process.argv.includes('--verbose')) {
			verbosityLevel = 1;
		}
	}

	const workingDirectory = (typeof options._[0] === 'string') ? options._[0] : '.';

	const results = await lint(joinPathSegments([process.cwd(), workingDirectory]), (options.rules === '*') ? undefined : options.rules.split(','));
	const totals  = {
		errors:   0,
		warnings: 0,
		skipped:  0,
	};

	for (const [[targetFsPath, targetPropertiesPath], targetResults] of results) {
		const reports = targetResults.map(([rule, result]) => {
			if (result === true) {
				return '';
			}

			switch (result.type) {
				case RuleErrorType.UnknownRule:
					totals.skipped++;
					return options.skipped ? skippedRuleReport(verbosityLevel, rule, 'unknown rule') : '';

				case RuleErrorType.InvalidData:
					totals.skipped++;
					return options.skipped ? skippedRuleReport(verbosityLevel, rule, 'invalid data or rule does not apply to target') : '';

				case RuleErrorType.InvalidParameter:
					totals.skipped++;
					return options.skipped ? skippedRuleReport(verbosityLevel, rule, `invalid parameters (cf. https://devlint.org/rules/${rule.name})`) : '';

				case RuleErrorType.Failed:
					switch (rule.status) {
						case RuleStatus.Error:   totals.errors++;   break;
						case RuleStatus.Warning: totals.warnings++; break;
					}
					return ruleErrorReport(verbosityLevel, rule, result);
			}

			return undefined;
		})
		.filter(Boolean);

		if (!options.quiet && reports.length > 0) {
			const fullTargetPath = getAbsolutePath([process.cwd(), workingDirectory, targetFsPath]) + targetPropertiesPath.replace('.', PROPERTIES_PATH_STARTING_CHARACTER);
			console.log('\n' + formatHeader(fullTargetPath) + '\n' + reports.join('\n'));
		}
	}

	if (!options.quiet && Object.values(totals).some(Boolean)) {
		console.log('\n' + totalsReport(totals.errors, totals.warnings, totals.skipped) + '\n');
	}
	if (totals.errors > 0) {
		process.exitCode = 1;
	}
}
