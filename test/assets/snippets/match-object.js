module.exports = {
	passing: [
		['{}',                            {}],
		['{ "foo": true }',               {}],
		['{ "foo": true }',               { foo: true }],
		['{ "foo": true, "bar": false }', { foo: true }],
		['{}',                            { 'foo?': true }],
		['{ "foo": true }',               { 'foo?': true }],
		['{ "foo": true, "bar": true }',  { foo: true, bar: true }],
		['{ "foo": true }',               { foo: true, 'bar?': false }],
		['{ "foo": [1, 2, 3] }',          { foo: [1, 2, 3] }],
		['{ "foo": [{ "bar": true }] }',  { foo: [{ bar: true }] }],
		['{ "foo": { "bar": false } }',   { foo: { bar: false } }],
		['{ "foo": {} }',                 { foo: { 'bar?': false } }],
		['{ "foo": "bar" }',              { foo: 'bar' }],
		['{ "foo": "bar" }',              { foo: '/^bar$/' }],
		['{ "foo": "bar" }',              { foo: '/^b/' }],
	],

	failing: [
		[['{}',                null],                2],
		[['{}',                [true]],              2],
		[['{}',                { foo: true }],      'failed to match property ".foo"'],
		[['{ "foo": false }',  { foo: true }],      'failed to match property ".foo"',    { line: 1, column: 10, char:  9 }, { line: 1, column: 15, char: 14 }],
		[['{ "foo": false }',  { 'foo?': true }],   'failed to match property ".foo"',    { line: 1, column: 10, char:  9 }, { line: 1, column: 15, char: 14 }],
		[['{ "foo": [1, 2] }', { foo: [1, 2, 3] }], 'failed to match property ".foo"',    { line: 1, column: 10, char:  9 }, { line: 1, column: 16, char: 15 }],
		[['{ "foo": [1, 2] }', { foo: [1] }],       'failed to match property ".foo"',    { line: 1, column: 10, char:  9 }, { line: 1, column: 16, char: 15 }],
		[['{ "foo": [1, 2] }', { foo: [1, 0] }],    'failed to match property ".foo[1]"', { line: 1, column: 14, char: 13 }, { line: 1, column: 15, char: 14 }],
		[['{ "foo": "bar" }',  { foo: '/^foo$/' }], 'failed to match property ".foo"',    { line: 1, column: 10, char:  9 }, { line: 1, column: 15, char: 14 }],
		[['{ "foo": "bar" }',  { foo: '/^foo$/' }], 'failed to match property ".foo"',    { line: 1, column: 10, char:  9 }, { line: 1, column: 15, char: 14 }],
		[[`
			{
			  "foo": {
			    "bar": [{
			      "baz": true
			    }]
			  }
			}
		`,
			{ foo: { bar: [{ baz: false }] } },
		],
			'failed to match property ".foo.bar[0].baz"', { line: 4, column: 14, char: 40 }, { line: 4, column: 18, char: 44 },
		],
	],
};
