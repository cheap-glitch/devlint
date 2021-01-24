import { JsonValue } from 'type-fest';

import { wrapInArray } from './helpers/utilities';
import { isJsonObject } from './helpers/json';

import { parseRules } from './rules';
import { lintDirectory } from './linter';

export async function testConditions(workingDirectory: string, conditionsObject: JsonValue): Promise<Record<string, boolean>> {
	if (!isJsonObject(conditionsObject)) {
		return {};
	}

	const conditionsResults: Record<string, boolean> = {};
	for (const [conditionName, conditionRules] of Object.entries(conditionsObject)) {
		if (!isJsonObject(conditionRules)) {
			continue;
		}

		// Parse the conditions object
		const condition = wrapInArray(conditionRules).map(rulesObject => parseRules(rulesObject));

		// Test the condition
		conditionsResults[conditionName] = false;
		for (const rulesArray of condition) {
			const results = await lintDirectory(workingDirectory, rulesArray, {});
			if (results.every(result => result === true)) {
				conditionsResults[conditionName] = true;
				break;
			}
		}
	}

	return conditionsResults;
}
