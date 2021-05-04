module.exports = {
	passing: {

		'boolean': [ // {{{
			'false', ['null'],
		], // }}}

		'number': [ // {{{
			'55', ['string', 'array'],
		], // }}}

		'string': [ // {{{
			'"true"', ['boolean'],
		], // }}}

		'empty array': [ // {{{
			'"[]"', ['array', 'null'],
		], // }}}

		'array of strings': [ // {{{
			'["foo"]', ['string'],
		], // }}}

		'object': [ // {{{
			'{ "foo": [] }', ['array'],
		], // }}}

	},

	failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['true', true],          2],
		'invalid parameter #2': [['true', { foo: true }], 2],
		'invalid parameter #3': [['true', ['function']],  2],
		// }}}

		'boolean': [[ // {{{
			'true', ['boolean'],
		],
			'type of value is forbidden',
		], // }}}

		'number': [[ // {{{
			'55', ['string', 'number', 'array'],
		],
			'type of value is forbidden',
		], // }}}

		'string': [[ // {{{
			'"foo"', ['string'],
		],
			'type of value is forbidden',
		], // }}}

		'empty array': [[ // {{{
			'[]', ['array', 'null'],
		],
			'type of value is forbidden', { line: 1, column: 1, char: 0 }, { line: 1, column: 3, char: 2 },
		], // }}}

		'object': [[ // {{{
			'{ "foo": [] }', ['array', 'object'],
		],
			'type of value is forbidden', { line: 1, column: 1, char: 0 }, { line: 1, column: 14, char: 13 },
		], // }}}

	},
};
