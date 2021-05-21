module.exports = {
	passing: {

		'empty object and empty model': [ // {{{
			'{}', {},
		], // }}}

		'non-empty object and empty model': [ // {{{
			'{ "foo": true }', {},
		], // }}}

		'same object and model with primitive values #1': [ // {{{
			'{ "foo": true }', { foo: true },
		], // }}}

		'same object and model with primitive values #2': [ // {{{
			'{ "foo": true, "bar": true }', { foo: true, bar: true },
		], // }}}

		'same object and model with array value': [ // {{{
			'{ "foo": [1, 2, 3] }', { foo: [1, 2, 3] },
		], // }}}

		'same object and model with object value': [ // {{{
			'{ "foo": { "bar": false } }', { foo: { bar: false } },
		], // }}}

		'same object and model with object inside array value': [ // {{{
			'{ "foo": [{ "bar": true }] }', { foo: [{ bar: true }] },
		], // }}}

		'object with one extra property': [ // {{{
			'{ "foo": true, "bar": false }', { foo: true },
		], // }}}

		'empty object and model with one optional property': [ // {{{
			'{}', { 'foo?': true },
		], // }}}

		'matching object and model with one optional property': [ // {{{
			'{ "foo": true }', { 'foo?': true },
		], // }}}

		'matching object with one property and model with one extra optional property': [ // {{{
			'{ "foo": true }', { foo: true, 'bar?': false },
		], // }}}

		'matching object with empty object value and model with one nested optional property': [ // {{{
			'{ "foo": {} }', { foo: { 'bar?': false } },
		], // }}}

		'matching exact string values': [ // {{{
			'{ "foo": "bar" }', { foo: 'bar' },
		], // }}}

		'matching string value and regex in model #1': [ // {{{
			'{ "foo": "bar" }', { foo: '/^bar$/' },
		], // }}}

		'matching string value and regex in model #2': [ // {{{
			'{ "foo": "bar" }', { foo: '/^b/' },
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['{}', null],   2],
		'invalid parameter #2': [['{}', [true]], 2],
		// }}}

		'empty object and non-empty model': [[ // {{{
			'{}', { foo: true },
		],
			'failed to match property "foo"',
		], // }}}

		'non-matching property values': [[ // {{{
			'{ "foo": false }', { foo: true },
		],
			'failed to match property "foo"', { line: 1, column: 10, char: 9 }, { line: 1, column: 15, char: 14 },
		], // }}}

		'non-matching optional property values': [[ // {{{
			'{ "foo": false }', { 'foo?': true },
		],
			'failed to match property "foo"', { line: 1, column: 10, char: 9 }, { line: 1, column: 15, char: 14 },
		], // }}}

		'non-matching array values #1': [[ // {{{
			'{ "foo": [1, 2] }', { foo: [1, 2, 3] },
		],
			'failed to match property "foo"', { line: 1, column: 10, char: 9 }, { line: 1, column: 16, char: 15 },
		], // }}}

		'non-matching array values #2': [[ // {{{
			'{ "foo": [1, 2] }', { foo: [1] },
		],
			'failed to match property "foo"', { line: 1, column: 10, char: 9 }, { line: 1, column: 16, char: 15 },
		], // }}}

		'non-matching array values #3': [[ // {{{
			'{ "foo": [1, 2] }', { foo: [1, 0] },
		],
			'failed to match property "foo.[1]"', { line: 1, column: 14, char: 13 }, { line: 1, column: 15, char: 14 },
		], // }}}

		'non-matching string and regex #1': [[ // {{{
			'{ "foo": "bar" }', { foo: '/^foo$/' },
		],
			'failed to match property "foo"', { line: 1, column: 10, char: 9 }, { line: 1, column: 15, char: 14 },
		], // }}}

		'non-matching string and regex #2': [[ // {{{
			'{ "foo": "bar" }', { foo: '/^foo$/' },
		],
			'failed to match property "foo"', { line: 1, column: 10, char: 9 }, { line: 1, column: 15, char: 14 },
		], // }}}

		'multi-line object': [[ // {{{
		`
			{
			  "foo": {
			    "bar": [{
			      "baz": true
			    }]
			  }
			}
		`,
			{ foo: { bar: [{ baz: false }] } },
		],
			'failed to match property "foo.bar.[0].baz"', { line: 4, column: 14, char: 40 }, { line: 4, column: 18, char: 44 },
		], // }}}

	},
};
