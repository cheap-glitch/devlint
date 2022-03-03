module.exports = {
	passing: {

		'empty text and empty list': [ // {{{
			'', [],
		], // }}}

		'non-empty text and empty list': [ // {{{
		`
			# Heading

			Paragraph

			## Foo

			Paragraph
		`,
			[],
		], // }}}

		'one required heading': [ // {{{
		`
			# Heading

			Paragraph

			## Foo

			Paragraph
		`,
			['Foo'],
		], // }}}

		'one required heading of specific level': [ // {{{
		`
			# Heading

			Paragraph

			## Foo

			Paragraph
		`,
			['## Foo'],
		], // }}}

		'one required heading of specific level and some other text content': [ // {{{
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
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['', true], 2],
		'invalid parameter #2': [['', 'Foo'], 2],
		'invalid parameter #3': [['', '## Foo'], 2],
		'invalid parameter #4': [['', { text: 'Foo', level: 2 }], 2],
		'invalid parameter #5': [['', [{ text: 'Foo', level: 2 }]], 2],
		// }}}

		'one missing heading #1': [[ // {{{
		`
			# Heading

			Paragraph
		`,
			['Foo'],
		],
			'required heading "Foo" is missing',
		], // }}}

		'one missing heading #2': [[ // {{{
		`
			# Heading

			Paragraph

			## Foo

			Paragraph
		`,
			['Foo', 'Bar'],
		],
			'required heading "Bar" is missing',
		], // }}}

		'one missing heading of specific level': [[ // {{{
		`
			# Heading

			Paragraph

			## Foo

			Paragraph
		`,
			['# Foo', '### Foo'],
		],
			'required heading "Foo" is missing',
		], // }}}

	},
};
