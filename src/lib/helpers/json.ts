import parseJsonAst from 'jsonast';

import { isMatchingString } from './text';

import type { JsonValue, JsonObject, JsonArray } from 'type-fest';
import type { JsonValue as JsonAst, JsonObject as JsonObjectAst, JsonArray as JsonArrayAst } from 'jsonast';
import type { PropertyPathSegments } from './properties';

type TypeFunction = typeof Boolean | typeof Number | typeof String;

export function formatJsonValue(jsonValue: JsonValue): string {
	// TODO [>=0.4.0]: parse string to remove double spaces NOT INSIDE QUOTES + write tests
	const jsonString = JSON.stringify(jsonValue, undefined, 1).replaceAll(/\s+/ug, ' ');

	return (jsonString.startsWith('"') ? '' : '"') + jsonString + (jsonString.endsWith('"') ? '' : '"');
}

export function matchJsonValues(
	model: Record<string, JsonValue | TypeFunction> | JsonValue | TypeFunction | undefined,
	jsonValue: JsonValue | undefined,
	propertyPath?: PropertyPathSegments,
): boolean | PropertyPathSegments {
	if (typeof model === 'string' && typeof jsonValue === 'string') {
		return isMatchingString(model, jsonValue) || (propertyPath ?? false);
	}

	switch (model) {
		case Boolean: return typeof jsonValue === 'boolean' || (propertyPath ?? false);
		case Number: return typeof jsonValue === 'number' || (propertyPath ?? false);
		case String: return typeof jsonValue === 'string' || (propertyPath ?? false);

		default: break;
	}

	if (model === null || jsonValue === null || typeof model !== 'object' || typeof jsonValue !== 'object') {
		return model === jsonValue || (propertyPath ?? false);
	}

	if (Array.isArray(model) || Array.isArray(jsonValue)) {
		if (!Array.isArray(model) || !Array.isArray(jsonValue) || model.length !== jsonValue.length) {
			return propertyPath ?? false;
		}

		for (const [index, item] of model.entries()) {
			const result = matchJsonValues(item, jsonValue[index], propertyPath ? [...propertyPath, index] : undefined);
			if (result !== true) {
				return result;
			}
		}

		return true;
	}

	for (const keySelector of Object.keys(model)) {
		const key = keySelector.replace(/\?$/u, '');
		if (keySelector.endsWith('?') && jsonValue[key] === undefined) {
			continue;
		}

		const result = matchJsonValues(model[keySelector], jsonValue[key], propertyPath ? [...propertyPath, key] : undefined);
		if (result !== true) {
			return result;
		}
	}

	return true;
}

export function tryGettingJsonAstProperty(jsonAst: JsonAst, propertyPathSegments: PropertyPathSegments): JsonAst | undefined {
	let currentPropertyAst = jsonAst;
	for (const propertyKey of propertyPathSegments) {
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

export function tryGettingJsonObjectProperty(jsonValue: JsonValue, propertyPathSegments: PropertyPathSegments): JsonValue | undefined {
	let currentPropertyValue = jsonValue;
	for (const propertyKey of propertyPathSegments) {
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

export const jsonTypes = [
	'null',
	'boolean',
	'number',
	'string',
	'object',
	'array',
];

export function getJsonValueType(jsonValue: JsonValue): (typeof jsonTypes)[number] {
	const type = typeof jsonValue;

	switch (type) {
		case 'boolean':
		case 'number':
		case 'string':
			return type;

		default:
			if (Array.isArray(jsonValue)) {
				return 'array';
			}

			return jsonValue === null ? 'null' : 'object';
	}
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
