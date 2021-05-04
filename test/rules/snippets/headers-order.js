module.exports = {
	passing: {

		'no headings and no listed headings': [ // {{{
		`
			Lorem ipsum
		`,
			[],
		], // }}}

		'no headings and listed headings': [ // {{{
		`
			Lorem ipsum
		`,
			['Foo', 'Bar', 'Baz'],
		], // }}}

		'ordered headings': [ // {{{
		`
			# Foo
			# Bar
			# Baz
		`,
			['Foo', 'Bar', 'Baz'],
		], // }}}

		'ordered headings and one extra listed heading': [ // {{{
		`
			# Foo
			# Bar
			# Baz
		`,
			['Foo', 'Foobar', 'Bar', 'Baz'],
		], // }}}

		'ordered headings with one paragraph in between': [ // {{{
		`
			# Foo
			# Bar

			Paragraph

			# Baz
		`,
			['Foo', 'Bar', 'Baz'],
		], // }}}

		'ordered headings with one heading and one paragraph in between': [ // {{{
		`
			# Foo

			# Header

			# Bar

			Paragraph

			# Baz
		`,
			['Foo', 'Bar', 'Baz'],
		], // }}}

		'ordered headings with various text content in between': [ // {{{
		`
			# Foo

			Paragraph

			# Bar

			Paragraph

			## Bar

			# Baz

			- List item

			### Baz

			> Block quote
		`,
			['# Foo', '## Bar', '### Baz'],
		], // }}}

		'ordered headings and specific levels in list #1': [ // {{{
		`
			# Foo
			# Bar
			# Baz
		`,
			['# Foo', '# Bar', '# Baz'],
		], // }}}

		'ordered headings and specific levels in list #2': [ // {{{
		`
			# Foo
			# Bar
			# Baz
		`,
			['Foo', '# Bar', '## Baz'],
		], // }}}

		'ordered headings and specific levels in list #3': [ // {{{
		`
			# Foo
			## Bar
			### Baz
		`,
			['# Foo', '## Bar', '### Baz'],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['', true],                        2],
		'invalid parameter #2': [['', 'Foo'],                       2],
		'invalid parameter #3': [['', '## Foo'],                    2],
		'invalid parameter #4': [['', { text: 'Foo', level: 2 }],   2],
		'invalid parameter #5': [['', [{ text: 'Foo', level: 2 }]], 2],
		// }}}

		'disordered headings': [[ // {{{
		`
			# Bar
			# Foo
			# Baz
		`,
			['Foo', 'Bar', 'Baz'],
		],
			'header "Foo" should be placed before "Bar"', { line: 2, column: 1, char: 6 }, { line: 2, column: 5, char: 10 },
		], // }}}

		'disordered headings with paragraphs in between': [[ // {{{
		`
			# Bar

			Paragraph

			# Baz

			Paragraph

			# Foo
		`,
			['Foo', 'Bar', 'Baz'],
		],
			'header "Foo" should be placed before "Bar"', { line: 9, column: 1, char: 36 }, { line: 9, column: 5, char: 40 },
		], // }}}

		'disordered headings and one extra listed heading': [[ // {{{
		`
			# Bar
			# Foo
			# Baz
		`,
			['Foo', 'Foobar', 'Bar', 'Baz'],
		],
			'header "Foo" should be placed before "Bar"', { line: 2, column: 1, char: 6 }, { line: 2, column: 5, char: 10 },
		], // }}}

		'disordered headings and one unlisted heading': [[ // {{{
		`
			# Foo

			# Header

			# Baz

			Paragraph

			# Bar
		`,
			['Foo', 'Bar', 'Baz'],
		],
			'header "Bar" should be placed between "Foo" and "Baz"', { line: 9, column: 1, char: 35 }, { line: 9, column: 5, char: 39 },
		], // }}}

		'disordered headings and specific levels in list #1': [[ // {{{
		`
			# Bar
			# Foo
			# Baz
		`,
			['# Foo', '# Bar', '# Baz'],
		],
			'header "Foo" should be placed before "Bar"', { line: 2, column: 1, char: 6 }, { line: 2, column: 5, char: 10 },
		], // }}}

		'disordered headings and specific levels in list #2': [[ // {{{
		`
			### Baz
			# Foo
			## Bar
		`,
			['# Foo', '## Bar', '### Baz'],
		],
			'header "Foo" should be placed before "Bar"', { line: 2, column: 1, char: 8 }, { line: 2, column: 5, char: 12 },
		], // }}}

	},
};
