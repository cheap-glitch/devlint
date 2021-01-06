import { JsonValue } from 'type-fest';

import { PropertiesPath, formatPropertiesPath } from '../helpers/properties';
import { isJsonObjectValue, isJsonObjectAst, tryGettingJsonAstProperty } from '../helpers/json';

import { RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export default function({ jsonObject, jsonAst, parameter: model }: RuleContext): RuleResult {
	if (!isJsonObjectAst(jsonAst) || jsonAst.members === undefined) {
		return new RuleError(RuleErrorType.InvalidData);
	}
	if (!isJsonObjectValue(model)) {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	const result = matchJsonValues(model, jsonObject);
	if (Array.isArray(result)) {
		const jsonKeyAst = tryGettingJsonAstProperty(jsonAst, result);

		return new RuleError('failed to match property `' + formatPropertiesPath(result) + '`', jsonKeyAst ? { ...jsonKeyAst.pos.start } : undefined);
	}

	return true;
}

function matchJsonValues(model: JsonValue | undefined, value: JsonValue | undefined, propertiesPath: PropertiesPath = []): true | PropertiesPath {
	if (typeof model === 'string' && typeof value === 'string' && model.startsWith('/') && model.endsWith('/')) {
		return (new RegExp(model.slice(1, -1))).test(value) || propertiesPath;
	}

	if (model === null || value === null || typeof model !== 'object' || typeof value !== 'object') {
		return (model === value) ? true : propertiesPath;
	}

	if (Array.isArray(model) || Array.isArray(value)) {
		if (!Array.isArray(model) || !Array.isArray(value) || model.length !== value.length) {
			return propertiesPath;
		}

		for (const [index, item] of model.entries()) {
			const result = matchJsonValues(item, value[index], [...propertiesPath, index]);
			if (result !== true) {
				return result;
			}
		}

		return true;
	}

	for (const keySelector of Object.keys(model)) {
		const key = keySelector.replace(/\?$/, '');
		if (keySelector.endsWith('?') && value[key] === undefined) {
			continue;
		}

		const result = matchJsonValues(model[keySelector], value[key], [...propertiesPath, key]);
		if (result !== true) {
			return result;
		}
	}

	return true;
}
