module.exports = {
	passing: [

		[`
			snippet
		`,
			/* parameter */,
		],

	],

	failing: [

		[['{}', /* invalid parameter */], 2],
		[['{}', /* invalid parameter */], 2],
		[['{}', /* invalid parameter */], 2],

		[[`
			snippet
		`,
			/* parameter */,
		],
			'', { line: 1, column: 1, char: 0 }, { line: 1, column: 1, char: 0 },
		],

	],
};
