module.exports = {
	passing: [
		[`
			{
			}
		`,
			[],
		],
		[`
			{
			}
		`,
			['foo', 'bar'],
		],
		[`
			{
			  "foo": 2
			}
		`,
			['foo', 'bar'],
		],
		[`
			{
			  "foo": true,
			  "bar": true
			}
		`,
			['foo', 'bar'],
		],
		[`
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
		],
		[`
			{
			  "foo": true,
			  "baz": true
			}
		`,
			['foo', 'bar', 'baz'],
		],
	],

	failing: [
		[['{}', 'foo'],                     2],
		[['{}', { foo: true, bar: false }], 2],
		[['{}', ['foo', 2, 'bar']],         2],

		[[`
			{
			  "foo": true,
			  "bar": true
			}
		`,
			['bar', 'foo'],
		],
			'property "bar" should be placed before "foo"', { line: 3, column: 3, char: 19 }, { line: 3, column: 8, char: 24 },
		],
		[[`
			{
			  "bar": true,
			  "foo": true
			}
		`,
			['foo', 'bar'],
		],
			'property "foo" should be placed before "bar"', { line: 3, column: 3, char: 19 }, { line: 3, column: 8, char: 24 },
		],
		[[`
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
		],
		[[`
			{
			  "foo": true,
			  "baz": true,
			  "bar": true
			}
		`,
			['foo', 'bar', 'baz'],
		],
			'property "bar" should be placed between "foo" and "baz"', { line: 4, column: 3, char: 34 }, { line: 4, column: 8, char: 39 },
		],
		[[`
			{
			  "foo": true,
			  "baz": true,
			  "bar": true
			}
		`,
			['foo', 'a', 'bar', 'b', 'c', 'baz'],
		],
			'property "bar" should be placed between "foo" and "baz"', { line: 4, column: 3, char: 34 }, { line: 4, column: 8, char: 39 },
		],
	],
};
