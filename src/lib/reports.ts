import chalk from 'chalk';

import { formatSnippet } from './helpers/snippets';
import { capitalize, pluralize, countWord } from './helpers/text';
import { PROPERTY_PATH_STARTING_CHARACTER } from './helpers/properties';

import { LintResult } from './linter';
import { depreciations } from './depreciations';
import { RuleStatus, RuleError } from './rules';

const labels: Record<RuleStatus, string> = {
	[RuleStatus.Off]:      chalk.black('disabled'),
	[RuleStatus.Error]:      chalk.red('error   '),
	[RuleStatus.Warning]: chalk.yellow('warning '),
};

export function getDisabledRuleReport(result: LintResult, message: string): string {
	return getReport(result, labels[RuleStatus.Off], message);
}

export function getSkippedRuleReport(result: LintResult, message: string): string {
	return getReport(result, chalk.gray('skipped '), message);
}

export function getErrorReport(result: LintResult, error: RuleError, verbosityLevel: number): string {
	const location = error.start ? (error.start.line + ':' + error.start.column) : '';
	const snippet  = verbosityLevel >= 1 && error.snippet && error.start && error.end ? formatSnippet(error.snippet, error.start, error.end, result.status) : '';

	return getReport(result, labels[result.rule.status], error.message, location, snippet);
}

export function getSuccessReport(result: LintResult): string {
	return getReport(result, chalk.green('success'), 'rule passed');
}

function getReport(result: LintResult, label: string, message: string, location = '', snippet = ''): string {
	return '  ' + chalk.dim.white(location.padEnd(5, ' ')) + '  ' + label + '  ' + capitalize(message) + '  ' + chalk.dim.white(result.rule.name) + (snippet.length > 0 ? ('\n\n' + snippet) : '');
}

export function getTotalsReport(errors: number, warnings: number, skipped: number): string {
	const message = (errors === 0 && warnings === 0)
		? 'Skipped ' + countWord(skipped, 'rule')
		: countWord(errors + warnings, 'problem') + ' (' + [countWord(errors, 'error'), countWord(warnings, 'warning'), skipped + ' skipped'].join(', ') + ')';

	return chalk.bold(errors ? '❌ ' + chalk.red(message) : warnings ? '✖  ' + chalk.yellow(message) : 'ℹ️  ' + message);
}

export function getConditionsStatusReport(name: string, status: boolean): string {
	return '  ' + (status ? (chalk.green.bold('✓') + ' ' + chalk.green(name)) : (chalk.red.bold('✗') + ' ' + chalk.red(name)));
}

export function getDepreciatedRulesReport(depreciatedRules: Array<string>): string {
	return chalk.yellow(chalk.bold(pluralize('⚠️  depreciation warning', depreciatedRules.length).toUpperCase()) + '\n' + depreciatedRules.map(ruleName => {
		let message = '    • ' + ruleName + ' is depreciated';

		const infos = depreciations.get(ruleName);
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

export function getRuleDocumentationUrl(ruleName: string): string {
	return 'https://devlint.org/rules/' + ruleName;
}

export function getTargetHeader(fsPath: string, propertyPath?: string): string {
	return '\n' + chalk.underline(fsPath + (propertyPath ? propertyPath.replace('.', chalk.bold(PROPERTY_PATH_STARTING_CHARACTER)) : '')) + '\n';
}
