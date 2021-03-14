const outdent = require('outdent');

module.exports = {
	passing: [

		[outdent`
			# Header

			Paragraph
			`,
			['Foo'],
		],

		[outdent`
			# Header

			Paragraph

			## Foo

			Paragraph
			`,
			[],
		],

		[outdent`
			# Header

			Paragraph

			## Foo

			Paragraph
			`,
			['Bar'],
		],

		[outdent`
			# Header

			Paragraph

			## Foo

			Paragraph
			`,
			['# Foo', '### Foo'],
		],

	],

	failing: [

		[['', true],                      2],
		[['', 'Foo'],                     2],
		[['', '## Foo'],                  2],
		[['', { text: 'Foo', level: 2 }], 2],

		[[outdent`
			# Header

			Paragraph

			## Foo

			Paragraph
			`,
			['Foo'],
		], 'header "Foo" is forbidden', { line: 5, column: 1, char: 21 }, { line: 5, column: 6, char: 26 }],

		[[outdent`
			# Header

			Paragraph

			## Foo

			Paragraph
			`,
			['## Foo'],
		], 'header "Foo" is forbidden', { line: 5, column: 1, char: 21 }, { line: 5, column: 6, char: 26 }],

		[[outdent`
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
