import { JsonValue, JsonObject } from 'type-fest';
import parseJsonAst, { JsonValue as JsonAst, JsonObject as JsonObjectAst } from 'jsonast';

import { matchStrings } from './text';
import { PropertiesPathSegments } from './properties';

import { RuleError, RuleErrorType } from '../errors';

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

export function tryGettingJsonAstProperty(jsonAst: JsonAst, propertiesPathSegments: PropertiesPathSegments): JsonAst | undefined {
	let currentPropertyAst = jsonAst;
	for (const propertyKey of propertiesPathSegments) {
		let subPropertyAst: JsonAst | undefined;

		if (currentPropertyAst.type === 'array' && currentPropertyAst.elements !== undefined && typeof propertyKey === 'number') {
			subPropertyAst = currentPropertyAst.elements[propertyKey];
		}
		if (isJsonObjectAst(currentPropertyAst) && currentPropertyAst.members !== undefined && typeof propertyKey === 'string') {
			subPropertyAst = currentPropertyAst.members.find(({ key }) => key.value === propertyKey)?.value;
		}

		if (subPropertyAst === undefined) {
			return undefined;
		}
		currentPropertyAst = subPropertyAst;
	}

	return currentPropertyAst;
}

export function tryGettingJsonObjectProperty(jsonValue: JsonValue, propertiesPathSegments: PropertiesPathSegments): JsonValue | undefined {
	let currentPropertyValue = jsonValue;
	for (const propertyKey of propertiesPathSegments) {
		let subPropertyValue: JsonValue | undefined;

		if (Array.isArray(currentPropertyValue) && typeof propertyKey === 'number') {
			subPropertyValue = currentPropertyValue[propertyKey];
		}
		if (isJsonObject(currentPropertyValue) && typeof propertyKey === 'string') {
			subPropertyValue = currentPropertyValue[propertyKey];
		}

		if (subPropertyValue === undefined) {
			return undefined;
		}
		currentPropertyValue = subPropertyValue;
	}

	return currentPropertyValue;
}

export function tryParsingJsonAst(json: string): JsonAst | undefined {
	let jsonAst;
	try {
		jsonAst = parseJsonAst(json);
	} catch {
		return undefined;
	}

	return jsonAst;
}

export function tryParsingJsonValue(json: string): JsonValue | undefined {
	let jsonValue;
	try {
		jsonValue = JSON.parse(json);
	} catch {
		return undefined;
	}

	return jsonValue;
}

export function isJsonObjectAst(jsonAst: JsonAst | undefined): jsonAst is JsonObjectAst {
	return jsonAst !== undefined && jsonAst.type === 'object';
}

export function isJsonObject(jsonValue: JsonValue | undefined): jsonValue is JsonObject {
	return typeof jsonValue === 'object' && jsonValue !== null && !Array.isArray(jsonValue);
}
