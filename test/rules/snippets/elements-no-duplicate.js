module.exports = {
	passing: {

		'empty array': [ // {{{
		`
			[
			]
		`], // }}}

		'numbers array': [ // {{{
		`
			[
			  45,
			  12,
			  88
			]
		`], // }}}

		'strings array': [ // {{{
		`
			[
			  "foo",
			  "bar",
			  "baz"
			]
		`], // }}}

		'mixed array': [ // {{{
		`
			[
			  [],
			  "foo",
			  null,
			  2,
			  {},
			  568,
			  {
			    "foo": true
			  },
			  ["foo"],
			  "bar",
			  []
			]
		`], // }}}

	}, failing: {

		'duplicated number': [[ // {{{
		`
			[
			  1,
			  1
			]
		`],
			'duplicated element 1', { line: 3, column: 3, char: 9 }, { line: 3, column: 4, char: 10 },
		], // }}}

		'duplicated string': [[ // {{{
		`
			[
			  "foo",
			  "bar",
			  "foo"
			]
		`],
			'duplicated element "foo"', { line: 4, column: 3, char: 22 }, { line: 4, column: 8, char: 27 },
		], // }}}

		'duplicated `null` value': [[ // {{{
		`
			[
			  {},
			  null,
			  [],
			  null,
			  "foo"
			]
		`],
			'duplicated element null', { line: 5, column: 3, char: 24 }, { line: 5, column: 7, char: 28 },
		], // }}}

	},
};
