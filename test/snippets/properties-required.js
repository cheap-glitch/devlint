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
			  "foo": 0
			}
		`,
			[],
		],
		[`
			{
			  "foo": 0
			}
		`,
			['foo'],
		],
		[`
			{
			  "foo": 0,
			  "bar": 1,
			  "baz": 2
			}
		`,
			['foo'],
		],
	],

	failing: [
		[['{}', 'foo'],         2],
		[['{}', { foo: true }], 2],

		[[`
			{
			}
		`,
			['foo'],
		],
			'required property "foo" is missing', { line: 1, column: 1, char: 0 }, { line: 2, column: 2, char: 3 },
		],
		[[`
			{
			  "bar": {
			    "foo": false
			  }
			}
		`,
			['foo'],
		],
			'required property "foo" is missing', { line: 1, column: 1, char: 0 }, { line: 5, column: 2, char: 35 },
		],
	],
};
