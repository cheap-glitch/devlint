import { JsonValue } from 'type-fest';

import { PropertiesPathSegments } from '../../helpers/properties';
import { RuleError, RuleErrorType } from '../../rules';

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
	return (model.startsWith('/') && model.endsWith('/')) ? (new RegExp(model.slice(1, -1))).test(value) : model === value;
}

export function checkStringCase(testedString: string, caseStyle: string): boolean | RuleError {
	switch (caseStyle) {
		case 'sentence':
			if (testedString.slice(0, 1)[0].toLocaleUpperCase() === testedString.slice(0, 1)[0]) {
				return true;
			}
			break;

		case 'kebab':
			if (/^[\da-z-]*$/.test(testedString)) {
				return true;
			}
			break;

		case 'kebab-lax':
			if (!/[A-Z_]/.test(testedString)) {
				return true;
			}
			break;

		case 'snake':
			if (/^[\d_a-z]*$/.test(testedString)) {
				return true;
			}
			break;

		case 'camel':
			if (/^(|[a-z]+([\da-z]|[A-Z][a-z]])*)$/.test(testedString)) {
				return true;
			}
			break;

		case 'pascal':
			if (/^(|[A-Z][a-z]+([\da-z]|[A-Z][a-z]])*)$/.test(testedString)) {
				return true;
			}
			break;

		default: return new RuleError(RuleErrorType.InvalidParameter);
	}

	return false;
}
