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
		if (!isJsonObject(conditionRules)) {
			continue;
		}

		// Parse the condition object
		const condition = wrapInArray(conditionRules).map(rulesObject => parseRules(rulesObject));

		// Execute the condition rules and check if the condition is fulfilled
		conditionsResults[conditionName] = false;
		for (const rulesArray of condition) {
			const results = await lintDirectory(workingDirectory, rulesArray, {});
			if ([...results.values()].every(targetPathReports => [...targetPathReports.values()].every(results => [...results].every(result => result.status === LintStatus.Success)))) {
				conditionsResults[conditionName] = true;
				break;
			}
		}
	}

	return conditionsResults;
}
