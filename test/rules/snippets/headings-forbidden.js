module.exports = {
	passing: {

		'empty list': [ // {{{
		`
			# Heading

			Paragraph

			## Foo

			Paragraph
		`,
			[],
		], // }}}

		'one unlisted heading': [ // {{{
		`
			# Heading

			Paragraph
		`,
			['Foo'],
		], // }}}

		'two unlisted headings': [ // {{{
		`
			# Heading

			Paragraph

			## Foo

			Paragraph
		`,
			['Bar'],
		], // }}}

		'one unlisted heading and one heading of different level': [ // {{{
		`
			# Heading

			Paragraph

			## Foo

			Paragraph
		`,
			['# Foo', '### Foo'],
		], // }}}

		'regex model #1': [ // {{{
		`
			## Lorem volum
		`,
			['## /ips/'],
		], // }}}

		'regex model #2': [ // {{{
		`
			## Dolor sit amet
		`,
			['/^Lorem *(ipsu[md]|volum)$/'],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['', true], 2],
		'invalid parameter #2': [['', 'Foo'], 2],
		'invalid parameter #3': [['', '## Foo'], 2],
		'invalid parameter #4': [['', { text: 'Foo', level: 2 }], 2],
		'invalid parameter #5': [['', [{ text: 'Foo', level: 2 }]], 2],
		// }}}

		'one forbidden heading': [[ // {{{
		`
			# Heading

			Paragraph

			## Foo

			Paragraph
		`,
			['Foo'],
		],
			'heading "Foo" is forbidden', { line: 5, column: 1, char: 22 }, { line: 5, column: 6, char: 27 },
		], // }}}

		'one forbidden heading with specific level': [[ // {{{
		`
			# Heading

			Paragraph

			## Foo

			Paragraph
		`,
			['## Foo'],
		],
			'heading "Foo" is forbidden', { line: 5, column: 1, char: 22 }, { line: 5, column: 6, char: 27 },
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
			'heading "Foo" is forbidden', { line: 10, column: 1, char: 54 }, { line: 10, column: 6, char: 59 },
		], // }}}

		'regex model #1': [[ // {{{
		`
			## Lorem ipsum
		`,
			['## /ips/'],
		],
			'heading "Lorem ipsum" is forbidden', { line: 1, column: 1, char: 0 }, { line: 1, column: 14, char: 13 },
		], // }}}

		'regex model #2': [[ // {{{
		`
			## Dolor sit amet

			## Lorem ipsum
		`,
			['/^Lorem *(ipsu[md]|volum)$/'],
		],
			'heading "Lorem ipsum" is forbidden', { line: 3, column: 1, char: 19 }, { line: 3, column: 14, char: 32 },
		], // }}}

	},
};
