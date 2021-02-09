module.exports = {
	passing: [
		['true',          ['boolean']],
		['"foo"',         ['string']],
		['55',            ['string', 'number', 'array']],
		['[]',            ['array', 'null']],
		['{ "foo": [] }', ['array', 'object']],
	],

	failing: [
		[['true',          true],                2],
		[['true',          { foo: true }],       2],
		[['true',          ['function']],        2],

		[['false',         ['null']],            "type of value isn't one of the allowed types"],
		[['"true"',        ['boolean']],         "type of value isn't one of the allowed types"],
		[['["foo"]',       ['string']],          "type of value isn't one of the allowed types", { line: 1, column: 1, char: 0 }, { line: 1, column:  8, char:  7 }],
		[['55',            ['string', 'array']], "type of value isn't one of the allowed types"],
		[['"[]"',          ['array', 'null']],   "type of value isn't one of the allowed types"],
		[['{ "foo": [] }', ['array']],           "type of value isn't one of the allowed types", { line: 1, column: 1, char: 0 }, { line: 1, column: 14, char: 13 }],
	],
};
