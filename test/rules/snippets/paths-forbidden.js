module.exports = {
	passing: {

		'empty directory and empty list': [ // {{{
		`
		`,
			[],
		], // }}}

		'empty directory and non-empty list': [ // {{{
		`
		`,
			['foo/', 'bar.ext'],
		], // }}}

		'no matching files': [ // {{{
		`
			foo.js
			foo.ts
			bar/
		`,
			['foo.md', 'bar'],
		], // }}}

		'no matching folders': [ // {{{
		`
			foo.js
			foo.ts
			baz/
		`,
			['foo/', 'bar/'],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['', false], 2],
		'invalid parameter #2': [['', ['foo/', null]], 2],
		'invalid parameter #3': [['', [['foo/']]], 2],
		'invalid parameter #4': [['', { 'foo.js': false }], 2],
		// }}}

		'matching top-level file': [[ // {{{
		`
			foo.js
			bar.ts
		`,
			['foo.js', 'bar.js'],
		],
			'file "foo.js" is forbidden',
		], // }}}

		'matching nested file': [[ // {{{
		`
			foo/
			foo/bar/
			foo/bar/baz.rs
		`,
			['foo', 'foo/bar/baz.rs'],
		],
			'file "foo/bar/baz.rs" is forbidden',
		], // }}}

		'matching hidden file': [[ // {{{
		`
			src/
			test/
			.npmignore
		`,
			['.git/', '.npmignore'],
		],
			'file ".npmignore" is forbidden',
		], // }}}

		'matching top-level directory': [[ // {{{
		`
			foo.js
			foobar/
			foobar/file.md
			foobaz/
		`,
			['foobaz/baz.txt', 'foobar/', 'foo.ts'],
		],
			'directory "foobar/" is forbidden',
		], // }}}

		'matching nested directory': [[ // {{{
		`
			foo.js
			foobar/
			foobar/file.md
			foobaz/bar/
		`,
			['foobaz/baz.txt', 'foobaz/bar/', 'foo.ts'],
		],
			'directory "foobaz/bar/" is forbidden',
		], // }}}

		'matching hidden directory': [[ // {{{
		`
			.git/
			src/
			test/
		`,
			['.git/', '.npmignore'],
		],
			'directory ".git/" is forbidden',
		], // }}}

	},
};
