module.exports = {
	passing: [
		[`
			{
			}
		`],
		[`
			{
			  "foo": true
			}
		`],
		[`
			{
			  "foo": {
			    "foo": true
			  }
			}
		`],
		[`
			{
			  "foo": true,
			  "bar": false
			}
		`],
		[`
			{
			  "foo": {
			    "baz": true
			  },
			  "bar": {
			    "baz": 0
			  }
			}
		`],
	],

	failing: [
		[[`
			{
			  "foo": true,
			  "foo": false
			}
		`],
			'duplicated property "foo"', { line: 3, column: 3, char: 19 }, { line: 3, column: 8, char: 24 },
		],
		[[`
			{
			  "foo": {
			    "bar": false,
			    "baz": 0,
			    "bar": []
			  }
			}
		`],
			'duplicated property "bar"', { line: 5, column: 5, char: 49 }, { line: 5, column: 10, char: 54 },
		],
	],
};
