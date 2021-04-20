import { JsonValue, JsonObject, JsonArray } from 'type-fest';
import parseJsonAst, { JsonValue as JsonAst, JsonObject as JsonObjectAst, JsonArray as JsonArrayAst } from 'jsonast';

import { matchStrings } from './text';
import { PropertiesPathSegments } from './properties';

import { RuleError, RuleErrorType } from '../errors';

export function matchJsonValues(model: JsonValue | undefined, value: JsonValue | undefined, propertiesPath?: PropertiesPathSegments): boolean | PropertiesPathSegments {
	if (typeof model === 'string' && typeof value === 'string') {
		return matchStrings(model, value) || (propertiesPath ?? false);
	}

	if (model === null || value === null || typeof model !== 'object' || typeof value !== 'object') {
		return (model === value) || (propertiesPath ?? false);
	}

	if (Array.isArray(model) || Array.isArray(value)) {
		if (!Array.isArray(model) || !Array.isArray(value) || model.length !== value.length) {
			return propertiesPath ?? false;
		}

		for (const [index, item] of model.entries()) {
			const result = matchJsonValues(item, value[index], propertiesPath ? [...propertiesPath, index] : undefined);
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

		const result = matchJsonValues(model[keySelector], value[key], propertiesPath ? [...propertiesPath, key] : undefined);
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

export function tryParsingJsonAst(json: string): JsonAst | SyntaxError {
	let jsonAst;
	try {
		jsonAst = parseJsonAst(json);
	} catch (error) {
		// TODO [>=0.5.0]: extract line & column numbers (https://github.com/KnisterPeter/jsonast/blob/61bcf18f39ed1709822f44ab00e09e8a4d832d08/src/character-stream.ts#L51)
		return new SyntaxError(error.message);
	}

	return jsonAst;
}

export function tryParsingJsonValue(json: string): JsonValue | SyntaxError {
	let jsonValue;
	try {
		jsonValue = JSON.parse(json);
	} catch (error) {
		return error;
	}

	return jsonValue;
}

export function isJsonObjectAst(jsonAst: JsonAst | undefined): jsonAst is JsonObjectAst {
	return jsonAst !== undefined && jsonAst.type === 'object';
}

export function isJsonArrayAst(jsonAst: JsonAst | undefined): jsonAst is JsonArrayAst {
	return jsonAst !== undefined && jsonAst.type === 'array';
}

export function isJsonObject(jsonValue: JsonValue | undefined): jsonValue is JsonObject {
	return typeof jsonValue === 'object' && jsonValue !== null && !Array.isArray(jsonValue);
}

export function isJsonArray(jsonValue: JsonValue | undefined): jsonValue is JsonArray {
	return Array.isArray(jsonValue);
}
