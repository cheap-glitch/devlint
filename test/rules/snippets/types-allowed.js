module.exports = {
	passing: {

		boolean: [ // {{{
			'true', ['boolean'],
		], // }}}

		number: [ // {{{
			'55', ['string', 'number', 'array'],
		], // }}}

		string: [ // {{{
			'"foo"', ['string'],
		], // }}}

		array: [ // {{{
			'[]', ['array', 'null'],
		], // }}}

		object: [ // {{{
			'{ "foo": [] }', ['array', 'object'],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['true', true], 2],
		'invalid parameter #2': [['true', { foo: true }], 2],
		'invalid parameter #3': [['true', ['function']], 2],
		'invalid parameter #4': [['true', [Function]], 2],
		// }}}

		'boolean': [[ // {{{
			'false', ['null'],
		],
			'"boolean" type is not allowed',
		], // }}}

		'number': [[ // {{{
			'55', ['string', 'array'],
		],
			'"number" type is not allowed',
		], // }}}

		'string': [[ // {{{
			'"true"', ['boolean'],
		],
			'"string" type is not allowed',
		], // }}}

		'empty array': [[ // {{{
			'[]', ['object', 'null'],
		],
			'"array" type is not allowed', { line: 1, column: 1, char: 0 }, { line: 1, column: 3, char: 2 },
		], // }}}

		'array of strings': [[ // {{{
			'["foo"]', ['string'],
		],
			'"array" type is not allowed', { line: 1, column: 1, char: 0 }, { line: 1, column: 8, char: 7 },
		], // }}}

		'object': [[ // {{{
			'{ "foo": [] }', ['array'],
		],
			'"object" type is not allowed', { line: 1, column: 1, char: 0 }, { line: 1, column: 14, char: 13 },
		], // }}}

	},
};
