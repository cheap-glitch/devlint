module.exports = {
	passing: {

		'empty array and empty list': [ // {{{
		`
			[
			]
		`,
			[],
		], // }}}

		'non-empty array and empty list': [ // {{{
		`
			[
			  "foo",
			  "bar"
			]
		`,
			[],
		], // }}}

		'extra unlisted properties': [ // {{{
		`
			[
			  true,
			  42,
			  "foo",
			  "bar"
			]
		`,
			['bar', 42],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['[]', null],             2],
		'invalid parameter #2': [['[]', false],            2],
		'invalid parameter #3': [['[]', { 'foo': false }], 2],
		// }}}

		'empty array and non-empty list': [[ // {{{
		`
			[
			]
		`,
			[1, 2, 3],
		],
			'required element "1" is missing', { line: 1, column: 1, char: 0 }, { line: 2, column: 2, char: 3 },
		], // }}}

		'extra unlisted properties': [[ // {{{
		`
			[
			  true,
			  42,
			  "foo",
			  "bar"
			]
		`,
			['baz', false],
		],
			'required element "baz" is missing', { line: 1, column: 1, char: 0 }, { line: 6, column: 2, char: 34 },
		], // }}}

		'non-matching object': [[ // {{{
		`
			[
			  {},
			  {
			    "foo": [1, 2, 4]
			  }
			]
		`,
			[{}, { foo: [1, 2, 3] }],
		],
			'required element "{"foo":[1,2,3]}" is missing', { line: 1, column: 1, char: 0 }, { line: 6, column: 2, char: 38 },
		], // }}}

	},
};
