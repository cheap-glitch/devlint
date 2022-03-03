module.exports = {
	passing: {

		'empty string': [ // {{{
			'""', ['sentence', 'kebab'],
		], // }}}

		'capitalized sentence': [ // {{{
			'"Lorem ipsum dolor sit amet"', ['sentence', 'kebab'],
		], // }}}

		'kebab case': [ // {{{
			'"lorem-ipsum"', ['kebab', 'pascal'],
		], // }}}

		'camel case': [ // {{{
			'"loremIpsum"', ['pascal', 'camel', 'sentence'],
		], // }}}

		'pascal case': [ // {{{
			'"LoremIpsum"', ['pascal', 'camel', 'sentence'],
		], // }}}

		'package name with organization': [ // {{{
			'"@lorem-ipsum/dolor-sit"', ['kebab-extended'],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['""', true], 2],
		'invalid parameter #2': [['""', ''], 2],
		'invalid parameter #3': [['""', [14]], 2],
		'invalid parameter #4': [['""', ['foo']], 2],
		'invalid parameter #5': [['""', ['zozan', 'kebab']], 2],
		// }}}

		'lowercase word': [[ // {{{
			'"lorem"', ['pascal'],
		],
			"case style doesn't match any of the allowed styles",
		], // }}}

		'lowercase sentence': [[ // {{{
			'"lorem ipsum dolor sit amet"', ['sentence', 'kebab'],
		],
			"case style doesn't match any of the allowed styles",
		], // }}}

		'filesystem path': [[ // {{{
			'"/dolor-sit"', ['kebab-extended'],
		],
			"case style doesn't match any of the allowed styles",
		], // }}}

		'mixed case with underscore': [[ // {{{
			'"lorem_Ipsum"', ['pascal', 'camel', 'sentence'],
		],
			"case style doesn't match any of the allowed styles",
		], // }}}

		'mixed case with trailing underscore': [[ // {{{
			'"LoremIpsum_"', ['pascal', 'camel'],
		],
			"case style doesn't match any of the allowed styles",
		], // }}}

	},
};
