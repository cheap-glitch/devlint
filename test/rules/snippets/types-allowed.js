module.exports = {
	passing: {

		'boolean': [ // {{{
			'true', ['boolean'],
		], // }}}

		'number': [ // {{{
			'55', ['string', 'number', 'array'],
		], // }}}

		'string': [ // {{{
			'"foo"', ['string'],
		], // }}}

		'array': [ // {{{
			'[]', ['array', 'null'],
		], // }}}

		'object': [ // {{{
			'{ "foo": [] }', ['array', 'object'],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['true', true],          2],
		'invalid parameter #2': [['true', { foo: true }], 2],
		'invalid parameter #3': [['true', ['function']],  2],
		// }}}

		'boolean': [[ // {{{
			'false', ['null'],
		],
			"type of value isn't one of the allowed types",
		], // }}}

		'number': [[ // {{{
			'55', ['string', 'array'],
		],
			"type of value isn't one of the allowed types",
		], // }}}

		'string': [[ // {{{
			'"true"', ['boolean'],
		],
			"type of value isn't one of the allowed types",
		], // }}}

		'empty array': [[ // {{{
			'"[]"', ['array', 'null'],
		],
			"type of value isn't one of the allowed types",
		], // }}}

		'array of strings': [[ // {{{
			'["foo"]', ['string'],
		],
			"type of value isn't one of the allowed types", { line: 1, column: 1, char: 0 }, { line: 1, column: 8, char: 7 },
		], // }}}

		'object': [[ // {{{
			'{ "foo": [] }', ['array'],
		],
			"type of value isn't one of the allowed types", { line: 1, column: 1, char: 0 }, { line: 1, column: 14, char: 13 },
		], // }}}

	},
};
