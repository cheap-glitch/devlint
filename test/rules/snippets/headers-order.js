module.exports = {
	passing: [

		[`
			Lorem ipsum
			`,
			[],
		],

		[`
			Lorem ipsum
			`,
			['Foo', 'Bar', 'Baz'],
		],

		[`
			# Foo
			# Bar
			# Baz
			`,
			['Foo', 'Bar', 'Baz'],
		],

		[`
			# Foo
			# Bar
			# Baz
			`,
			['Foo', 'Foobar', 'Bar', 'Baz'],
		],

		[`
			# Foo
			# Bar

			Paragraph

			# Baz
			`,
			['Foo', 'Bar', 'Baz'],
		],

		[`
			# Foo

			# Header

			# Bar

			Paragraph

			# Baz
			`,
			['Foo', 'Bar', 'Baz'],
		],

		[`
			# Foo
			# Bar
			# Baz
			`,
			['# Foo', '# Bar', '# Baz'],
		],

		[`
			# Foo
			# Bar
			# Baz
			`,
			['Foo', '# Bar', '## Baz'],
		],

		[`
			# Foo
			## Bar
			### Baz
			`,
			['# Foo', '## Bar', '### Baz'],
		],

		[`
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
		],

	],

	failing: [

		[['', true],                        2],
		[['', 'Foo'],                       2],
		[['', '## Foo'],                    2],
		[['', { text: 'Foo', level: 2 }],   2],
		[['', [{ text: 'Foo', level: 2 }]], 2],

		[[`
			# Bar
			# Foo
			# Baz
			`,
			['Foo', 'Bar', 'Baz'],
		], 'header "Foo" should be placed before "Bar"', { line: 2, column: 1, char: 6 }, { line: 2, column: 5, char: 10 }],

		[[`
			# Bar
			# Foo
			# Baz
			`,
			['Foo', 'Foobar', 'Bar', 'Baz'],
		], 'header "Foo" should be placed before "Bar"', { line: 2, column: 1, char: 6 }, { line: 2, column: 5, char: 10 }],

		[[`
			# Bar

			Paragraph

			# Baz

			Paragraph

			# Foo
			`,
			['Foo', 'Bar', 'Baz'],
		], 'header "Foo" should be placed before "Bar"', { line: 9, column: 1, char: 36 }, { line: 9, column: 5, char: 40 }],

		[[`
			# Foo

			# Header

			# Baz

			Paragraph

			# Bar
			`,
			['Foo', 'Bar', 'Baz'],
		], 'header "Bar" should be placed between "Foo" and "Baz"', { line: 9, column: 1, char: 35 }, { line: 9, column: 5, char: 39 }],

		[[`
			# Bar
			# Foo
			# Baz
			`,
			['# Foo', '# Bar', '# Baz'],
		], 'header "Foo" should be placed before "Bar"', { line: 2, column: 1, char: 6 }, { line: 2, column: 5, char: 10 }],

		[[`
			### Baz
			# Foo
			## Bar
			`,
			['# Foo', '## Bar', '### Baz'],
		], 'header "Foo" should be placed before "Bar"', { line: 2, column: 1, char: 8 }, { line: 2, column: 5, char: 12 }],

	],
};
