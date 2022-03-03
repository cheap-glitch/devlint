module.exports = {
	passing: {

		'empty text and no options': [ // {{{
		`
		`,
			{},
		], // }}}

		'empty text and some options': [ // {{{
		`
		`,
			{ above: 0, below: 2 },
		], // }}}

		'one heading with no spacing and required spacing above': [ // {{{
		`
			# Heading
		`,
			{ above: 3 },
		], // }}}

		'one heading and required spacing above (no ignoring first heading)': [ // {{{
		`



			# Heading
		`,
			{ above: 3, ignoreAboveFirst: false },
		], // }}}

		'one heading and required spacing below': [ // {{{
		`
			# Heading

		`,
			{ below: 1 },
		], // }}}

		'one heading and required spacing above and below': [ // {{{
		`
			# Heading

		`,
			{ above: 1, below: 1 },
		], // }}}

		'two headings of same level and same required spacing above and below': [ // {{{
		`
			# Foo

			# Bar

		`,
			{ above: 1, below: 1 },
		], // }}}

		'two headings of same level and different required spacing above and below': [ // {{{
		`
			# Foo

			# Bar

		`,
			{ above: 2, below: 1 },
		], // }}}

		'two headings of same level and different required spacing above and below (no collapsing)': [ // {{{
		`
			# Foo



			# Bar

		`,
			{ above: 2, below: 1, collapse: false },
		], // }}}

		'two headings of same level and some paragraphs': [ // {{{
		`
			# Foo

			Lorem ipsum dolor
			sit amet.


			# Bar

			Lorem ipsum dolor
			sit amet.

		`,
			{ above: 2, below: 1 },
		], // }}}

		'nested headings': [ // {{{
		`
			# A. Heading

			> Blockquote


			## A.1. Heading

			### A.1.1 Heading

			Lorem ipsum dolor
			sit amet.


			### A.1.2 Heading

			- Foo
			- Bar
			  - Foobar

			Lorem ipsum dolor
			sit amet.


			## A.2. Heading

			* Foo
			* Bar
			* Baz


			# B. Heading

			Lorem ipsum dolor
			sit amet.

			Lorem ipsum dolor
			sit amet.
		`,
			{ above: 2, below: 1 },
		], // }}}

		'headings and required absence of spacing below': [ // {{{
		`
			# Heading
			Paragraph

			## Subheading
			Paragraph

			## Subheading
			> Blockquote

			# Heading
			Paragraph

			Paragraph
		`,
			{ below: 0 },
		], // }}}

		'headings and required absence of spacing above and below': [ // {{{
		`
			# Heading
			Paragraph
			## Subheading
			Paragraph
			## Subheading
			> Blockquote
			# Heading
			Paragraph

			Paragraph
		`,
			{ above: 0, below: 0 },
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['', [1, 2, 1]], 2],
		'invalid parameter #2': [['', { above: '3' }], 2],
		'invalid parameter #3': [['', { after: 1 }], 2],
		'invalid parameter #4': [['', { before: 1, below: 3 }], 2],
		// }}}

		'heading missing spacing above #1': [[ // {{{
		`
			## Foo
			## Bar
		`,
			{ above: 2 },
		],
			'heading must have 2 empty lines above it', { line: 2, column: 1, char: 7 },
		], // }}}

		'heading missing spacing above #2': [[ // {{{
		`
			## Foo

			Lorem ipsum dolor sit amet.

			* List item
			* List item

			## Bar

			Lorem ipsum dolor sit amet.

		`,
			{ above: 2 },
		],
			'heading must have 2 empty lines above it', { line: 8, column: 1, char: 62 },
		], // }}}

		'heading missing spacing above (no collapsing)': [[ // {{{
		`
			# Foo

			# Bar


		`,
			{ above: 1, below: 2, collapse: false },
		],
			'heading must have 3 empty lines above it', { line: 3, column: 1, char: 7 },
		], // }}}

		'heading missing spacing above (no ignoring first heading)': [[ // {{{
		`
			# Foo

			# Bar
		`,
			{ above: 1, ignoreAboveFirst: false },
		],
			'heading must have 1 empty line above it', { line: 1, column: 1, char: 0 },
		], // }}}

		'heading missing spacing below': [[ // {{{
		`
			### Heading
		`,
			{ below: 1 },
		],
			'heading must have 1 empty line below it', { line: 1, column: 1, char: 0 },
		], // }}}

	},
};
