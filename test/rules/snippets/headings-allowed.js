module.exports = {
	passing: {

		'no headings and empty list': [ // {{{
		`
			Paragraph

			> Quote block

			- List item
			- List item
		`,
			[],
		], // }}}

		'some headings with other text and an empty list': [ // {{{
		`
			# Heading

			Paragraph

			## Heading

			> Quote block

			## Heading

			- List item
			- List item
		`,
			[],
		], // }}}

		'one listed heading': [ // {{{
		`
			# Foo
		`,
			['Foo'],
		], // }}}

		'two listed headings of different levels': [ // {{{
		`
			# Foo

			## Bar
		`,
			['Foo', 'Bar'],
		], // }}}

		'two listed headings and one extra listed heading': [ // {{{
		`
			# Foo

			## Bar
		`,
			['Foo', 'Bar', 'Baz'],
		], // }}}

		'two listed headings with explicit levels': [ // {{{
		`
			# Foo

			### Bar
		`,
			['# Foo', '### Bar'],
		], // }}}

		'three listed headings with explicit levels': [ // {{{
		`
			# Foo

			## Bar

			### Baz
		`,
			['# Foo', '### Baz'],
		], // }}}

		'three listed headings with explicit levels and no spacing': [ // {{{
		`
			# Foo
			## Bar
			### Baz
		`,
			['# Foo', '### Baz'],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['', true],                        2],
		'invalid parameter #2': [['', 'Foo'],                       2],
		'invalid parameter #3': [['', '## Foo'],                    2],
		'invalid parameter #4': [['', { text: 'Foo', level: 2 }],   2],
		'invalid parameter #5': [['', [{ text: 'Foo', level: 2 }]], 2],
		// }}}

		'unlisted heading #1': [[ // {{{
		`
			# Foo

			Paragraph

			# Bar
		`,
			['Foo'],
		],
			'heading "Bar" is not allowed', { line: 5, column: 1, char: 18 }, { line: 5, column: 5, char: 22 },
		], // }}}

		'unlisted heading #2': [[ // {{{
		`
			## Foo

			Paragraph

			## Bar

			Paragraph
		`,
			['Bar'],
		],
			'heading "Foo" is not allowed', { line: 1, column: 1, char: 0 }, { line: 1, column: 6, char: 5 },
		], // }}}

		'heading with the wrong level': [[ // {{{
		`
			### Foo
			### Bar
		`,
			['# Foo', '### Bar'],
		],
			'heading "Foo" is not allowed', { line: 1, column: 1, char: 0 }, { line: 1, column: 7, char: 6 },
		], // }}}

		'unlisted heading with an explicit level': [[ // {{{
		`
			# Foo
			## Bar
			### Baz
		`,
			['# Foo', '### Bar'],
		],
			'heading "Baz" is not allowed', { line: 3, column: 1, char: 13 }, { line: 3, column: 7, char: 19 },
		], // }}}

	},
};
