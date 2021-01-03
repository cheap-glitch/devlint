import chalk from 'chalk';

import { RuleStatus, RuleObject, RuleError } from './rules';

const labels: Record<RuleStatus, string> = {
	[RuleStatus.Off]:      chalk.black('off    '),
	[RuleStatus.Error]:      chalk.red('error  '),
	[RuleStatus.Warning]: chalk.yellow('warning'),
	[RuleStatus.Skipped]:   chalk.gray('skipped'),
};

export function totalsReport(errors: number, warnings: number, skipped: number): string {
	const message = (errors === 0 && warnings === 0)
		? 'Skipped ' + countWord('rule', skipped)
		: countWord('problem', errors + warnings) + ` (${countWord('error', errors)}, ${countWord('warning', warnings)}, ${skipped} skipped)`;

	return errors ? '❌ ' + chalk.red(message) : warnings ? '✖  ' + chalk.yellow(message) : 'ℹ️  ' + message;
}

export function ruleErrorReport(rule: RuleObject, error: RuleError): string {
	return report(error.start ? (error.start.line + ':' + error.start.column) : '', rule.status, error.message, rule.name);
}

export function skippedRuleReport(rule: RuleObject, reason: string): string {
	return report('', RuleStatus.Skipped, reason, rule.name);
}

export function formattedHeader(text: string): string {
	return chalk.underline(text);
}

function report(location: string, status: RuleStatus, message: string, ruleName: string): string {
	return chalk` {dim ${location.padStart(5)}}  ${labels[status]}  ${capitalize(message)}  {dim ${ruleName}}`;
}

function countWord(word: string, count: number): string {
	return count + ' ' + word + (count > 1 ? 's' : '');
}

export function capitalize(message: string): string {
	return message.slice(0, 1).toUpperCase() + message.slice(1);
}
