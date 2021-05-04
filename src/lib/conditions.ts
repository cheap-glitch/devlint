import { JsonValue } from 'type-fest';

import { wrapInArray } from './helpers/utilities';
import { isJsonObject } from './helpers/json';

import { parseRules } from './rules';
import { LintStatus, lintDirectory } from './linter';

// TODO: merge with main linter function
export async function testConditions(workingDirectory: string, conditionsObject: JsonValue): Promise<Record<string, boolean>> {
	if (!isJsonObject(conditionsObject)) {
		return {};
	}

	const conditionsResults: Record<string, boolean> = {};
	for (const [conditionName, conditionRules] of Object.entries(conditionsObject)) {
		if (conditionRules === undefined) {
			continue;
		}

		const conditionRuleArrays = wrapInArray(conditionRules).map(rulesObject => parseRules(rulesObject));

		// The condition is fulfilled if at least one of the rules array is entirely valid
		conditionsResults[conditionName] = true;
		checkEachRuleArray: for (const ruleArray of conditionRuleArrays) {
			const results = await lintDirectory(workingDirectory, ruleArray, {});

			// All of the rules must pass for a rule array to pass
			for (const fileResults of results.values()) {
				for (const propertyResults of fileResults.values()) {
					for (const result of propertyResults) {
						if (result.status === LintStatus.Error) {
							conditionsResults[conditionName] = false;
							continue checkEachRuleArray;
						}
					}
				}
			}
		}
	}

	return conditionsResults;
}
