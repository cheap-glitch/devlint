import chalk from 'chalk';

import { formatSnippet } from './helpers/snippets';
import { capitalize, pluralize, countWord } from './helpers/text';
import { PROPERTIES_PATH_STARTING_CHARACTER } from './helpers/properties';

import { depreciations } from './depreciations';
import { RuleStatus, RuleObject, RuleError } from './rules';

const labels: Record<RuleStatus, string> = {
	[RuleStatus.Off]:      chalk.black('disabled'),
	[RuleStatus.Error]:      chalk.red('error   '),
	[RuleStatus.Warning]: chalk.yellow('warning '),
	[RuleStatus.Skipped]:   chalk.gray('skipped '),
};

export function depreciatedRulesReport(depreciatedRules: Array<string>): string {
	return chalk.yellow(chalk.bold(pluralize('depreciation warning', depreciatedRules.length).toUpperCase()) + '\n' + depreciatedRules.map(ruleName => {
		let message = `  • "${ruleName}" is depreciated`;

		const infos = depreciations[ruleName];
		if (infos === undefined) {
			return message;
		}
		if (infos === true) {
			return message + ' and will be removed in a future release';
		}

		message += ' and will be removed in ' + (infos.version !== undefined ? 'v' + infos.version : 'a future release');
		if (infos.replacement !== undefined) {
			message += `, you should start using "${infos.replacement}" instead (see ${getRuleDocumentationUrl(infos.replacement)})`;
		}

		return message;
	}).join('\n'));
}

export function totalsReport(errors: number, warnings: number, skipped: number): string {
	const message = (errors === 0 && warnings === 0)
		? 'Skipped ' + countWord('rule', skipped)
		: countWord('problem', errors + warnings) + ` (${countWord('error', errors)}, ${countWord('warning', warnings)}, ${skipped} skipped)`;

	return chalk.bold(errors ? '❌ ' + chalk.red(message) : warnings ? '✖  ' + chalk.yellow(message) : 'ℹ️  ' + message);
}

export function ruleErrorReport(verbosityLevel: number, rule: RuleObject, error: RuleError): string {
	return report(verbosityLevel, rule, error);
}

export function skippedRuleReport(verbosityLevel: number, rule: RuleObject, reason: string): string {
	rule.status = RuleStatus.Skipped;

	return report(verbosityLevel, rule, new RuleError(reason));
}

export function disabledRuleReport(verbosityLevel: number, rule: RuleObject, reason: string): string {
	rule.status = RuleStatus.Off;

	return report(verbosityLevel, rule, new RuleError(reason));
}

function report(verbosityLevel: number, rule: RuleObject, error: RuleError): string {
	const location     = chalk.dim((error.start ? (error.start.line + ':' + error.start.column) : '').padEnd(5, ' '));
	const informations = chalk`${labels[rule.status]}  ${capitalize(error.message)}  {dim ${rule.name}}`;

	if (verbosityLevel >= 1) {
		return `  ${informations}\n\n` + (error.snippet && error.start && error.end
			? formatSnippet(error.snippet, error.start, error.end, rule.status)
			: chalk.magenta(`    at ${rule.target[0]}${error.start ? ':' + location : ''}`)
		);
	}

	return `  ${location}  ${informations}`;
}

export function conditionStatusReport(name: string, status: boolean): string {
	return status ? chalk`  {blue {bold ✓} ${name}}` : chalk`  {yellow {bold ✗} ${name}}`;
}

export function formatTargetPath(fsPath: string, propertiesPath?: string): string {
	return chalk.underline(fsPath + (propertiesPath ? propertiesPath.replace('.', chalk.bold(PROPERTIES_PATH_STARTING_CHARACTER)) : ''));
}

export function getRuleDocumentationUrl(ruleName: string): string {
	return `https://devlint.org/rules/${ruleName}`;
}
