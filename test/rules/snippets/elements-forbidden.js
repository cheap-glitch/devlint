module.exports = {
	passing: {

		'empty array and empty list': [ // {{{
			'[]', [],
		], // }}}

		'non-empty array and empty list #1': [ // {{{
			'[1, true, null]', [],
		], // }}}

		'non-empty array and empty list #2': [ // {{{
			'["foo", "bar", "baz"]', [],
		], // }}}

		'empty array and non-empty list': [ // {{{
			'[]', ['foo'],
		], // }}}

		'non-matching primitives': [ // {{{
			'[1, true, null]', ['foo'],
		], // }}}

		'non-matching strings': [ // {{{
			'["foo", "baz"]', [null, false, 2, 'bar'],
		], // }}}

		'non-matching object #1': [ // {{{
			'[{}]', [{ foo: true }],
		], // }}}

		'non-matching object #2': [ // {{{
			'[{ "bar": true }]', [{ foo: true }],
		], // }}}

		'non-matching object #3': [ // {{{
			'[{ "foo": false }]', [{ foo: true }],
		], // }}}

		'non-matching object #4': [ // {{{
			'[{ "foo": [false] }]', [{ foo: [true] }],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['[]', null], 2],
		'invalid parameter #2': [['[]', 1], 2],
		'invalid parameter #3': [['[]', {}], 2],
		// }}}

		'forbidden number element': [[ // {{{
		`
			[
			  1,
			  2,
			  3
			]
		`,
			[1],
		],
			'element "1" is forbidden', { line: 2, column: 3, char: 4 }, { line: 2, column: 4, char: 5 },
		], // }}}

		'forbidden string element': [[ // {{{
		`
			[
			  "1",
			  "2",
			  "3"
			]
		`,
			['1'],
		],
			'element "1" is forbidden', { line: 2, column: 3, char: 4 }, { line: 2, column: 6, char: 7 },
		], // }}}

		'forbidden simple array element': [[ // {{{
		`
			[
			  [true],
			  [false]
			]
		`,
			[[false]],
		],
			'element "[ false ]" is forbidden', { line: 3, column: 3, char: 14 }, { line: 3, column: 10, char: 21 },
		], // }}}

		'forbidden nested array element': [[ // {{{
		`
			[
			  [0, [1, [2]]]
			]
		`,
			[[0, [1, [2]]]],
		],
			'element "[ 0, [ 1, [ 2 ] ] ]" is forbidden', { line: 2, column: 3, char: 4 }, { line: 2, column: 16, char: 17 },
		], // }}}

		'forbidden object element': [[ // {{{
		`
			[
			  {},
			  {
			    "foo": 2
			  },
			  {
			    "foo": "bar"
			  }
			]
		`,
			[{ foo: 2 }],
		],
			'element "{ "foo": 2 }" is forbidden', { line: 3, column: 3, char: 10 }, { line: 5, column: 4, char: 28 },
		], // }}}

	},
};
