import { JsonValue, JsonObject } from 'type-fest';
import parseJsonAst, { JsonValue as JsonAst, JsonObject as JsonObjectAst } from 'jsonast';

export function tryGettingJsonAstProperty(jsonAst: JsonAst, propertiesPath: Array<string>): JsonAst | undefined {
	let currentPropertyAst = jsonAst;
	for (const property of propertiesPath) {
		if (!isJsonObjectAst(currentPropertyAst) || currentPropertyAst.members === undefined) {
			return undefined;
		}

		const subPropertyAst = currentPropertyAst.members.find(({ key }) => key.value === property)?.value ?? undefined;
		if (subPropertyAst === undefined) {
			return undefined;
		}
		currentPropertyAst = subPropertyAst;
	}

	return currentPropertyAst;
}

export function tryGettingJsonObjectProperty(jsonValue: JsonValue, propertiesPath: Array<string>): JsonValue | undefined {
	let currentPropertyValue = jsonValue;
	for (const property of propertiesPath) {
		if (!isJsonObjectValue(currentPropertyValue)) {
			return undefined;
		}

		const subPropertyValue = currentPropertyValue[property];
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
