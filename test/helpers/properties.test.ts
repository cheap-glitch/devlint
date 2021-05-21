import { parsePropertyPath } from '../../src/lib/helpers/properties';

describe('parsePropertyPath', () => {

	test('empty path', () => { // {{{

		expect(parsePropertyPath('')).toEqual([]);

	}); // }}}

	test('single key', () => { // {{{

		expect(parsePropertyPath('foo')).toEqual(['foo']);
		expect(parsePropertyPath('.foo')).toEqual(['foo']);

	}); // }}}

	test('mutiple keys', () => { // {{{

		expect(parsePropertyPath('foo.bar.baz')).toEqual(['foo', 'bar', 'baz']);
		expect(parsePropertyPath('.foo.bar.baz')).toEqual(['foo', 'bar', 'baz']);
		expect(parsePropertyPath('.foo..bar.baz')).toEqual(['foo', 'bar', 'baz']);

	}); // }}}

	test('single numeric keys', () => { // {{{

		expect(parsePropertyPath('0')).toEqual([0]);
		expect(parsePropertyPath('.0')).toEqual([0]);
		expect(parsePropertyPath('[0]')).toEqual([0]);

	}); // }}}

	test('mutiple numeric keys', () => { // {{{

		expect(parsePropertyPath('0.1.2')).toEqual([0, 1, 2]);
		expect(parsePropertyPath('[0].1.[2]')).toEqual([0, 1, 2]);
		expect(parsePropertyPath('[0].[1].[2]')).toEqual([0, 1, 2]);

	}); // }}}

	test('mutiple mixed keys', () => { // {{{

		expect(parsePropertyPath('.foo.[0].bar.2')).toEqual(['foo', 0, 'bar', 2]);
		expect(parsePropertyPath('[0].foo..[1].bar.[2]')).toEqual([0, 'foo', 1, 'bar', 2]);

	}); // }}}

});
