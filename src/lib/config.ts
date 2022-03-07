import { homedir } from 'os';
import stripJsonComments from 'strip-json-comments';
import merge, { MergingStrategy } from 'mazeru';

import { wrapInArray } from './helpers/utilities';
import { isJsonObject } from './helpers/json';
import { joinPathSegments, readFileContents } from './helpers/fs';

import type { JsonValue, JsonObject } from 'type-fest';

export async function loadConfig(): Promise<JsonObject> {
	let config: JsonValue;

	try {
		config = JSON.parse(stripJsonComments(await readFileContents([homedir(), '.devlintrc.json'])));
	} catch (error) {
		error.message = 'Failed to parse config file: ' + error.message;
		throw error;
	}

	if (!isJsonObject(config)) {
		// TODO [>0.3.0]: Make this and similar errors ConfigError (create an "errors.ts" module)
		throw new Error('The configuration must be a JSON object');
	}

	return extendConfig(config);
}

export function extendConfig(config: JsonObject): JsonObject {
	do {
		const baseConfigsPaths = [];
		for (const extendPath of wrapInArray(config?.extends ?? [])) {
			if (typeof extendPath !== 'string') {
				continue;
			}

			const baseConfig = resolveExtendPath(extendPath);
			if (!isJsonObject(baseConfig)) {
				continue;
			}

			baseConfigsPaths.push(...wrapInArray(baseConfig?.extends ?? []));

			const mergeResult = merge(baseConfig, config, {
				arrays: MergingStrategy.MergeItems,
				excludeKeys: ['extends'],
			});

			// TODO [mazeru@>=2.1.0]: remove when `ignoreBaseKeys` is implemented in `mazeru`
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
		return require(joinPathSegments([__dirname, '../../../src/configs', path.replace('devlint:', '') + '.json']));
	}

	return require(joinPathSegments([__dirname, path]));

	/*
	 * TODO:
	 *   - config module
	 *   - configuration included in plugin
	 *   - absolute & relative path to JSON/JS file
	 */
}
