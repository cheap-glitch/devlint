import { parseRules } from '../src/lib/rules';
import { extendConfig } from '../src/lib/config';

describe('parseRules', () => {

	test('invalid rule object', () => { // {{{

		expect(parseRules('')).toEqual([]);
		expect(parseRules([])).toEqual([]);
		// eslint-disable-next-line unicorn/no-null
		expect(parseRules(null)).toEqual([]);

	}); // }}}

	test('invalid rule declarations', () => { // {{{

		expect(() => parseRules({ 'rule name':              'warn' })).toThrow('invalid rule declaration: ');
		expect(() => parseRules({ '?rule-name':             'warn' })).toThrow('invalid rule declaration: ');
		expect(() => parseRules({ 'rule-name condition':    'warn' })).toThrow('invalid rule declaration: ');
		expect(() => parseRules({ '(condition) rule-name':  'warn' })).toThrow('invalid rule declaration: ');
		expect(() => parseRules({ 'rule-name !(condition)': 'warn' })).toThrow('invalid rule declaration: ');
		expect(() => parseRules({ 'rule-name (condition!)': 'warn' })).toThrow('invalid rule declaration: ');

	}); // }}}

	test('invalid rule configurations', () => { // {{{

		// eslint-disable-next-line unicorn/no-null
		expect(() => parseRules({ 'rule-name': null            })).toThrow('invalid rule configuration: ');
		expect(() => parseRules({ 'rule-name': true            })).toThrow('invalid rule configuration: ');
		expect(() => parseRules({ 'rule-name': false           })).toThrow('invalid rule configuration: ');
		// eslint-disable-next-line unicorn/no-null
		expect(() => parseRules({ 'rule-name': [null,  'foo']  })).toThrow('invalid rule configuration: ');
		expect(() => parseRules({ 'rule-name': [true, ['foo']] })).toThrow('invalid rule configuration: ');

	}); // }}}

	test('rule status', () => { // {{{

		expect(parseRules({
			'filename.ext': {
				'first-rule':  'error',
				'second-rule': 'off',
				'third-rule':  'warn',
			},
		}))
		.toEqual([
			{
				name:   'first-rule',
				status: 'error',
				target: ['filename.ext', []],
			},
			{
				name:   'third-rule',
				status: 'warn',
				target: ['filename.ext', []],
			},
		]);

	}); // }}}

	test('rule status & parameter', () => { // {{{

		expect(parseRules({
			'filename.ext': {
				'first-rule':  ['error',  'foo'],
				'second-rule': ['off',    'foo'],
				'third-rule':  ['warn',  ['foo', { foo: 'bar' }]],
			},
		}))
		.toEqual([
			{
				name:      'first-rule',
				status:    'error',
				target:    ['filename.ext', []],
				parameter: 'foo',
			},
			{
				name:      'third-rule',
				status:    'warn',
				target:    ['filename.ext', []],
				parameter: ['foo', { foo: 'bar' }],
			},
		]);

	}); // }}}

	test('nested targets', () => { // {{{

		expect(parseRules({
			'filename.ext': {
				'first-rule': 'error',

				'#property': {
					'second-rule': 'error',

					'.foo.bar': {
						'third-rule': 'error',

						'[2]': {
							'fourth-rule': 'error',
						},
					},
				},
			},
		}))
		.toEqual([
			{
				name:   'first-rule',
				status: 'error',
				target: ['filename.ext', []],
			},
			{
				name:   'second-rule',
				status: 'error',
				target: ['filename.ext', ['property']],
			},
			{
				name:   'third-rule',
				status: 'error',
				target: ['filename.ext', ['property', 'foo', 'bar']],
			},
			{
				name:   'fourth-rule',
				status: 'error',
				target: ['filename.ext', ['property', 'foo', 'bar', 2]],
			},
		]);

	}); // }}}

	test('top-level rules', () => { // {{{

		expect(parseRules({
			'first-rule':  ['error',  'foo'],
			'second-rule': ['off',    'foo'],
			'third-rule':  ['warn',  ['foo', { foo: 'bar' }]],
		}))
		.toEqual([
			{
				name:      'first-rule',
				status:    'error',
				target:    ['.', []],
				parameter: 'foo',
			},
			{
				name:      'third-rule',
				status:    'warn',
				target:    ['.', []],
				parameter: ['foo', { foo: 'bar' }],
			},
		]);

	}); // }}}

	test('conditional rules', () => { // {{{

		expect(parseRules({
			'first-rule  (condition)': 'error',
			'second-rule (condition)': 'off',
			'third-rule (!condition)': 'warn',
		}))
		.toEqual([
			{
				name:      'first-rule',
				status:    'error',
				target:    ['.', []],
				condition: 'condition',
			},
			{
				name:      'third-rule',
				status:    'warn',
				target:    ['.', []],
				condition: 'condition',
				conditionExpectedResult: false,
			},
		]);

	}); // }}}

	test('permissive rules', () => { // {{{

		expect(parseRules({
			'first-rule':  'error',
			'second-rule': 'off',
			'third-rule?': 'warn',
		}))
		.toEqual([
			{
				name:         'first-rule',
				status:       'error',
				target:       ['.', []],
			},
			{
				name:         'third-rule',
				status:       'warn',
				target:       ['.', []],
				isPermissive: true,
			},
		]);

	}); // }}}

});

describe('extendConfig', () => {

	test('extending a base config', () => { // {{{

		expect(extendConfig({
			extends: '../../test/assets/configs/base.json',
			rules: {
				'rule-a': 'warn',
				'filename.ext': {
					'rule-b': ['warn'],
					'#property': {
						'rule-c': ['error', 'bar'],
					},
				},
			},
		}))
		.toEqual({
			rules: {
				'rule-a': 'warn',
				'filename.ext': {
					'rule-b': ['warn', true],
					'#property': {
						'rule-c': ['error', 'bar'],
					},
				},
			},
		});

	}); // }}}

	test('extending configs recursively', () => { // {{{

		expect(extendConfig({
			extends: '../../test/assets/configs/recursive.json',
		}))
		.toEqual({
			rules: {
				'rule-a': 'error',
				'filename.ext': {
					'rule-b': ['warn', true],
					'#property': {
						'rule-c': ['error', 'foo'],
					},
				},
			},
		});

	}); // }}}

});
