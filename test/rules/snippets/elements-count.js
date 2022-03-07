module.exports = {
	passing: {

		'empty array and no counts': [ // {{{
		`
			[]
		`,
			{},
		], // }}}

		'empty array and minimum count of zero': [ // {{{
		`
			[]
		`,
			{ min: 0 },
		], // }}}

		'empty array and maximum count of zero': [ // {{{
		`
			[]
		`,
			{ max: 0 },
		], // }}}

		'non-zero minimum count': [ // {{{
		`
			[
			  1,
			  2,
			  3,
			  4,
			  5
			]
		`,
			{ min: 4 },
		], // }}}

		'non-zero maximum count': [ // {{{
		`
			[
			  1,
			  2,
			  3,
			  4,
			  5
			]
		`,
			{ min: 5 },
		], // }}}

		'exact count': [ // {{{
		`
			[
			  "foo",
			  "bar",
			  "baz"
			]
		`,
			{ min: 3, max: 3 },
		], // }}}

		'nested arrays': [ // {{{
		`
			[
			  [
			    [],
			    []
			  ],
			  [
			    [],
			    [],
			    []
			  ]
			]
		`,
			{ min: 2, max: 3 },
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['[]', null], 2],
		'invalid parameter #2': [['[]', 42], 2],
		'invalid parameter #3': [['[]', { count: 42 }], 2],
		'invalid parameter #4': [['[]', { min: true }], 2],
		// }}}

		'element count under minimum #1': [[ // {{{
		`
			[1]
		`,
			{ min: 3 },
		],
			'array has 1 element, minimum is 3', { line: 1, column: 1, char: 0 }, { line: 1, column: 4, char: 3 },
		], // }}}

		'element count under minimum #2': [[ // {{{
		`
			["foo", "bar"]
		`,
			{ min: 3 },
		],
			'array has 2 elements, minimum is 3', { line: 1, column: 1, char: 0 }, { line: 1, column: 15, char: 14 },
		], // }}}

		'element count under minimum #3': [[ // {{{
		`
			[
			  "foo",
			  {
			    "baz": true
			  }
			]
		`,
			{ min: 3 },
		],
			'array has 2 elements, minimum is 3', { line: 1, column: 1, char: 0 }, { line: 6, column: 2, char: 36 },
		], // }}}

		'element count over maximum': [[ // {{{
		`
			[
			  "foo",
			  "bar",
			  "baz"
			]
		`,
			{ max: 2 },
		],
			'array has 3 elements, maximum is 2', { line: 1, column: 1, char: 0 }, { line: 5, column: 2, char: 29 },
		], // }}}

	},
};
