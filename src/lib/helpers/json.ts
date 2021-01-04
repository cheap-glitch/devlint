import { JsonValue, JsonObject } from 'type-fest';
import parseJsonAst, { JsonValue as JsonAst, JsonObject as JsonObjectAst } from 'jsonast';

export type PropertiesPath = Array<string | number>;

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
		if (isJsonObjectValue(currentPropertyValue) && typeof propertyKey === 'string') {
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

export function tryParsingJsonObject(json: string): JsonObject | undefined {
	let jsonValue;
	try {
		jsonValue = JSON.parse(json);
	} catch {
		return undefined;
	}

	return isJsonObjectValue(jsonValue) ? jsonValue : undefined;
}

export function isJsonObjectAst(jsonAst: JsonAst | undefined): jsonAst is JsonObjectAst {
	return jsonAst !== undefined && ('members' in jsonAst);
}

export function isJsonObjectValue(jsonValue: JsonValue | undefined): jsonValue is JsonObject {
	return typeof jsonValue === 'object' && jsonValue !== null && !Array.isArray(jsonValue);
}

export function formatPropertiesPath(path: PropertiesPath): string {
	return path.length > 0 ? ('.' + path.map(pathSegment => typeof pathSegment === 'number' ? ('[' + pathSegment + ']') : pathSegment).join('.')) : '';
}

export function parsePropertiesPath(rawPath: string): PropertiesPath {
	return rawPath.split('.').filter(Boolean).map(pathSegment => /^\d+$/.test(pathSegment) ? Number.parseInt(pathSegment, 10) : pathSegment);
}
