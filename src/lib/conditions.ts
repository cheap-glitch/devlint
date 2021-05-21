import { JsonValue } from 'type-fest';

import { wrapInArray } from './helpers/utilities';
import { isJsonObject } from './helpers/json';

import { LintStatus, lintDirectory } from './linter';

// TODO: merge with main linter function
export async function testConditions(workingDirectory: string, conditionsObject: JsonValue): Promise<Map<string, boolean>> {
	const conditionsResults: Map<string, boolean> = new Map();

	if (!isJsonObject(conditionsObject)) {
		return conditionsResults;
	}

	for (const [conditionName, conditionRules] of Object.entries(conditionsObject)) {
		if (conditionRules === undefined) {
			continue;
		}

		// The condition is fulfilled if at least one of the rules array is entirely valid
		conditionsResults.set(conditionName, false);
		for (const rules of wrapInArray(conditionRules)) {
			const results = await lintDirectory(workingDirectory, rules);

			// All of the rules must pass for a rule array to pass
			if (results.every(({ status }) => status === LintStatus.Success)) {
				conditionsResults.set(conditionName, true);
				break;
			}
		}
	}

	return conditionsResults;
}
