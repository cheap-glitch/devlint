import { parsePropertiesPath } from '../../src/lib/helpers/properties';

describe('parsePropertiesPath', () => {

	test('empty path', () => { // {{{

		expect(parsePropertiesPath('')).toEqual([]);

	}); // }}}

	test('single key', () => { // {{{

		expect(parsePropertiesPath('foo')).toEqual(['foo']);
		expect(parsePropertiesPath('.foo')).toEqual(['foo']);

	}); // }}}

	test('mutiple keys', () => { // {{{

		expect(parsePropertiesPath('foo.bar.baz')).toEqual(['foo', 'bar', 'baz']);
		expect(parsePropertiesPath('.foo.bar.baz')).toEqual(['foo', 'bar', 'baz']);
		expect(parsePropertiesPath('.foo..bar.baz')).toEqual(['foo', 'bar', 'baz']);

	}); // }}}

	test('single numeric keys', () => { // {{{

		expect(parsePropertiesPath('0')).toEqual([0]);
		expect(parsePropertiesPath('.0')).toEqual([0]);
		expect(parsePropertiesPath('[0]')).toEqual([0]);

	}); // }}}

	test('mutiple numeric keys', () => { // {{{

		expect(parsePropertiesPath('0.1.2')).toEqual([0, 1, 2]);
		expect(parsePropertiesPath('[0][1][2]')).toEqual([0, 1, 2]);
		expect(parsePropertiesPath('[0].1.[2]')).toEqual([0, 1, 2]);

	}); // }}}

	test('mutiple mixed keys', () => { // {{{

		expect(parsePropertiesPath('.foo[0].bar.2')).toEqual(['foo', 0, 'bar', 2]);
		expect(parsePropertiesPath('[0].foo..[1].bar[2]')).toEqual([0, 'foo', 1, 'bar', 2]);

	}); // }}}

});
