import { getAbsolutePath, getFilenamesInDirectory } from './helpers/fs';

import { RuleTargetType, RuleContext, RuleResult } from './rules';

export interface Plugin {
	targetType: RuleTargetType,
	validator:  (context: RuleContext) => RuleResult,
}

export async function loadBuiltinPlugins(requiredRules: Set<string>): Promise<Record<string, Plugin>> {
	const builtInPluginsDirectory = [__dirname, 'rules'];
	const requiredPlugins = await getFilenamesInDirectory(builtInPluginsDirectory, file => requiredRules.has(file.name));

	const rules: Record<string, Plugin> = {};
	for (const filename of requiredPlugins) {
		const ruleName = filename.replace('.js', '');

		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { targetType, validator } = require(getAbsolutePath([...builtInPluginsDirectory, filename]));
		if (targetType === undefined) {
			throw new Error(`Missing target type for rule "${ruleName}"`);
		}
		if (validator === undefined) {
			throw new Error(`Missing validator function for rule "${ruleName}"`);
		}

		rules[ruleName] = { targetType, validator };
	}

	return rules;
}
