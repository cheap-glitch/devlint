module.exports = {
	passing: [
		'',
		'foo',
		'foo\nbar\nbaz',
		'foo\nbar\nbaz\n',
		'foo\n\tbar\nbaz\n',
		'foo\nbar\t\nbaz\n',
	],

	failing: [
		['\\n',           'line should not be empty', { line: 1, column: 1, char: 0 }, { line: 1, column: 1, char: 0 }],
		['\\nfoo',        'line should not be empty', { line: 1, column: 1, char: 0 }, { line: 1, column: 1, char: 0 }],
		['foo\n\n',       'line should not be empty', { line: 2, column: 1, char: 4 }, { line: 2, column: 1, char: 4 }],
		['foo\n\nbar',    'line should not be empty', { line: 2, column: 1, char: 4 }, { line: 2, column: 1, char: 4 }],
		['foo\n\t \nbar', 'line should not be empty', { line: 2, column: 1, char: 4 }, { line: 2, column: 3, char: 6 }],
	],
};
