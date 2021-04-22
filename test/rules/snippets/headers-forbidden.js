module.exports = {
	passing: [

		[`
			# Header

			Paragraph
			`,
			['Foo'],
		],

		[`
			# Header

			Paragraph

			## Foo

			Paragraph
			`,
			[],
		],

		[`
			# Header

			Paragraph

			## Foo

			Paragraph
			`,
			['Bar'],
		],

		[`
			# Header

			Paragraph

			## Foo

			Paragraph
			`,
			['# Foo', '### Foo'],
		],

	],

	failing: [

		[['', true],                        2],
		[['', 'Foo'],                       2],
		[['', '## Foo'],                    2],
		[['', { text: 'Foo', level: 2 }],   2],
		[['', [{ text: 'Foo', level: 2 }]], 2],

		[[`
			# Header

			Paragraph

			## Foo

			Paragraph
			`,
			['Foo'],
		], 'header "Foo" is forbidden', { line: 5, column: 1, char: 21 }, { line: 5, column: 6, char: 26 }],

		[[`
			# Header

			Paragraph

			## Foo

			Paragraph
			`,
			['## Foo'],
		], 'header "Foo" is forbidden', { line: 5, column: 1, char: 21 }, { line: 5, column: 6, char: 26 }],

		[[`
			# Foo

			Paragraph

			### Foo

			 - List item
			 - List item

			## Foo

			Paragraph
			`,
			['## Foo'],
		], 'header "Foo" is forbidden', { line: 10, column: 1, char: 54 }, { line: 10, column: 6, char: 59 }],

	],
};
