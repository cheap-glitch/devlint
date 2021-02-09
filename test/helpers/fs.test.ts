import { getPathHierarchy } from '../../src/lib/helpers/fs';

describe('getPathHierarchy', () => {

	test('simple paths', () => { // {{{

		expect(getPathHierarchy(['/foo/bar/baz'])).toEqual([['/', 'foo', 'bar', 'baz'], ['/', 'foo', 'bar'], ['/', 'foo'], ['/']]);
		expect(getPathHierarchy(['/foo//bar///baz'])).toEqual([['/', 'foo', 'bar', 'baz'], ['/', 'foo', 'bar'], ['/', 'foo'], ['/']]);

	}); // }}}

	test('paths with relative segments', () => { // {{{

		expect(getPathHierarchy(['/foo/bar/../baz'])).toEqual([['/', 'foo', 'baz'], ['/', 'foo'], ['/']]);
		expect(getPathHierarchy(['/foo/../bar/../baz/..'])).toEqual([['/']]);

	}); // }}}

});
