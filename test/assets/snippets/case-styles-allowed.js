module.exports = {
	passing: [
		['""',                           ['sentence', 'kebab']],
		['"Lorem ipsum dolor sit amet"', ['sentence', 'kebab']],
		['"lorem-ipsum"',                ['kebab', 'pascal']],
		['"@lorem-ipsum/dolor-sit"',     ['kebab-extended']],
		['"loremIpsum"',                 ['pascal', 'camel', 'sentence']],
		['"LoremIpsum"',                 ['pascal', 'camel', 'sentence']],
	],

	failing: [
		[['""', true],               2],
		[['""', ''],                 2],
		[['""', [14]],               2],
		[['""', ['foo']],            2],
		[['""', ['zozan', 'kebab']], 2],

		[['"lorem ipsum dolor sit amet"', ['sentence', 'kebab']],           "case style doesn't match any of the allowed styles"],
		[['"lorem ipsum"',                ['kebab', 'pascal']],             "case style doesn't match any of the allowed styles"],
		[['"/dolor-sit"',                 ['kebab-extended']],              "case style doesn't match any of the allowed styles"],
		[['"lorem_Ipsum"',                ['pascal', 'camel', 'sentence']], "case style doesn't match any of the allowed styles"],
		[['"LoremIpsum_"',                ['pascal', 'camel']],             "case style doesn't match any of the allowed styles"],
	],
};
