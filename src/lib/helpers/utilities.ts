export function insertInNestedSetMap<KeyType, ValueType>(map: Map<KeyType, Map<KeyType, Set<ValueType>>>, firstKey: KeyType, secondKey: KeyType, value: ValueType): void {
	const subMap = map.get(firstKey);
	if (subMap !== undefined) {
		insertInSetMap(subMap, secondKey, value);
	} else {
		map.set(firstKey, new Map([[secondKey, new Set([value])]]));
	}
}

export function insertInSetMap<KeyType, ValueType>(map: Map<KeyType, Set<ValueType>>, key: KeyType, value: ValueType): void {
	const set = map.get(key);
	if (set !== undefined) {
		set.add(value);
	} else {
		map.set(key, new Set([value]));
	}
}

export function wrapInArray<T>(value: T): [T] extends Array<infer U> ? Array<U> : Array<T> {
	return Array.isArray(value) ? value : [value];
}
