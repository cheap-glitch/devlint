module.exports = {
	passing: [
		['{}', 'alphabetical'],
		['{}', 'alphabetical-blocks'],

		[`
			{
			  "a": true,
			  "b": true,
			  "c": true
			}
		`,
			'alphabetical',
		],
		[`
			{
			  "alpacaWool": true,
			  "forestFire": true,
			  "zombieZoos": true
			}
		`,
			'alphabetical',
		],
		[`
			{
			    "1": true,
			   "02": true,
			   "03": true,
			   "10": true,
			  "100": true
			}
		`,
			'alphabetical',
		],
		[`
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
		],

		[`
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
		[`
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
		],
	],

	failing: [
		[['{}', ['alphabetical']],       2],
		[['{}', { alphabetical: true }], 2],
		[['{}', 'alphabet'],             2],

		[[`
			{
			  "b": true,
			  "a": false
			}
		`,
			'alphabetical',
		],
			'property "a" is not in alphabetical order', { line: 3, column: 3, char: 17 }, { line: 3, column: 6, char: 20 },
		],
		[[`
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
		],
		[[`
			{
			  "10": true,
			   "5": false
			}
		`,
			'alphabetical',
		],
			'property "5" is not in alphabetical order', { line: 3, column: 4, char: 19 }, { line: 3, column: 7, char: 22 },
		],

		[[`
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
		],
		[[`
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
		],
	],
};
