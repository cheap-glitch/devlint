module.exports = {
	passing: {

		'empty object and empty list': [ // {{{
		`
			{
			}
		`,
			[],
		], // }}}

		'empty object and non-empty list': [ // {{{
		`
			{
			}
		`,
			['foo', 'bar'],
		], // }}}

		'one listed property': [ // {{{
		`
			{
			  "foo": 2
			}
		`,
			['foo', 'bar'],
		], // }}}

		'two listed properties': [ // {{{
		`
			{
			  "foo": true,
			  "bar": true
			}
		`,
			['foo', 'bar'],
		], // }}}

		'missing listed property': [ // {{{
		`
			{
			  "foo": true,
			  "baz": true
			}
		`,
			['foo', 'bar', 'baz'],
		], // }}}

		'complex nested object': [ // {{{
		`
			{
			  "a": {
			    "a": "a"
			  },
			  "foo": true,
			  "b": [
			    1,
			    2,
			    3
			  ],
			  "bar": true,
			  "c": "c"
			}
		`,
			['foo', 'bar'],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['{}', 'foo'],                     2],
		'invalid parameter #2': [['{}', { foo: true, bar: false }], 2],
		'invalid parameter #3': [['{}', ['foo', 2, 'bar']],         2],
		// }}}

		'two disordered properties #1': [[ // {{{
		`
			{
			  "foo": true,
			  "bar": true
			}
		`,
			['bar', 'foo'],
		],
			'property "bar" should be placed before "foo"', { line: 3, column: 3, char: 19 }, { line: 3, column: 8, char: 24 },
		], // }}}

		'two disordered properties #2': [[ // {{{
		`
			{
			  "bar": true,
			  "foo": true
			}
		`,
			['foo', 'bar'],
		],
			'property "foo" should be placed before "bar"', { line: 3, column: 3, char: 19 }, { line: 3, column: 8, char: 24 },
		], // }}}

		'three disordered properties': [[ // {{{
		`
			{
			  "foo": true,
			  "baz": true,
			  "bar": true
			}
		`,
			['foo', 'bar', 'baz'],
		],
			'property "bar" should be placed between "foo" and "baz"', { line: 4, column: 3, char: 34 }, { line: 4, column: 8, char: 39 },
		], // }}}

		'three disordered properties and extra listed properties': [[ // {{{
		`
			{
			  "foo": true,
			  "baz": true,
			  "bar": true
			}
		`,
			['foo', 'a', 'bar', 'b', 'c', 'baz'],
		],
			'property "bar" should be placed between "foo" and "baz"', { line: 4, column: 3, char: 34 }, { line: 4, column: 8, char: 39 },
		], // }}}

		'complex nested object': [[ // {{{
		`
			{
			  "a": {
			    "a": false
			  },
			  "bar": [
			    "bar"
			  ],
			  "b": null,
			  "foo": true,
			  "c": "c"
			}
		`,
			['foo', 'bar'],
		],
			'property "foo" should be placed before "bar"', { line: 9, column: 3, char: 72 }, { line: 9, column: 8, char: 77 },
		], // }}}

	},
};
