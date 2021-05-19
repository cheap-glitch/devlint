/**
 * To depreciate a rule, add an entry with its name as key and `true` or an
 * object as value.
 *
 * A value of `true` simply denotes a depreciation, while the object can have a
 * property to indicate the future version in which the rule will be dropped
 * (as a semver string), and the name of an eventual replacement rule
 */
export const depreciations: Map<string, true | { version?: string, replacement?: string }> = new Map([
	['match-object', { version: '1.0.0', replacement: 'values-allowed' }],
]);
