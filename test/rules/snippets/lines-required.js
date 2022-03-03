module.exports = {
	passing: {

		'empty text and empty list': [ // {{{
		`
		`,
			[],
		], // }}}

		'matching verbatim sentence': [ // {{{
		`
			Lorem ipsum dolor sit amet,  consectetur adipiscing elit. Si verbum sequimur,
			primum  longius verbum  praepositum  quam bonum.  Teneo,  inquit, finem  illi
			videri nihil dolere. Non laboro, inquit,  de nomine. Aliter enim nosmet ipsos
			nosse non possumus.
		`,
			['videri nihil dolere. Non laboro, inquit,  de nomine. Aliter enim nosmet ipsos'],
		], // }}}

		'matching regex pattern': [ // {{{
		`
			foo, bar
			lorem ipsum
		`,
			['/ipsum$/', '/foo[!?,]/'],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['', null], 2],
		'invalid parameter #2': [['', 'foobar'], 2],
		'invalid parameter #3': [['', [44]], 2],
		// }}}

		'empty text and non-empty list': [[ // {{{
		`
		`,
			['foo', 'bar'],
		],
			'required line "foo" is missing',
		], // }}}

		'non-matching verbatim lines': [[ // {{{
		`
			foo, bar
			lorem ipsum
		`,
			['foobar', 'baz'],
		],
			'required line "foobar" is missing',
		], // }}}

		'non-matching regex patterns': [[ // {{{
		`
			foo, bar
			lorem ipsum
		`,
			['/^ipsum/', '/foo[!?]/'],
		],
			'required line "/^ipsum/" is missing',
		], // }}}

	},
};
