module.exports = {
	passing: [
		['false',         ['null']],
		['"true"',        ['boolean']],
		['["foo"]',       ['string']],
		['55',            ['string', 'array']],
		['"[]"',          ['array', 'null']],
		['{ "foo": [] }', ['array']],
	],

	failing: [
		[['true',          true],                         2],
		[['true',          { foo: true }],                2],
		[['true',          ['function']],                 2],

		[['true',          ['boolean']],                   'type of value is forbidden'],
		[['"foo"',         ['string']],                    'type of value is forbidden'],
		[['55',            ['string', 'number', 'array']], 'type of value is forbidden'],
		[['[]',            ['array', 'null']],             'type of value is forbidden', { line: 1, column: 1, char: 0 }, { line: 1, column:  3, char:  2 }],
		[['{ "foo": [] }', ['array', 'object']],           'type of value is forbidden', { line: 1, column: 1, char: 0 }, { line: 1, column: 14, char: 13 }],
	],
};
