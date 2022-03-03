module.exports = {
	passing: {

		'allowed primitives #1': [ // {{{
			'true', [null, true, 2],
		], // }}}

		'allowed primitives #2': [ // {{{
			'25', ['25', 25],
		], // }}}

		'string matching allowed regex': [ // {{{
			'"foo"', ['/^f/'],
		], // }}}

		'string matching allowed regex with escape sequences': [ // {{{
			'"foo?bar/baz"', [String.raw`/^([bf].{2}\??\/?)*$/`],
		], // }}}

		'object matching allowed model #1': [ // {{{
			'{ "foo": true }', [{ foo: Boolean }],
		], // }}}

		'object matching allowed model #2': [ // {{{
			'{ "foo": [{ "bar": "baz" }] }', [{ foo: [{ 'bar': 'baz', 'baz?': false }] }],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['""', false], 2],
		'invalid parameter #2': [['""', 1000], 2],
		'invalid parameter #3': [['""', null], 2],
		// }}}

		'empty list': [[ // {{{
			'false', [],
		],
			'value "false" is not allowed',
		], // }}}

		'unallowed primitives #1': [[ // {{{
			'false', [null, true, 2],
		],
			'value "false" is not allowed',
		], // }}}

		'unallowed primitives #2': [[ // {{{
			'"25"', [25],
		],
			'value "25" is not allowed',
		], // }}}

		'string not matching allowed regex': [[ // {{{
			'"bar"', ['/^f/'],
		],
			'value "bar" is not allowed',
		], // }}}

		'object not matching allowed model #1': [[ // {{{
			'{ "foo": true }', [{ foo: Number }],
		],
			'value "{ "foo": true }" is not allowed', { line: 1, column: 1, char: 0 }, { line: 1, column: 16, char: 15 },
		], // }}}

		'object not matching allowed model #2': [[ // {{{
		`
			{
			  "foo": [
			    { "baz": false }
			  ]
			}
		`,
			[{ foo: [{ 'bar': 'baz', 'baz?': false }] }],
		],
			'value "{ "foo": [ { "baz": false } ] }" is not allowed', { line: 1, column: 1, char: 0 }, { line: 5, column: 2, char: 39 },
		], // }}}

	},
};
