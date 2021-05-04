module.exports = {
	passing: {

		'empty object with empty list': [ // {{{
		`
			{
			}
		`,
			[],
		], // }}}

		'non-empty object with empty list': [ // {{{
		`
			{
			  "foo": 0
			}
		`,
			[],
		], // }}}

		'one listed property': [ // {{{
		`
			{
			  "foo": 0
			}
		`,
			['foo'],
		], // }}}

		'one listed property and extra unlisted properties': [ // {{{
		`
			{
			  "foo": 0,
			  "bar": 1,
			  "baz": 2
			}
		`,
			['foo'],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['{}', 'foo'],         2],
		'invalid parameter #2': [['{}', { foo: true }], 2],
		// }}}

		'missing required property': [[ // {{{
		`
			{
			}
		`,
			['foo'],
		],
			'required property "foo" is missing', { line: 1, column: 1, char: 0 }, { line: 2, column: 2, char: 3 },
		], // }}}

		'nested property with same key as missing property': [[ // {{{
		`
			{
			  "bar": {
			    "foo": false
			  }
			}
		`,
			['foo'],
		],
			'required property "foo" is missing', { line: 1, column: 1, char: 0 }, { line: 5, column: 2, char: 35 },
		], // }}}

	},
};
