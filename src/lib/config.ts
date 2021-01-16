import { homedir } from 'os';
import { JsonValue, JsonObject } from 'type-fest';

import { readFileContents } from './helpers/fs';
import { isJsonValueObject } from './helpers/json';

export async function loadConfig(): Promise<JsonObject> {
	let config: JsonValue;

	try {
		config = JSON.parse(await readFileContents([homedir(), '.devlintrc.json']));
	} catch (error) {
		error.message = 'Failed to parse config file: ' + error.message;
		throw error;
	}

	if (!isJsonValueObject(config)) {
		throw new Error('Invalid config object');
	}

	return config;
}
