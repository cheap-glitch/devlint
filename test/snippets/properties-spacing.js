module.exports = {
	passing: [
		[`
			{
			}
		`,
			'around',
		],
		/* eslint-disable smarter-tabs/smarter-tabs */
		[`
			{

			  "foo": true

			}
		`,
			'around',
		],
		/* eslint-enable smarter-tabs/smarter-tabs */
		[`
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
		/* eslint-disable smarter-tabs/smarter-tabs */
		[`
			{

			  "foo": true,

			  "bar": {
			    "baz": false
			  }

			}
		`,
			'around',
		],
		/* eslint-enable smarter-tabs/smarter-tabs */

		[`
			{
			}
		`,
			'between',
		],
		[`
			{
			  "foo": true
			}
		`,
			'between',
		],
		[`
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
		[`
			{
			  "foo": true,

			  "bar": false
			}
		`,
			'between',
		],
		[`
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
	],

	failing: [
		[['{}', true],      2],
		[['{}', false],     2],
		[['{}', 2],         2],
		[['{}', 'betwixt'], 2],

		[[`
			{
			  "foo": true

			}
		`,
			'around',
		],
			'missing empty line above property key', { line: 2, column: 3, char: 4 }, { line: 2, column: 3, char: 4 },
		],
		[[`
			{

			  "foo": true
			}
		`,
			'around',
		],
			'missing empty line below property value', { line: 3, column: 14, char: 16 }, { line: 3, column: 14, char: 16 },
		],
		[[`
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
		],
		[[`
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
		],

		[[`
			{

			  "foo": true
			}
		`,
			'between',
		],
			'extra empty line above property key', { line: 3, column: 3, char: 5 }, { line: 3, column: 3, char: 5 },
		],
		[[`
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
		],
		[[`
			{
			  "foo": true,
			  "bar": false
			}
		`,
			'between',
		],
			'missing empty line below property value', { line: 2, column: 14, char: 15 }, { line: 2, column: 14, char: 15 },
		],
		[[`
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
		],
	],
};
