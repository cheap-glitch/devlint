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

	failing: {
		defaultErrorMessage: 'failed to match property `.foo`',
		snippets: [
			[['{}',                null],                2],
			[['{}',                [true]],              2],
			[['{}',                { foo: true }],      ''],
			[['{ "foo": false }',  { foo: true }],      '',  { line: 1, column: 10, char:  9 }, { line: 1, column: 15, char: 14 }],
			[['{ "foo": false }',  { 'foo?': true }],   '',  { line: 1, column: 10, char:  9 }, { line: 1, column: 15, char: 14 }],
			[['{ "foo": [1, 2] }', { foo: [1, 2, 3] }], '',  { line: 1, column: 10, char:  9 }, { line: 1, column: 16, char: 15 }],
			[['{ "foo": [1, 2] }', { foo: [1] }],       '',  { line: 1, column: 10, char:  9 }, { line: 1, column: 16, char: 15 }],
			[['{ "foo": [1, 2] }', { foo: [1, 0] }],    '',  { line: 1, column: 14, char: 13 }, { line: 1, column: 15, char: 14 }],
			[['{ "foo": "bar" }',  { foo: '/^foo$/' }], '',  { line: 1, column: 10, char:  9 }, { line: 1, column: 15, char: 14 }],
			[['{ "foo": "bar" }',  { foo: '/^foo$/' }], '',  { line: 1, column: 10, char:  9 }, { line: 1, column: 15, char: 14 }],
			[[`
			{
			  "foo": {
			    "bar": [{
			      "baz": true
			    }]
			  }
			}`, { foo: { bar: [{ baz: false }] } }], 'failed to match property`.foo.bar[0].baz', { line: 5, column: 14, char: 41 }, { line: 5, column: 18, char: 45 }],
		]
	},
}
