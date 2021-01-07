import chalk from 'chalk';

import { formatSnippet } from './helpers/snippets';
import { joinPathSegments } from './helpers/fs';
import { capitalize, countWord } from './helpers/text';
import { PROPERTIES_PATH_STARTING_CHARACTER } from './helpers/properties';

import { RuleStatus, RuleObject, RuleError } from './rules';

const labels: Record<RuleStatus, string> = {
	[RuleStatus.Off]:      chalk.black('off    '),
	[RuleStatus.Error]:      chalk.red('error  '),
	[RuleStatus.Warning]: chalk.yellow('warning'),
	[RuleStatus.Skipped]:   chalk.gray('skipped'),
};

export function formatTargetPath(fsPath: string, propertiesPath?: string): string {
	return chalk.underline(fsPath + (propertiesPath ? propertiesPath.replace('.', chalk.bold(PROPERTIES_PATH_STARTING_CHARACTER)) : ''));
}

export function totalsReport(errors: number, warnings: number, skipped: number): string {
	const message = (errors === 0 && warnings === 0)
		? 'Skipped ' + countWord('rule', skipped)
		: countWord('problem', errors + warnings) + ` (${countWord('error', errors)}, ${countWord('warning', warnings)}, ${skipped} skipped)`;

	return errors ? '❌ ' + chalk.red(message) : warnings ? '✖  ' + chalk.yellow(message) : 'ℹ️  ' + message;
}

export function skippedRuleReport(verbosityLevel: number, rule: RuleObject, reason: string): string {
	rule.status = RuleStatus.Skipped;

	return report(verbosityLevel, rule, new RuleError(reason));
}

export function ruleErrorReport(verbosityLevel: number, rule: RuleObject, error: RuleError): string {
	return report(verbosityLevel, rule, error);
}

function report(verbosityLevel: number, rule: RuleObject, error: RuleError): string {
	const location     = chalk.dim((error.start ? (error.start.line + ':' + error.start.column) : '').padStart(6, ' '));
	const informations = chalk`${labels[rule.status]}  ${capitalize(error.message)}  {dim ${rule.name}}`;

	if (verbosityLevel >= 1) {
		return `  ${informations}\n\n` + (error.snippet && error.start && error.end
			? formatSnippet(error.snippet, error.start, error.end, rule.status)
			: ` at ${joinPathSegments(rule.target[0])}${error.start ? ':' + location : ''}`
		);
	}

	return `  ${location}  ${informations}`;
}
