module.exports = {
	passing: [
		"",
		"foo",
		"foo\nbar\nbaz",
		"foo\nbar\nbaz\n",
		"foo\n\tbar\nbaz\n",
		"foo\nbar\t\nbaz\n",
	],

	failing: {
		defaultErrorMessage: 'line should not be empty',
		snippets: [
			["\n",            '', { line: 1, column: 1, char: 0 }, { line: 1, column: 1, char: 0 }],
			["\nfoo",         '', { line: 1, column: 1, char: 0 }, { line: 1, column: 1, char: 0 }],
			["foo\n\n",       '', { line: 2, column: 1, char: 4 }, { line: 2, column: 1, char: 4 }],
			["foo\n\nbar",    '', { line: 2, column: 1, char: 4 }, { line: 2, column: 1, char: 4 }],
			["foo\n\t \nbar", '', { line: 2, column: 1, char: 4 }, { line: 2, column: 3, char: 6 }],
		]
	},
}
