import { JsonValue } from 'type-fest';

import { isJsonObject } from '../../helpers/json';
import { PropertiesPathSegments } from '../../helpers/properties';
import { RuleError, RuleErrorType } from '../../rules';

export function checkStringCase(testedString: string, caseStyle: string): boolean | RuleError {
	switch (caseStyle) {
		case 'sentence':
			if (testedString === '' || testedString.slice(0, 1)[0].toLocaleUpperCase() === testedString.slice(0, 1)[0]) {
				return true;
			}
			break;

		case 'kebab':
			if (/^[\da-z](?:-?[\da-z]+)*$/.test(testedString)) {
				return true;
			}
			break;

		case 'kebab-extended':
			if (/^[\d@a-z](?:[/-]?[\da-z]+)*$/.test(testedString)) {
				return true;
			}
			break;

		case 'snake':
			if (/^[\da-z](?:_?[\da-z]+)*$/.test(testedString)) {
				return true;
			}
			break;

		case 'camel':
			if (/^[\da-z]+(?:[A-Z][\da-z]+)*$/.test(testedString)) {
				return true;
			}
			break;

		case 'pascal':
			if (/^(?:[A-Z][\da-z]+)+$/.test(testedString)) {
				return true;
			}
			break;

		default: return new RuleError(RuleErrorType.InvalidParameter);
	}

	if (testedString === '') {
		return true;
	}

	return false;
}

export function checkValueType(testedValue: JsonValue, type: string): boolean | RuleError {
	switch (type) {
		case 'null':
			if (typeof testedValue === null) {
				return true;
			}
			break;

		case 'boolean':
		case 'number':
		case 'string':
			if (typeof testedValue === type) {
				return true;
			}
			break;

		case 'object':
			if (isJsonObject(testedValue)) {
				return true;
			}
			break;

		case 'array':
			if (Array.isArray(testedValue)) {
				return true;
			}
			break;

		default: return new RuleError(RuleErrorType.InvalidParameter);
	}

	return false;
}

export function matchJsonValues(model: JsonValue | undefined, value: JsonValue | undefined, propertiesPath: PropertiesPathSegments = []): true | PropertiesPathSegments {
	if (typeof model === 'string' && typeof value === 'string') {
		return matchStrings(model, value) || propertiesPath;
	}

	if (model === null || value === null || typeof model !== 'object' || typeof value !== 'object') {
		return (model === value) || propertiesPath;
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

export function matchJsonPrimitives(model: JsonValue, value: JsonValue): boolean {
	return (typeof model === 'string' && typeof value === 'string') ? matchStrings(model, value) : model === value;
}

export function matchStrings(model: string, value: string): boolean {
	return isRegex(model) ? new RegExp(model.slice(1, -1)).test(value) : model === value;
}

export function isRegex(model: string): boolean {
	return model.startsWith('/') && model.endsWith('/');
}
