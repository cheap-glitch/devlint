import { JsonValue } from 'type-fest';

import { isJsonObject } from '../../helpers/json';
import { PropertiesPathSegments } from '../../helpers/properties';
import { RuleError, RuleErrorType } from '../../rules';

export function checkStringCase(testedString: string, caseStyle: string): boolean | RuleError {
	return (() => {
		switch (caseStyle) {
			case 'kebab':
				return /^[\da-z](?:-?[\da-z]+)*$/.test(testedString);

			case 'kebab-extended':
				return /^[\d@a-z](?:[/-]?[\da-z]+)*$/.test(testedString);

			case 'snake':
				return /^[\da-z](?:_?[\da-z]+)*$/.test(testedString);

			case 'camel':
				return /^[\da-z]+(?:[A-Z][\da-z]+)*$/.test(testedString);

			case 'pascal':
				return /^(?:[A-Z][\da-z]+)+$/.test(testedString);

			case 'sentence':
				return testedString.length >= 1 && testedString.slice(0, 1)[0].toLocaleUpperCase() === testedString.slice(0, 1)[0];

			default: return new RuleError(RuleErrorType.InvalidParameter);
		}
	})() || testedString === '';
}

export function checkValueType(testedValue: JsonValue, type: string): boolean | RuleError {
	switch (type) {
		case 'null':
			return typeof testedValue === null;

		case 'boolean':
		case 'number':
		case 'string':
			return typeof testedValue === type;

		case 'object':
			return isJsonObject(testedValue);

		case 'array':
			return Array.isArray(testedValue);
	}

	return new RuleError(RuleErrorType.InvalidParameter);
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
