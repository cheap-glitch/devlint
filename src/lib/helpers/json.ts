import { JsonValue, JsonObject } from 'type-fest';
import parseJsonAst, { JsonValue as JsonAst, JsonObject as JsonObjectAst } from 'jsonast';

import { PropertiesPath } from './properties';

export function tryGettingJsonAstProperty(jsonAst: JsonAst, propertiesPath: PropertiesPath): JsonAst | undefined {
	let currentPropertyAst = jsonAst;
	for (const propertyKey of propertiesPath) {
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

export function tryGettingJsonObjectProperty(jsonValue: JsonValue, propertiesPath: PropertiesPath): JsonValue | undefined {
	let currentPropertyValue = jsonValue;
	for (const propertyKey of propertiesPath) {
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
