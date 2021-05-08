module.exports = {
	passing: {

		'empty object and no counts': [ // {{{
		`
			{
			}
		`,
			{},
		], // }}}

		'empty object and minimum count of zero': [ // {{{
		`
			{
			}
		`,
			{ min: 0 },
		], // }}}

		'empty object and maximum count of zero': [ // {{{
		`
			{
			}
		`,
			{ max: 0 },
		], // }}}

		'non-zero minimum count': [ // {{{
		`
			{
			  "a": {},
			  "b": {},
			  "c": {},
			  "d": {},
			  "e": {}
			}
		`,
			{ min: 4 },
		], // }}}

		'non-zero maximum count': [ // {{{
		`
			{
			  "a": {},
			  "b": {},
			  "c": {},
			  "d": {},
			  "e": {}
			}
		`,
			{ min: 5 },
		], // }}}

		'exact count': [ // {{{
		`
			{
			  "foo": 0,
			  "bar": 1,
			  "baz": 2
			}
		`,
			{ min: 3, max: 3 },
		], // }}}

		'nested properties': [ // {{{
		`
			{
			  "a": {
			    "foo": [],
			    "bar": []
			   },
			   "b": {
			    "foo": [],
			    "bar": [],
			    "baz": []
			   }
			}
		`,
			{ min: 2, max: 3 },
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['{}', null],          2],
		'invalid parameter #2': [['{}', 42],            2],
		'invalid parameter #3': [['{}', { count: 42 }], 2],
		'invalid parameter #4': [['{}', { min: true }], 2],
		// }}}

		'property count under minimum #1': [[ // {{{
		`
			{
			  "foo": true
			}
		`,
			{ min: 3 },
		],
			'object has 1 property, minimum is 3',
		], // }}}

		'property count under minimum #2': [[ // {{{
		`
			{
			  "foo": true,
			  "bar": false
			}
		`,
			{ min: 3 },
		],
			'object has 2 properties, minimum is 3',
		], // }}}

		'property count under minimum #3': [[ // {{{
		`
			{
			  "foo": true,
			  "bar": {
			    "baz": true
			  }
			}
		`,
			{ min: 3 },
		],
			'object has 2 properties, minimum is 3',
		], // }}}

		'property count over maximum': [[ // {{{
		`
			{
			  "foo": true,
			  "bar": true,
			  "baz": false
			}
		`,
			{ max: 2 },
		],
			'object has 3 properties, maximum is 2',
		], // }}}

	},
};
