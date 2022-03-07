import { matchJsonValues } from '../../src/lib/helpers/json';

describe('matchJsonValues', () => {

	test('primitives', () => { // {{{

		// eslint-disable-next-line unicorn/no-useless-undefined -- Test explicitly for the `undefined` value
		expect(matchJsonValues(undefined, undefined)).toBe(true);
		expect(matchJsonValues(null, null)).toBe(true);
		expect(matchJsonValues(false, false)).toBe(true);
		expect(matchJsonValues(1, 1)).toBe(true);
		expect(matchJsonValues('foo', 'foo')).toBe(true);

		expect(matchJsonValues(1, false)).toBe(false);
		expect(matchJsonValues(1, '1')).toBe(false);
		expect(matchJsonValues('foo', 'bar')).toBe(false);

	}); // }}}

	test('arrays', () => { // {{{

		expect(matchJsonValues([], [])).toBe(true);
		expect(matchJsonValues([true], [true])).toBe(true);

		expect(matchJsonValues([true], [false])).toBe(false);

	}); // }}}

	test('objects', () => { // {{{

		expect(matchJsonValues({}, {})).toBe(true);
		expect(matchJsonValues({}, { foo: 1 })).toBe(true);

	}); // }}}

});
