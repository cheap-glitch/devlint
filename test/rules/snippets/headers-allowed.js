module.exports = {
	passing: [

		[`
			Paragraph

			> Quote block

			- List item
			- List item
			`,
			[],
		],

		[`
			# Header

			Paragraph

			## Header

			> Quote block

			## Header

			- List item
			- List item
			`,
			[],
		],

		[`
			# Foo

			Paragraph
			`,
			['Foo'],
		],

		[`
			# Foo

			Paragraph

			## Bar

			Paragraph
			`,
			['Foo', 'Bar'],
		],

		[`
			# Foo
			## Bar
			`,
			['Foo', 'Bar', 'Baz'],
		],

		[`
			# Foo
			### Bar
			`,
			['# Foo', '### Bar'],
		],

		[`
			# Foo
			## Bar
			### Baz
			`,
			['# Foo', '### Baz'],
		],

	],

	failing: [

		[['', true],                        2],
		[['', 'Foo'],                       2],
		[['', '## Foo'],                    2],
		[['', { text: 'Foo', level: 2 }],   2],
		[['', [{ text: 'Foo', level: 2 }]], 2],

		[[`
			# Foo

			Paragraph

			# Bar
			`,
			['Foo'],
		], 'header "Bar" is not allowed', { line: 5, column: 1, char: 18 }, { line: 5, column: 5, char: 22 }],

		[[`
			## Foo

			Paragraph

			## Bar

			Paragraph
			`,
			['Bar'],
		], 'header "Foo" is not allowed', { line: 1, column: 1, char: 0 }, { line: 1, column: 6, char: 5 }],

		[[`
			### Foo
			### Bar
			`,
			['# Foo', '### Bar'],
		], 'header "Foo" is not allowed', { line: 1, column: 1, char: 0 }, { line: 1, column: 7, char: 6 }],

		[[`
			# Foo
			## Bar
			### Baz
			`,
			['# Foo', '### Bar'],
		], 'header "Baz" is not allowed', { line: 3, column: 1, char: 13 }, { line: 3, column: 7, char: 19 }],

	],
};
