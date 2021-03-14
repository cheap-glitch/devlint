import outdent from 'outdent';

import { getMarkdownHeaders } from '../../src/lib/helpers/markdown';

describe('getMarkdownHeaders', () => {

	test('headers in text', () => { // {{{

		expect(getMarkdownHeaders(outdent`
			# foo

			## bar

			paragraph

			 * list item
			 * list item
			 * list item

			## baz
			paragraph
		`)).toEqual([
			{
				text:      'foo',
				level:     1,
				char:      0,
				fullMatch: '# foo',
			},
			{
				text:      'bar',
				level:     2,
				char:      7,
				fullMatch: '## bar',
			},
			{
				text:      'baz',
				level:     2,
				char:      66,
				fullMatch: '## baz',
			},
		]);

	}); // }}}

});
