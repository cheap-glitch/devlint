module.exports = {
	passing: [
		['"lorem ipsum dolor sit amet"', ['sentence', 'kebab']],
		['"lorem ipsum"',                ['kebab', 'pascal']],
		['"/dolor-sit"',                 ['kebab-extended']],
		['"lorem_Ipsum"',                ['pascal', 'camel', 'sentence']],
		['"LoremIpsum_"',                ['pascal', 'camel']],
	],

	failing: [
		[['""', true],               2],
		[['""', ''],                 2],
		[['""', [14]],               2],
		[['""', ['foo']],            2],
		[['""', ['zozan', 'kebab']], 2],

		[['""',                           ['sentence', 'kebab']],           'case style is forbidden'],
		[['"Lorem ipsum dolor sit amet"', ['sentence', 'kebab']],           'case style is forbidden'],
		[['"lorem-ipsum"',                ['kebab', 'pascal']],             'case style is forbidden'],
		[['"@lorem-ipsum/dolor-sit"',     ['kebab-extended']],              'case style is forbidden'],
		[['"loremIpsum"',                 ['pascal', 'camel', 'sentence']], 'case style is forbidden'],
		[['"LoremIpsum"',                 ['pascal', 'camel', 'sentence']], 'case style is forbidden'],
	],
};
