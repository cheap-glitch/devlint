module.exports = {
	passing: {

		/* ----- Alphabetical ----- */

		'empty object #1': [ // {{{
		`
			{
			}
		`,
			'alphabetical',
		], // }}}

		'properties with single-character keys': [ // {{{
		`
			{
			  "a": true,
			  "b": true,
			  "c": true
			}
		`,
			'alphabetical',
		], // }}}

		'properties with longer keys': [ // {{{
		`
			{
			  "alpacaWool": true,
			  "forestFire": true,
			  "zombieZoos": true
			}
		`,
			'alphabetical',
		], // }}}

		'properties with numerical keys': [ // {{{
		`
			{
			    "1": true,
			   "02": true,
			   "03": true,
			   "10": true,
			  "100": true
			}
		`,
			'alphabetical',
		], // }}}

		'nested properties with single-character keys': [ // {{{
		`
			{
			  "a": true,
			  "f": {
			    "b": 0,
			    "a": 1
			  },
			  "z": true
			}
		`,
			'alphabetical',
		], // }}}

		/* ----- Alphabetical blocks ----- */

		'empty object #2': [ // {{{
		`
			{
			}
		`,
			'alphabetical-blocks',
		], // }}}

		'grouped properties with single-character keys': [ // {{{
		`
			{
			  "a": true,
			  "d": "foo",

			  "b": {},
			  "c": [],

			  "a": null,
			  "z": false
			}
		`,
			'alphabetical-blocks',
		], // }}}

		'grouped properties with single-character keys and complex values': [ // {{{
		`
			{
			  "a": [
			    true,
			    false,
			    false
			  ],
			  "d": "foo",

			  "b": {
			    "foo": 1,
			    "bar": 100
			  },
			  "c": [
			    1,
			    2,
			    3
			  ],
			  "d": "d",

			  "a": null,
			  "z": false
			}
		`,
			'alphabetical-blocks',
		], // }}}

	}, failing: {

		/* ----- Alphabetical ----- */

		// invalid parameters {{{
		'invalid parameter #1': [['{}', ['alphabetical']],       2],
		'invalid parameter #2': [['{}', { alphabetical: true }], 2],
		'invalid parameter #3': [['{}', 'alphabet'],             2],
		// }}}

		'properties with single-character keys': [[ // {{{
		`
			{
			  "b": true,
			  "a": false
			}
		`,
			'alphabetical',
		],
			'property "a" is not in alphabetical order', { line: 3, column: 3, char: 17 }, { line: 3, column: 6, char: 20 },
		], // }}}

		'properties with single-character keys and complex values': [[ // {{{
		`
			{
			  "b": [
			    1,
			    2,
			    3
			  ],
			  "a": true,
			  "c": {
			    "foo": null
			  }
			}
		`,
			'alphabetical',
		],
			'property "a" is not in alphabetical order', { line: 7, column: 3, char: 38 }, { line: 7, column: 6, char: 41 },
		], // }}}

		'properties with numerical keys': [[ // {{{
		`
			{
			  "10": true,
			   "5": false
			}
		`,
			'alphabetical',
		],
			'property "5" is not in alphabetical order', { line: 3, column: 4, char: 19 }, { line: 3, column: 7, char: 22 },
		], // }}}

		/* ----- Alphabetical blocks ----- */

		'grouped properties with single-character keys': [[ // {{{
		`
			{
			  "a": true,
			  "d": "foo",

			  "b": {},
			  "c": [],
			  "a": null,
			  "z": false
			}
		`,
			'alphabetical-blocks',
		],
			'property "a" is not in alphabetical order', { line: 7, column: 3, char: 54 }, { line: 7, column: 6, char: 57 },
		], // }}}

		'grouped properties with single-character keys and complex values': [[ // {{{
		`
			{
			  "a": [
			    1,
			    2,
			    3
			  ],
			  "d": "foo",

			  "b": {},
			  "c": [
			    {
			      "foo": 1
			    },
			    {
			      "foo": 2
			    }
			  ],
			  "a": null,
			  "z": false
			}
		`,
			'alphabetical-blocks',
		],
			'property "a" is not in alphabetical order', { line: 18, column: 3, char: 133 }, { line: 18, column: 6, char: 136 },
		], // }}}

	},
};
