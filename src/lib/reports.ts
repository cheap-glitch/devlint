import chalk from 'chalk';

import { capitalize, countWord } from './helpers/text';
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

export function skippedRuleReport(verbosityLevel: number, rule: RuleObject, reason: string): string {
	rule.status = RuleStatus.Skipped;

	return report(verbosityLevel, rule, new RuleError(reason));
}

export function ruleErrorReport(verbosityLevel: number, rule: RuleObject, error: RuleError): string {
	return report(verbosityLevel, rule, error);
}

function report(verbosityLevel: number, rule: RuleObject, error: RuleError): string {
	const location    = error.start ? (error.start.line + ':' + error.start.column) : '';
	const basicReport = chalk` {dim ${location.padStart(5)}}  ${labels[rule.status]}  ${capitalize(error.message)}  {dim ${rule.name}}`;

	switch (verbosityLevel) {
		case 0:  return basicReport;
		default: return basicReport + (error.snippet ? '\n\n' + formattedSnippet(error.snippet, error.start ? Math.max(0, error.start.line - 1) : 0) : '');
	}
}

function formattedSnippet(snippet: Array<string>, firstLineNumber: number): string {
	const lineNumbersColumnWidth = Math.max(2, (firstLineNumber + snippet.length).toString().length);

	return snippet.map((line, index) => chalk`{black.inverse ${(firstLineNumber + index).toString().padStart(lineNumbersColumnWidth, ' ')}}${line}`).join('\n');
}

export function formattedHeader(text: string): string {
	return chalk.underline(text);
}
