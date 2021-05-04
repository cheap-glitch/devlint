module.exports = {
	passing: {

		'lowercase word': [ // {{{
			'"lorem"', ['kebab', 'pascal'],
		], // }}}

		'lowercase sentence': [ // {{{
			'"lorem ipsum dolor sit amet"', ['sentence', 'kebab'],
		], // }}}

		'filesystem path': [ // {{{
			'"/dolor-sit"', ['kebab-extended'],
		], // }}}

		'mixed case with underscore': [ // {{{
			'"lorem_Ipsum"', ['pascal', 'camel', 'sentence'],
		], // }}}

		'mixed case with trailing underscore': [ // {{{
			'"LoremIpsum_"', ['pascal', 'camel'],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['""', true],               2],
		'invalid parameter #2': [['""', ''],                 2],
		'invalid parameter #3': [['""', [14]],               2],
		'invalid parameter #4': [['""', ['foo']],            2],
		'invalid parameter #5': [['""', ['zozan', 'kebab']], 2],
		// }}}

		'empty string': [[ // {{{
			'""', ['sentence', 'kebab'],
		],
			'case style is forbidden',
		], // }}}

		'capitalized sentence': [[ // {{{
			'"Lorem ipsum dolor sit amet"', ['sentence', 'kebab'],
		],
			'case style is forbidden',
		], // }}}

		'kebab case': [[ // {{{
			'"lorem-ipsum"', ['kebab', 'pascal'],
		],
			'case style is forbidden',
		], // }}}

		'camel case': [[ // {{{
			'"loremIpsum"', ['pascal', 'camel', 'sentence'],
		],
			'case style is forbidden',
		], // }}}

		'pascal case': [[ // {{{
			'"LoremIpsum"', ['pascal', 'camel', 'sentence'],
		],
			'case style is forbidden',
		], // }}}

		'package name with organization': [[ // {{{
			'"@lorem-ipsum/dolor-sit"', ['kebab-extended'],
		],
			'case style is forbidden',
		], // }}}

	},
};
