module.exports = {
	passing: {

		'valid snippet #1': [ // {{{
			'""', [],
		], // }}}

		'valid snippet #2': [ // {{{
			'""', [],
		], // }}}

		'valid snippet #3': [ // {{{
			'""', [],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['""', false], 2],
		'invalid parameter #2': [['""', false], 2],
		'invalid parameter #3': [['""', false], 2],
		// }}}

		'invalid snippet #1': [[ // {{{
			'""', [],
		],
			'error message',
		], // }}}

		'invalid snippet #2': [[ // {{{
			'""', [],
		],
			'error message',
		], // }}}

		'invalid snippet #3': [[ // {{{
			'""', [],
		],
			'error message',
		], // }}}

	},
};
