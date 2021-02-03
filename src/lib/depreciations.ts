/**
 * To depreciate a rule, add an entry with its name as key and `true` or an
 * object as value.
 *
 * A value of `true` simply denotes a depreciation, while the object can have a
 * property to indicate the future version in which the rule will be dropped
 * (as a semver string), and the name of an eventual replacement rule
 */
export const depreciations: Record<string, true | { version?: string, replacement?: string }> = {
	// 'match-object': true,
};
