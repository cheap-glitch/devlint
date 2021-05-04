module.exports = {
	passing: {

		'empty string': [ // {{{
			'""', false,
		], // }}}

		'ending period and no parameter': [ // {{{
			'"Lorem ipsum dolor sit amet."',
		], // }}}

		'required ending period': [ // {{{
			'"Lorem ipsum dolor sit amet."', true,
		], // }}}

		'no forbidden ending period': [ // {{{
			'"Lorem ipsum dolor sit amet"', false,
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['""', 0],   2],
		'invalid parameter #2': [['""', '.'], 2],
		// }}}

		'no ending period and no parameter': [[ // {{{
			'"Lorem ipsum dolor sit amet"',
		],
			"string doesn't end with a period",
		], // }}}

		'missing required period': [[ // {{{
			'"Lorem ipsum dolor sit amet"', true,
		],
			"string doesn't end with a period",
		], // }}}

		'forbidden ending period': [[ // {{{
			'"Lorem ipsum dolor sit amet."', false,
		],
			'string ends with a period',
		], // }}}

	},
};
