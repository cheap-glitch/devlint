export function validateConditionalExpression(conditionsMap: Map<string, boolean>, expression: string): boolean {
	if (expression.includes('&&') && expression.includes('||')) {
		throw new Error("Conditional expressions can't combine both && and || operators. Use JavaScript instead.");
	}

	if (expression.includes('&&')) {
		return !getConditionsStatus(conditionsMap, splitConditionalExpression(expression, '&&')).includes(false);
	}

	return getConditionsStatus(conditionsMap, splitConditionalExpression(expression, '||')).includes(true);
}

function getConditionsStatus(conditionsMap: Map<string, boolean>, conditions: string[]): boolean[] {
	return conditions.map(condition => {
		const name = condition.replace('!', '');
		const status = conditionsMap.get(name);
		if (status === undefined) {
			// TODO [>0.5.0]: return a failure result instead of throwing?
			throw new Error(`unknown condition "${name}"`);
		}

		return condition.startsWith('!') ? !status : status;
	});
}

function splitConditionalExpression(expression: string, splitter: string): string[] {
	return expression.split(' ' + splitter + ' ');
}
