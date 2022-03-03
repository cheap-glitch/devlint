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

		'allowed properties': [ // {{{
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
			['foo', 'bar', 'baz'],
		], // }}}

		'nested unallowed property': [ // {{{
		`
			{
			  "foo": {
			    "bar": false
			  }
			}
		`,
			['foo'],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['{}', 'foo'], 2],
		'invalid parameter #2': [['{}', { foo: false }], 2],
		// }}}

		'non-empty object with empty list': [[ // {{{
		`
			{
			  "foo": 0
			}
		`,
			[],
		],
			'property "foo" is not allowed', { line: 2, column: 3, char: 4 }, { line: 2, column: 8, char: 9 },
		], // }}}

		'one unallowed property': [[ // {{{
		`
			{
			  "bar": 0
			}
		`,
			['foo'],
		],
			'property "bar" is not allowed', { line: 2, column: 3, char: 4 }, { line: 2, column: 8, char: 9 },
		], // }}}

		'two allowed properties and one unallowed property': [[ // {{{
		`
			{
			  "foo": 0,
			  "bar": 1,
			  "baz": 2
			}
		`,
			['foo', 'baz'],
		],
			'property "bar" is not allowed', { line: 3, column: 3, char: 16 }, { line: 3, column: 8, char: 21 },
		], // }}}

	},
};
