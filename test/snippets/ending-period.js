module.exports = {
	passing: [
		['""', false],

		'"Lorem ipsum dolor sit amet."',

		['"Lorem ipsum dolor sit amet."', true],
		['"Lorem ipsum dolor sit amet"',  false],
	],

	failing: [
		[['""', 0],   2],
		[['""', '.'], 2],

		['"Lorem ipsum dolor sit amet"',           "string doesn't end with a period"],
		[['"Lorem ipsum dolor sit amet"',  true],  "string doesn't end with a period"],
		[['"Lorem ipsum dolor sit amet."', false], 'string ends with a period'],
	],
};
