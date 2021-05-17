module.exports = {
	passing: {

		'empty directory and empty list': [ // {{{
		`
		`,
			[],
		], // }}}

		'matching files': [ // {{{
		`
			src/
			src/index.ts
			test/
			test/index.test.ts
			LICENSE
			README.md
			.gitignore
		`,
			['.gitignore', 'src/index.ts'],
		], // }}}

		'matching directories': [ // {{{
		`
			src/
			src/index.ts
			test/
			test/helpers/
			test/index.test.ts
			LICENSE
			README.md
			.gitignore
		`,
			['src/', 'test/', 'test/helpers/'],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['', null],           2],
		'invalid parameter #2': [['', [{}]],           2],
		'invalid parameter #3': [['', [false, 'foo']], 2],
		// }}}

		'empty directory and non-empty list': [[ // {{{
		`
		`,
			['foo/', 'bar.js'],
		],
			'required directory "foo/" is missing',
		], // }}}

		'missing top-level file': [[ // {{{
		`
			src/
			src/index.ts
			test/
			test/index.test.ts
			README.md
			.gitignore
		`,
			['LICENSE', 'src/index.ts'],
		],
			'required file "LICENSE" is missing',
		], // }}}

		'missing nested file': [[ // {{{
		`
			src/
			test/
			test/index.test.ts
			LICENSE
			README.md
			.gitignore
		`,
			['LICENSE', 'src/index.ts'],
		],
			'required file "src/index.ts" is missing',
		], // }}}

		'missing top-level directory': [[ // {{{
		`
			src/
			src/index.ts
			README.md
			.gitignore
		`,
			['src/', 'test/'],
		],
			'required directory "test/" is missing',
		], // }}}

		'missing nested directory': [[ // {{{
		`
			src/
			test/
			test/index.test.ts
			README.md
			.gitignore
		`,
			['src/', 'src/lib/'],
		],
			'required directory "src/lib/" is missing',
		], // }}}

	},
};
