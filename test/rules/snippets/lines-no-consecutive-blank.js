module.exports = {
	passing: {

		'empty text': [ // {{{
			'',
		], // }}}

		'single line': [ // {{{
			'foo',
		], // }}}

		'multiple lines': [ // {{{
			'foo\nbar\nbaz',
		], // }}}

		'multiple lines with trailing newline character': [ // {{{
			'foo\nbar\nbaz\\n',
		], // }}}

		'multiple blocks': [ // {{{
			'foo\n\nbar\n\nbaz',
		], // }}}

		'multiple blocks with trailing tablature': [ // {{{
			'foo\nbar\n\t\nbaz\\n',
		], // }}}

	}, failing: {

		'single newline character': [[ // {{{
			'\\n',
		],
			'line should not be empty', { line: 2, column: 1, char: 1 }, { line: 2, column: 1, char: 1 },
		], // }}}

		'two empty lines at the beginning': [[ // {{{
			'\\n\\nfoo',
		],
			'line should not be empty', { line: 2, column: 1, char: 1 }, { line: 2, column: 1, char: 1 },
		], // }}}

		'empty line at the end': [[ // {{{
			'foo\\n\\n',
		],
			'line should not be empty', { line: 3, column: 1, char: 5 }, { line: 3, column: 1, char: 5 },
		], // }}}

		'two empty lines between two blocks': [[ // {{{
			'foo\n\n\nbar',
		],
			'line should not be empty', { line: 3, column: 1, char: 5 }, { line: 3, column: 1, char: 5 },
		], // }}}

		'block with only whitespace characters': [[ // {{{
			'foo\n\n \t \n\nbar',
		],
			'line should not be empty', { line: 3, column: 1, char: 5 }, { line: 3, column: 4, char: 8 },
		], // }}}

	},
};
