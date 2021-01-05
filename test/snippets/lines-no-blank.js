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
			["\n",         { start: { line: 1, column: 1, char: 0 } }],
			["\nfoo",      { start: { line: 1, column: 1, char: 0 } }],
			["foo\n\n",    { start: { line: 2, column: 1, char: 4 } }],
			["foo\n\nbar", { start: { line: 2, column: 1, char: 4 } }],
		]
	},
}
