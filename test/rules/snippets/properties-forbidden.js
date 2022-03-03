module.exports = {
	passing: {

		'empty object with empty list': [ // {{{
		`
			{
			}
		`,
			[],
		], // }}}

		'empty object with non-empty list': [ // {{{
		`
			{
			}
		`,
			['foo'],
		], // }}}

		'non-empty object with empty list': [ // {{{
		`
			{
			  "foo": 0
			}
		`,
			[],
		], // }}}

		'unlisted property': [ // {{{
		`
			{
			  "bar": 0
			}
		`,
			['foo'],
		], // }}}

		'nested forbidden property': [ // {{{
		`
			{
			  "foo": {
			    "bar": false
			  }
			}
		`,
			['bar'],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['{}', 'foo'], 2],
		'invalid parameter #2': [['{}', { foo: false }], 2],
		// }}}

		'one forbidden property': [[ // {{{
		`
			{
			  "foo": false
			}
		`,
			['foo'],
		],
			'property "foo" is forbidden', { line: 2, column: 3, char: 4 }, { line: 2, column: 8, char: 9 },
		], // }}}

		'two allowed properties and one forbidden property': [[ // {{{
		`
			{
			  "foo": true,
			  "bar": [
			    "a",
			    "b",
			    "c"
			  ],
			  "baz": {
			    "baz": {}
			  }
			}
		`,
			['baz'],
		],
			'property "baz" is forbidden', { line: 8, column: 3, char: 61 }, { line: 8, column: 8, char: 66 },
		], // }}}

	},
};
