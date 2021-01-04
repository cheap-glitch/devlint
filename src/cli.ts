import { homedir } from 'os';
import { JsonValue } from 'type-fest';
import yargs from 'yargs';

import { isJsonObjectValue } from './lib/helpers/json';
import { joinPathSegments, getAbsolutePath, readFileContents } from './lib/helpers/fs';

import { lint } from './lib/linter';
import { RuleStatus, RuleErrorType, parseRules  } from './lib/rules';
import { formattedHeader, ruleErrorReport, skippedRuleReport, totalsReport } from './lib/reports';

export async function cli(): Promise<void> {
	const options = yargs(process.argv.slice(2)).options({
		fix:   { type: 'boolean', default: false, description: 'Automatically fix problems'                   },
		quiet: { type: 'boolean', default: false, description: 'Do not print anything to stdout',  alias: 'q' },
		rules: { type: 'string',  default: '*',   description: 'Set specific rules to consider'               },
	}).argv;

	let config: JsonValue;
	try {
		config = JSON.parse(await readFileContents([homedir(), '.devlintrc.json']));
	} catch(error) {
		error.message = 'Failed to parse config file: ' + error.message;
		throw error;
	}
	if (!isJsonObjectValue(config)) {
		throw new Error('Invalid config object');
	}

	const rules = parseRules(config?.rules ?? {}, options.rules === '*' ? undefined : options.rules.split(','));
	if (rules.size === 0) {
		return;
	}
	console.info(rules);

	for (const folder of (options._.length === 0 ? ['.'] : options._)) {
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
				const fullTargetPath = getAbsolutePath([process.cwd(), folder, targetFilePath])
					+ (targetPropertiesPathSegments.length > 0 ? '#' : '')
					+ targetPropertiesPathSegments;

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
