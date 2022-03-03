module.exports = {
	passing: {

		/* ----- Around ----- */

		'empty object #1': [ // {{{
		`
			{
			}
		`,
			'around',
		], // }}}

		'single property with primitive value and spacing around': [ // {{{
		/* eslint-disable smarter-tabs/smarter-tabs -- JSON start */
		`
			{

			  "foo": true

			}
		`,
			'around',
		/* eslint-enable smarter-tabs/smarter-tabs -- JSON end */
		], // }}}

		'single property with array value and spacing around': [ // {{{
		`
			{

			  "foo": [
			    1,
			    4,
			    66
			  ]

			}
		`,
			'around',
		], // }}}

		'two properties and spacing around': [ // {{{
		/* eslint-disable smarter-tabs/smarter-tabs -- JSON start */
		`
			{

			  "foo": true,

			  "bar": {
			    "baz": false
			  }

			}
		`,
			'around',
		/* eslint-enable smarter-tabs/smarter-tabs -- JSON end */
		], // }}}

		/* ----- Between ----- */

		'empty object #2': [ // {{{
		`
			{
			}
		`,
			'between',
		], // }}}

		'single property with primitive value and no spacing': [ // {{{
		`
			{
			  "foo": true
			}
		`,
			'between',
		], // }}}

		'single property with array value and no spacing': [ // {{{
		`
			{
			  "foo": [
			    1,
			    4,
			    66
			  ]
			}
		`,
			'between',
		], // }}}

		'two properties with primitive values and spacing between': [ // {{{
		`
			{
			  "foo": true,

			  "bar": false
			}
		`,
			'between',
		], // }}}

		'two properties with object values and spacing between': [ // {{{
		`
			{
			  "foo": {
			    "foo": true
			  },

			  "bar": {
			    "baz": false
			  }
			}
		`,
			'between',
		], // }}}

		'properties starting/ending on the same line as their containing object': [ // {{{
		`
			{ "foo": {
			    "foo": true
			  },

			  "bar": {
			    "baz": false
			  } }
		`,
			'between',
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['{}', true], 2],
		'invalid parameter #2': [['{}', false], 2],
		'invalid parameter #3': [['{}', 2], 2],
		'invalid parameter #4': [['{}', 'betwixt'], 2],
		// }}}

		/* ----- Around ----- */

		'single property with primitive value and no spacing above': [[ // {{{
		`
			{
			  "foo": true

			}
		`,
			'around',
		],
			'missing empty line above property key', { line: 2, column: 3, char: 4 }, { line: 2, column: 3, char: 4 },
		], // }}}

		'single property with primitive value and no spacing below': [[ // {{{
		`
			{

			  "foo": true
			}
		`,
			'around',
		],
			'missing empty line below property value', { line: 3, column: 14, char: 16 }, { line: 3, column: 14, char: 16 },
		], // }}}

		'single property with array value and no spacing above': [[ // {{{
		`
			{

			  "foo": [
			    1,
			    4,
			    66
			  ]
			}
		`,
			'around',
		],
			'missing empty line below property value', { line: 7, column: 4, char: 38 }, { line: 7, column: 4, char: 38 },
		], // }}}

		'two properties with no spacing between': [[ // {{{
		`
			{

			  "foo": true,
			  "bar": {
			    "baz": false
			  }

			}
		`,
			'around',
		],
			'missing empty line below property value', { line: 3, column: 14, char: 16 }, { line: 3, column: 14, char: 16 },
		], // }}}

		/* ----- Between ----- */

		'single property with primitive value extra spacing above': [[ // {{{
		`
			{

			  "foo": true
			}
		`,
			'between',
		],
			'extra empty line above property key', { line: 3, column: 3, char: 5 }, { line: 3, column: 3, char: 5 },
		], // }}}

		'single property with array value extra spacing below': [[ // {{{
		`
			{
			  "foo": [
			    1,
			    4,
			    66
			  ]

			}
		`,
			'between',
		],
			'extra empty line below property value', { line: 6, column: 4, char: 37 }, { line: 6, column: 4, char: 37 },
		], // }}}

		'two properties with primitive values and no space between': [[ // {{{
		`
			{
			  "foo": true,
			  "bar": false
			}
		`,
			'between',
		],
			'missing empty line below property value', { line: 2, column: 14, char: 15 }, { line: 2, column: 14, char: 15 },
		], // }}}

		'two properties with primitive values and a blank but non-empty line between': [[ // {{{
		`
			{
			  "foo": true,
			  \t\t
			  "bar": false
			}
		`,
			'between',
		],
			'missing empty line below property value', { line: 2, column: 14, char: 15 }, { line: 2, column: 14, char: 15 },
		], // }}}

		'two properties with object values and no space between': [[ // {{{
		`
			{
			  "foo": {
			    "foo": true
			  },
			  "bar": {
			    "baz": false
			  }
			}
		`,
			'between',
		],
			'missing empty line below property value', { line: 4, column: 4, char: 32 }, { line: 4, column: 4, char: 32 },
		], // }}}

	},
};
