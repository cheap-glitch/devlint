module.exports = {
	passing: {

		'valid snippet #1': [ // {{{
		`
			{
			}
		`,
			[],
		], // }}}

		'valid snippet #2': [ // {{{
		`
			{
			}
		`,
			[],
		], // }}}

		'valid snippet #3': [ // {{{
		`
			{
			}
		`,
			[],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['{}', false], 2],
		'invalid parameter #2': [['{}', false], 2],
		'invalid parameter #3': [['{}', false], 2],
		// }}}

		'invalid snippet title #1': [[ // {{{
		`
			{
			}
		`,
			[],
		],
			'error message', { line: 1, column: 1, char: 0 }, { line: 1, column: 2, char: 1 },
		], // }}}

		'invalid snippet title #2': [[ // {{{
		`
			{
			}
		`,
			[],
		],
			'error message', { line: 1, column: 1, char: 0 }, { line: 1, column: 2, char: 1 },
		], // }}}

		'invalid snippet title #3': [[ // {{{
		`
			{
			}
		`,
			[],
		],
			'error message', { line: 1, column: 1, char: 0 }, { line: 1, column: 2, char: 1 },
		], // }}}

	},
};
