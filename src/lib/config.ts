import { homedir } from 'os';
import merge from 'mazeru';
import { MergingStrategy } from 'mazeru';
import { JsonValue, JsonObject } from 'type-fest';

import { wrapInArray } from './helpers/utilities';
import { isJsonObject } from './helpers/json';
import { joinPathSegments, readFileContents } from './helpers/fs';

export async function loadConfig(): Promise<JsonObject> {
	let config: JsonValue;

	try {
		config = JSON.parse(await readFileContents([homedir(), '.devlintrc.json']));
	} catch (error) {
		error.message = 'Failed to parse config file: ' + error.message;
		throw error;
	}

	if (!isJsonObject(config)) {
		throw new Error('invalid config object');
	}

	return await extendConfig(config);
}

export function extendConfig(config: JsonObject): JsonObject {
	do {
		const baseConfigsPaths = [];
		for (const extendPath of [...wrapInArray(config?.extends ?? [])]) {
			if (typeof extendPath !== 'string') {
				continue;
			}

			const baseConfig = resolveExtendPath(extendPath);
			if (!isJsonObject(baseConfig)) {
				continue;
			}

			baseConfigsPaths.push(...wrapInArray(baseConfig?.extends ?? []));

			const mergeResult = merge(baseConfig, config, {
				arrays:      MergingStrategy.MergeItems,
				excludeKeys: ['extends'],
			});

			// TODO: remove when `ignoreBaseKeys` is implemented in `mazeru`
			if (config.root !== undefined) {
				mergeResult.root = config.root;
			}

			config = mergeResult;
		}

		if (baseConfigsPaths.length > 0) {
			config.extends = baseConfigsPaths;
		}
	} while (wrapInArray(config?.extends ?? []).length > 0);

	return config;
}

function resolveExtendPath(path: string): JsonValue | undefined {
	if (path.startsWith('devlint:')) {
		return require(joinPathSegments([__dirname, '..', '..', '..', 'configs', path.replace('devlint:', '') + '.json']));
	}

	return require(joinPathSegments([__dirname, path]));

	// TODO:
	//   - config module
	//   - configuration included in plugin
	//   - absolute & relative path to JSON/JS file
}
