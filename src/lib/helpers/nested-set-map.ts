export class NestedSetMap<FirstKeyType, SecondKeyType, ValueType> {
	private map: Map<FirstKeyType, Map<SecondKeyType, Set<ValueType>>>;

	constructor() {
		this.map = new Map();
	}

	forEachNestedValue(callback: (element: ValueType) => void): void {
		for (const subMap of this.map.values()) {
			for (const subMapSet of subMap.values()) {
				for (const nestedValue of subMapSet.values()) {
					callback(nestedValue);
				}
			}
		}
	}

	get(firstKey: FirstKeyType, secondKey: SecondKeyType): Set<ValueType> | undefined {
		return this.map.get(firstKey)?.get(secondKey);
	}

	set(firstKey: FirstKeyType, secondKey: SecondKeyType, values: ValueType | Set<ValueType>): void {
		const subMap = this.map.get(firstKey);
		if (!subMap) {
			this.map.set(firstKey, new Map([[secondKey, values instanceof Set ? values : new Set([values])]]));

			return;
		}

		const set = subMap.get(secondKey);
		if (!set) {
			subMap.set(secondKey, values instanceof Set ? values : new Set([values]));

			return;
		}

		if (values instanceof Set) {
			for (const valueToInsert of values.values()) {
				set.add(valueToInsert);
			}
		} else {
			set.add(values);
		}
	}

	entriesArray(): Array<[FirstKeyType, Map<SecondKeyType, Set<ValueType>>]> {
		return [...this.map.entries()];
	}
}
