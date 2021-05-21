export function insertInNestedSetMap<KeyType, ValueType>(map: Map<KeyType, Map<KeyType, Set<ValueType>>>, firstKey: KeyType, secondKey: KeyType, values: Set<ValueType>): void {
	const subMap = map.get(firstKey);
	if (subMap === undefined) {
		map.set(firstKey, new Map([[secondKey, new Set(values)]]));
	} else {
		insertInSetMap(subMap, secondKey, values);
	}
}

export function insertInSetMap<KeyType, ValueType>(map: Map<KeyType, Set<ValueType>>, key: KeyType, values: Set<ValueType>): void {
	const set = map.get(key);
	if (set === undefined) {
		map.set(key, new Set(values));
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
