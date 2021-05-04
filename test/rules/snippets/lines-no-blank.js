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

		'multiple lines with indentation and trailing newline character': [ // {{{
			'foo\n\tbar\nbaz\\n',
		], // }}}

		'multiple lines with trailing tablature and newline characters': [ // {{{
			'foo\nbar\t\nbaz\\n',
		], // }}}

	}, failing: {

		'just a newline character': [[ // {{{
			'\\n',
		],
			'line should not be empty', { line: 1, column: 1, char: 0 }, { line: 1, column: 1, char: 0 },
		], // }}}

		'empty line at the beginning': [[ // {{{
			'\\nfoo',
		],
			'line should not be empty', { line: 1, column: 1, char: 0 }, { line: 1, column: 1, char: 0 },
		], // }}}

		'empty line at the end': [[ // {{{
			'foo\\n\\n',
		],
			'line should not be empty', { line: 2, column: 1, char: 4 }, { line: 2, column: 1, char: 4 },
		], // }}}

		'empty line between two lines': [[ // {{{
			'foo\n\nbar',
		],
			'line should not be empty', { line: 2, column: 1, char: 4 }, { line: 2, column: 1, char: 4 },
		], // }}}

		'line with only whitespace characters': [[ // {{{
			'foo\n\t \nbar',
		],
			'line should not be empty', { line: 2, column: 1, char: 4 }, { line: 2, column: 3, char: 6 },
		], // }}}

	},
};
