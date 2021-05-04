module.exports = {
	passing: {

		'empty list': [ // {{{
		`
			# Header

			Paragraph

			## Foo

			Paragraph
		`,
			[],
		], // }}}

		'one unlisted heading': [ // {{{
		`
			# Header

			Paragraph
		`,
			['Foo'],
		], // }}}

		'two unlisted headings': [ // {{{
		`
			# Header

			Paragraph

			## Foo

			Paragraph
		`,
			['Bar'],
		], // }}}

		'one unlisted heading and one heading of different level': [ // {{{
		`
			# Header

			Paragraph

			## Foo

			Paragraph
		`,
			['# Foo', '### Foo'],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['', true],                        2],
		'invalid parameter #2': [['', 'Foo'],                       2],
		'invalid parameter #3': [['', '## Foo'],                    2],
		'invalid parameter #4': [['', {  text: 'Foo', level: 2 }],  2],
		'invalid parameter #5': [['', [{ text: 'Foo', level: 2 }]], 2],
		// }}}

		'one forbidden heading': [[ // {{{
		`
			# Header

			Paragraph

			## Foo

			Paragraph
		`,
			['Foo'],
		],
			'header "Foo" is forbidden', { line: 5, column: 1, char: 21 }, { line: 5, column: 6, char: 26 },
		], // }}}

		'one forbidden heading with specific level': [[ // {{{
		`
			# Header

			Paragraph

			## Foo

			Paragraph
		`,
			['## Foo'],
		],
			'header "Foo" is forbidden', { line: 5, column: 1, char: 21 }, { line: 5, column: 6, char: 26 },
		], // }}}

		'one forbidden heading with specific level and some other text content': [[ // {{{
		`
			# Foo

			Paragraph

			### Foo

			 - List item
			 - List item

			## Foo

			Paragraph
		`,
			['## Foo'],
		],
			'header "Foo" is forbidden', { line: 10, column: 1, char: 54 }, { line: 10, column: 6, char: 59 },
		], // }}}

	},
};
