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

		'regex model #1': [ // {{{
		`
			## Lorem ipsum
		`,
			['## /ips/'],
		], // }}}

		'regex model #2': [ // {{{
		`
			## Lorem ipsum
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

		'regex model #1': [[ // {{{
		`
			## Lorem volum
		`,
			['## /ips/'],
		],
			'required heading "/ips/" is missing',
		], // }}}

		'regex model #2': [[ // {{{
		`
			## Dolor sit amet
		`,
			['/^Lorem *(ipsu[md]|volum)$/'],
		],
			'required heading "/^Lorem *(ipsu[md]|volum)$/" is missing',
		], // }}}

		'regex model #3': [[ // {{{
		`
			# Lorem ipsum

			## Dolor sit amet
		`,
			['## /^Lorem *(ipsu[md]|volum)$/'],
		],
			'required heading "/^Lorem *(ipsu[md]|volum)$/" is missing',
		], // }}}

	},
};
