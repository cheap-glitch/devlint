export function insertValueInNestedMap<Key, Value>(map: Map<Key, Map<Key, Value>>, firstKey: Key, secondKey: Key, value: Value): void {
	const firstValue = map.get(firstKey);
	if (firstValue === undefined) {
		map.set(firstKey, new Map([[secondKey, value]]));
		return;
	}

	const secondValue = firstValue.get(secondKey);
	if (secondValue === undefined) {
		firstValue.set(secondKey, value);
		return;
	}

	if (Array.isArray(value) && Array.isArray(secondValue)) {
		secondValue.push(...value);
	} else {
		firstValue.set(secondKey, value);
	}
}

export function wrapInArray<T>(value: T): [T] extends Array<infer U> ? Array<U> : Array<T> {
	return Array.isArray(value) ? value : [value];
}
