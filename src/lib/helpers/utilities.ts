export type NestedSetMap<FirstKeyType, SecondKeyType, ValueType> = Map<FirstKeyType, Map<SecondKeyType, Set<ValueType>>>;

export function insertInNestedSetMap<FirstKeyType, SecondKeyType, ValueType>(
	map:       NestedSetMap<FirstKeyType, SecondKeyType, ValueType>,
	firstKey:  FirstKeyType,
	secondKey: SecondKeyType,
	values:    ValueType | Set<ValueType>
): void {
	const subMap = map.get(firstKey);
	if (subMap === undefined) {
		map.set(firstKey, new Map([[secondKey, values instanceof Set ? values : new Set([values])]]));
	} else {
		insertInSetMap(subMap, secondKey, values);
	}
}

export function insertInSetMap<KeyType, ValueType>(map: Map<KeyType, Set<ValueType>>, key: KeyType, values: ValueType | Set<ValueType>): void {
	const set = map.get(key);
	if (set === undefined) {
		map.set(key, values instanceof Set ? values : new Set([values]));
		return;
	}

	if (!(values instanceof Set)) {
		set.add(values);
		return;
	}

	for (const value of values.values()) {
		set.add(value);
	}
}

export function wrapInArray<T>(value: T): [T] extends Array<infer U> ? Array<U> : Array<T> {
	return Array.isArray(value) ? value : [value];
}

export function isGlobPattern(path: string): boolean {
	return /[*[\]{}]/.test(path);
}
