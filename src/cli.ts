import { homedir } from 'os';
import { JsonValue } from 'type-fest';
import yargs, { Options } from 'yargs';

import { isJsonObjectValue } from './helpers/json';
import { joinPathSegments, getAbsolutePath, readFileContents } from './helpers/fs';

import { lint } from './lib/linter';
import { RuleStatus, RuleErrorType, parseRules  } from './lib/rules';
import { formattedHeader, ruleErrorReport, skippedRuleReport, totalsReport } from './lib/reports';

const cliOptions: Record<string, Options> = {
	// fix:{ type: 'boolean', default: false, description: 'Automatically fix problems'                   },
	quiet: { type: 'boolean', default: false, description: 'Do not print anything to stdout',  alias: 'q' },
};

export async function cli(): Promise<void> {
	const options        = yargs(process.argv.slice(2)).options(cliOptions).argv;
	const foldersToLint  = options._.length === 0 ? ['.'] : options._;
	const configFilename = getAbsolutePath([homedir(), '.devlintrc.json']);

	let config: JsonValue;
	try {
		config = JSON.parse(await readFileContents(configFilename));
	} catch(error) {
		error.message = 'Failed to parse config file: ' + error.message;
		throw error;
	}
	if (!isJsonObjectValue(config)) {
		throw new Error('Invalid config object');
	}

	const rules = parseRules(config?.rules ?? {});
	if (rules.size === 0) {
		return;
	}
	console.info(rules);

	for (const folder of foldersToLint) {
		if (typeof folder !== 'string') {
			continue;
		}

		const results = await lint(joinPathSegments([process.cwd(), folder]), rules);
		const totals  = {
			errors:   0,
			warnings: 0,
			skipped:  0,
		};

		for (const [[targetFilePath, targetPropertiesPathSegments], targetResults] of results) {
			const reports = targetResults.map(([rule, result]) => {
				if (result === true) {
					return '';
				}

				switch (result.type) {
					case RuleErrorType.UnknownRule:
						totals.skipped++;
						return skippedRuleReport(rule, 'unknown rule');

					case RuleErrorType.MissingData:
						totals.skipped++;
						return skippedRuleReport(rule, 'invalid data or rule does not apply to file type');

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
				const fullTargetPath = [
					getAbsolutePath([process.cwd(), folder, targetFilePath]),
					targetPropertiesPathSegments.length > 0 ? '#' : '', ...targetPropertiesPathSegments,
				].join('');

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
}
