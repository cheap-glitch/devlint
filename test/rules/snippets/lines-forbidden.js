module.exports = {
	passing: {

		'empty text and empty list': [ // {{{
		`
		`,
			[],
		], // }}}

		'empty text and non-empty list': [ // {{{
		`
		`,
			['foo', 'bar'],
		], // }}}

		'non-matching verbatim lines': [ // {{{
		`
			foo, bar
			lorem ipsum
		`,
			['foobar', 'baz'],
		], // }}}

		'non-matching regex patterns': [ // {{{
		`
			foo, bar
			lorem ipsum
		`,
			['/^ipsum/', '/foo[!?]/'],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['', null],     2],
		'invalid parameter #2': [['', 'foobar'], 2],
		'invalid parameter #3': [['', [44]],     2],
		// }}}

		'non-matching verbatim line': [[ // {{{
		`
			foo, bar
			lorem ipsum
		`,
			['foobar', 'baz', 'foo, bar'],
		],
			'line "foo, bar" is forbidden', { line: 1, column: 1, char: 0 }, { line: 1, column: 9, char: 8 },
		], // }}}

		'matching verbatim sentence': [[ // {{{
		`
			Lorem ipsum dolor sit amet,  consectetur adipiscing elit. Si verbum sequimur,
			primum  longius verbum  praepositum  quam bonum.  Teneo,  inquit, finem  illi
			videri nihil dolere. Non laboro, inquit,  de nomine. Aliter enim nosmet ipsos
			nosse non possumus.
		`,
			['videri nihil dolere. Non laboro, inquit,  de nomine. Aliter enim nosmet ipsos'],
		],
			'line "videri nihil dolere. Non […]" is forbidden', { line: 3, column: 1, char: 156 }, { line: 3, column: 78, char: 233 },
		], // }}}

		'matching regex pattern': [[ // {{{
		`
			foo, bar
			lorem ipsum
		`,
			['/ipsum$/', '/foo[!?]/'],
		],
			'line "lorem ipsum" is forbidden', { line: 2, column: 1, char: 9 }, { line: 2, column: 12, char: 20 },
		], // }}}

	},
};
