module.exports = {
	passing: {

		'empty object': [ // {{{
		`
			{
			}
		`,
		], // }}}

		'object with one property': [ // {{{
		`
			{
			  "foo": true
			}
		`,
		], // }}}

		'object with two properties': [ // {{{
		`
			{
			  "foo": true,
			  "bar": false
			}
		`,
		], // }}}

		'parent and child properties with same key': [ // {{{
		`
			{
			  "foo": {
			    "foo": true
			  }
			}
		`,
		], // }}}

		'nested properties with same key': [ // {{{
		`
			{
			  "foo": {
			    "baz": true
			  },
			  "bar": {
			    "baz": 0
			  }
			}
		`,
		], // }}}

	}, failing: {

		'adjacent duplicated keys': [[ // {{{
		`
			{
			  "foo": true,
			  "foo": false
			}
		`,
		],
			'duplicated property "foo"', { line: 3, column: 3, char: 19 }, { line: 3, column: 8, char: 24 },
		], // }}}

		'non-adjacent duplicated keys': [[ // {{{
		`
			{
			  "foo": {
			    "bar": false,
			    "baz": 0,
			    "bar": []
			  }
			}
		`,
		],
			'duplicated property "bar"', { line: 5, column: 5, char: 49 }, { line: 5, column: 10, char: 54 },
		], // }}}

	},
};
