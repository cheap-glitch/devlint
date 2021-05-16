module.exports = {
	passing: {

		'valid snippet': [ // {{{
			'""', [],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['""', false], 2],
		'invalid parameter #2': [['""', false], 2],
		'invalid parameter #3': [['""', false], 2],
		// }}}

		'invalid snippet': [[ // {{{
			'""', [],
		],
			'error message',
		], // }}}

	},
};
