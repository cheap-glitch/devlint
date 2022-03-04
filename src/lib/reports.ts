import * as c from 'colorette';

import { formatSnippet } from './helpers/snippets';
import { capitalize, pluralize, countWord } from './helpers/text';
import { PROPERTY_PATH_STARTING_CHARACTER } from './helpers/properties';
import { depreciations } from './depreciations';
import { RuleStatus } from './rules';

import type { FsPath } from './helpers/fs';
import type { RuleError } from './rules';
import type { LintResult } from './linter';
import type { PropertyPath } from './helpers/properties';

const labels: Record<RuleStatus, string> = {
	[RuleStatus.Off]: c.black('disabled'),
	[RuleStatus.Warning]: c.yellow('warning') + ' ',
	[RuleStatus.Error]: c.red('error') + '   ',
};

export function getDisabledRuleReport(result: LintResult, message: string): string {
	return getReport(result, labels[RuleStatus.Off], message);
}

export function getSkippedRuleReport(result: LintResult, message: string): string {
	return getReport(result, c.gray('skipped') + ' ', message);
}

export function getErrorReport(result: LintResult, error: RuleError, verbosityLevel: number): string {
	const location = error.start ? error.start.line + ':' + error.start.column : '';
	const snippet = verbosityLevel >= 1 && error.snippet && error.start && error.end ? formatSnippet(error.snippet, error.start, error.end, result.rule.status) : '';

	return getReport(result, labels[result.rule.status], error.message, location, snippet);
}

export function getSuccessReport(result: LintResult): string {
	return getReport(result, c.green('success') + ' ', 'rule passed');
}

function getReport(result: LintResult, label: string, message: string, location = '', snippet = ''): string {
	return '  ' + c.dim(location.padEnd(5, ' ')) + '  ' + label + '  ' + capitalize(message) + '  ' + c.dim(result.rule.name) + (snippet.length > 0 ? '\n' + snippet : '');
}

export function getTotalsReport(errors: number, warnings: number, skipped: number): string {
	const message = errors === 0 && warnings === 0
		? 'Skipped ' + countWord(skipped, 'rule')
		: countWord(errors + warnings, 'problem') + ' (' + [countWord(errors, 'error'), countWord(warnings, 'warning'), skipped + ' skipped'].join(', ') + ')';

	if (errors > 0) {
		return c.bold('❌ ' + c.red(message));
	}

	if (warnings > 0) {
		return c.bold('✖  ' + c.yellow(message));
	}

	return c.bold('ℹ️  ' + message);
}

export function getConditionsStatusReport(name: string, status: boolean): string {
	return '  ' + (status ? c.bold(c.green('✓')) + ' ' + c.green(name) : c.bold(c.red('✗')) + ' ' + c.red(name));
}

export function getDepreciatedRulesReport(depreciatedRules: string[]): string {
	return c.yellow(c.bold(pluralize('⚠️  depreciation warning', depreciatedRules.length).toUpperCase()))
		+ '\n'
		+ depreciatedRules.map(ruleName => {
			const message = ['    •', ruleName, 'is depreciated'];

			const infos = depreciations.get(ruleName);
			if (infos === undefined) {
				return message.join(' ');
			}
			if (infos === true) {
				return [...message, 'and will be removed in a future release'].join(' ');
			}

			message.push('and will be removed in', infos.version === undefined ? 'a future release' : 'v' + infos.version);
			if (infos.replacement !== undefined) {
				message.push(`You should start using "${infos.replacement}" instead (see ${getRuleDocumentationUrl(infos.replacement)})`);
			}

			return c.yellow(c.bold(message.join(' ')));
		}).join('\n');
}

export function getRuleDocumentationUrl(ruleName: string): string {
	return 'https://devlint.org/rules/' + ruleName;
}

export function getTargetHeader(fsPath: FsPath, propertyPath: PropertyPath): string {
	return '\n' + c.underline(fsPath + (propertyPath ? c.bold(PROPERTY_PATH_STARTING_CHARACTER) + propertyPath : ''));
}
