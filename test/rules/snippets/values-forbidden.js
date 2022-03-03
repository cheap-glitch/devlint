module.exports = {
	passing: {

		'empty list': [ // {{{
			'false', [],
		], // }}}

		'unlisted primitive value #1': [ // {{{
			'false', [null, true, 2],
		], // }}}

		'unlisted primitive value #2': [ // {{{
			'"25"', [25],
		], // }}}

		'string not matching forbidden regex': [ // {{{
			'"bar"', ['/[zt]$/'],
		], // }}}

		'object not matching forbidden model #1': [ // {{{
			'{ "foo": true }', [{ foo: Number }],
		], // }}}

		'object not matching forbidden model #2': [ // {{{
		`
			{
			  "foo": [
			    { "baz": false }
			  ]
			}
		`,
			[{ foo: [{ 'bar': 'baz', 'baz?': false }] }],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['""', false], 2],
		'invalid parameter #2': [['""', 1000], 2],
		'invalid parameter #3': [['""', null], 2],
		// }}}

		'forbidden primitive value #1': [[ // {{{
			'true', [null, true, 2],
		],
			'value "true" is forbidden',
		], // }}}

		'forbidden primitive value #2': [[ // {{{
			'25', ['25', 25],
		],
			'value "25" is forbidden',
		], // }}}

		'string matching forbidden regex': [[ // {{{
			'"foo"', ['/^f/'],
		],
			'value "foo" is forbidden',
		], // }}}

		'string matching forbidden regex with escape sequences': [[ // {{{
			'"foo?bar/baz"', [String.raw`/^([bf].{2}\??\/?)*$/`],
		],
			'value "foo?bar/baz" is forbidden',
		], // }}}

		'object matching forbidden model #1': [[ // {{{
			'{ "foo": true }', [{ foo: Boolean }],
		],
			'value "{ "foo": true }" is forbidden', { line: 1, column: 1, char: 0 }, { line: 1, column: 16, char: 15 },
		], // }}}

		'object matching forbidden model #2': [[ // {{{
		`
			{
			  "foo": [
			    { "bar": "baz" }
			  ]
			}
		`,
			[{ foo: [{ 'bar': 'baz', 'baz?': false }] }],
		],
			'value "{ "foo": [ { "bar": "baz" } ] }" is forbidden', { line: 1, column: 1, char: 0 }, { line: 5, column: 2, char: 39 },
		], // }}}

	},
};
