module.exports = {
	passing: {

		/* ----- Alphabetical ----- */

		'empty array #1': [ // {{{
		`
			[]
		`,
			'alphabetical',
		], // }}}

		'single-character strings': [ // {{{
		`
			[
			  "a",
			  "b",
			  "c"
			]
		`,
			'alphabetical',
		], // }}}

		'strings': [ // {{{
		`
			[
			  "alpacaWool",
			  "forestFire",
			  "zombieZoos"
			]
		`,
			'alphabetical',
		], // }}}

		'numbers': [ // {{{
		`
			[
			  1,
			  2,
			  3,
			  10,
			  100
			]
		`,
			'alphabetical',
		], // }}}

		'numerical strings': [ // {{{
		`
			[
			    "1",
			   "02",
			   "03",
			   "10",
			  "100"
			]
		`,
			'alphabetical',
		], // }}}

		'other elements': [ // {{{
		`
			[
			  "a",
			  {
			    "b": 0,
			    "a": 1
			  },
			  "z"
			]
		`,
			'alphabetical',
		], // }}}

		/* ----- Alphabetical blocks ----- */

		'empty array #2': [ // {{{
		`
			[]
		`,
			'alphabetical-blocks',
		], // }}}

		'grouped elements #1': [ // {{{
		`
			[
			  "a",
			  "d",

			  "b",
			  "c",

			  "a",
			  "z"
			]
		`,
			'alphabetical-blocks',
		], // }}}

		'grouped elements #2': [ // {{{
		`
			[
			  "a",
			  [
			    true,
			    false,
			    false
			  ],
			  "d",

			  {
			    "foo": 1,
			    "bar": 100
			  },
			  [
			    1,
			    2,
			    3
			  ],
			  "b",

			  "a",
			  "z"
			]
		`,
			'alphabetical-blocks',
		], // }}}

	}, failing: {

		/* ----- Alphabetical ----- */

		// invalid parameters {{{
		'invalid parameter #1': [['[]', ['alphabetical']], 2],
		'invalid parameter #2': [['[]', { alphabetical: true }], 2],
		'invalid parameter #3': [['[]', 'alphabet'], 2],
		// }}}

		'single-character strings': [[ // {{{
		`
			[
			  "b",
			  "a"
			]
		`,
			'alphabetical',
		],
			'element "a" is not in alphabetical order', { line: 3, column: 3, char: 11 }, { line: 3, column: 6, char: 14 },
		], // }}}

		'numbers': [[ // {{{
		`
			[10, 5]
		`,
			'alphabetical',
		],
			'element 5 is not in alphabetical order', { line: 1, column: 6, char: 5 }, { line: 1, column: 7, char: 6 },
		], // }}}

		'numerical strings': [[ // {{{
		`
			[
			  "10",
			   "5"
			]
		`,
			'alphabetical',
		],
			'element "5" is not in alphabetical order', { line: 3, column: 4, char: 13 }, { line: 3, column: 7, char: 16 },
		], // }}}

		'other elements': [[ // {{{
		`
			[
			  "b",
			  [
			    1,
			    2,
			    3
			  ],
			  "a",
			  "c",
			  {
			    "foo": null
			  }
			]
		`,
			'alphabetical',
		],
			'element "a" is not in alphabetical order', { line: 8, column: 3, char: 40 }, { line: 8, column: 6, char: 43 },
		], // }}}

		/* ----- Alphabetical blocks ----- */

		'grouped elements #1': [[ // {{{
		`
			[
			  "a",
			  "d",

			  "b",
			  "c",
			  "a",
			  "z"
			]
		`,
			'alphabetical-blocks',
		],
			'element "a" is not in alphabetical order', { line: 7, column: 3, char: 33 }, { line: 7, column: 6, char: 36 },
		], // }}}

		'grouped elements #2': [[ // {{{
		`
			[
			  "a",
			  [
			    1,
			    2,
			    3
			  ],
			  "d",

			  "b",
			  {},
			  "c",
			  [
			    {
			      "foo": 1
			    },
			    {
			      "foo": 2
			    }
			  ],
			  "a",
			  "z"
			]
		`,
			'alphabetical-blocks',
		],
			'element "a" is not in alphabetical order', { line: 21, column: 3, char: 132 }, { line: 21, column: 6, char: 135 },
		], // }}}

	},
};
