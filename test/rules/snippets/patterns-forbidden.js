module.exports = {
	passing: {

		'empty text and empty list': [ // {{{
		`
		`,
			[],
		], // }}}

		'empty text and non-empty list': [ // {{{
		`
		`,
			['foo', 'bar'],
		], // }}}

		'non-matching literal patterns': [ // {{{
		`
			Lorem ipsum dolor sit amet,  consectetur adipiscing elit. Si verbum sequimur,
			primum  longius verbum  praepositum  quam bonum.  Teneo,  inquit, finem  illi
			videri nihil dolere. Non laboro, inquit,  de nomine. Aliter enim nosmet ipsos
			nosse non possumus.
		`,
			['foo', 'bar'],
		], // }}}

		'non-matching regex patterns': [ // {{{
		`
			Lorem ipsum dolor sit amet,  consectetur adipiscing elit. Si verbum sequimur,
			primum  longius verbum  praepositum  quam bonum.  Teneo,  inquit, finem  illi
			videri nihil dolere. Non laboro, inquit,  de nomine. Aliter enim nosmet ipsos
			nosse non possumus.
		`,
			['/^primum/', '/illi$/', '/[zx]/'],
		], // }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['', false], 2],
		'invalid parameter #2': [['', 'foo'], 2],
		'invalid parameter #3': [['', [33]], 2],
		// }}}

		'matching literal pattern': [[ // {{{
		`
			Lorem ipsum dolor sit amet,  consectetur adipiscing elit. Si verbum sequimur,
			primum  longius verbum  praepositum  quam bonum.  Teneo,  inquit, finem  illi
			videri nihil dolere. Non laboro, inquit,  de nomine. Aliter enim nosmet ipsos
			nosse non possumus.
		`,
			['foo', 'bar', 'Non'],
		],
			'pattern "Non" is forbidden', { line: 3, column: 22, char: 177 }, { line: 3, column: 24, char: 179 },
		], // }}}

		'matching regex pattern #1': [[ // {{{
		`
			Lorem ipsum dolor sit amet,  consectetur adipiscing elit. Si verbum sequimur,
			primum  longius verbum  praepositum  quam bonum.  Teneo,  inquit, finem  illi
			videri nihil dolere. Non laboro, inquit,  de nomine. Aliter enim nosmet ipsos
			nosse non possumus.
		`,
			['/^Lorem/'],
		],
			'pattern "Lorem" is forbidden', { line: 1, column: 1, char: 0 }, { line: 1, column: 5, char: 4 },
		], // }}}

		'matching regex pattern #2': [[ // {{{
		`
			Lorem ipsum dolor sit amet,  consectetur adipiscing elit. Si verbum sequimur,
			primum  longius verbum  praepositum  quam bonum.  Teneo,  inquit, finem  illi
			videri nihil dolere. Non laboro, inquit,  de nomine. Aliter enim nosmet ipsos
			nosse non possumus.
		`,
			['/^videri/m'],
		],
			'pattern "videri" is forbidden', { line: 3, column: 1, char: 156 }, { line: 3, column: 6, char: 161 },
		], // }}}

		'matching regex pattern #3': [[ // {{{
		`
			Lorem ipsum dolor sit amet,  consectetur adipiscing elit. Si verbum sequimur,
			primum  longius verbum  praepositum  quam bonum.  Teneo,  inquit, finem  illi
			videri nihil dolere. Non laboro, inquit,  de nomine. Aliter enim nosmet ipsos
			nosse non possumus.
		`,
			['/ill[io]$/m'],
		],
			'pattern "illi" is forbidden', { line: 2, column: 74, char: 151 }, { line: 2, column: 77, char: 154 },
		], // }}}

	},
};
