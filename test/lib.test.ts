import { parseRules } from '../src/lib/rules';
import { extendConfig } from '../src/lib/config';

describe('parseRules', () => {

	test('invalid rule object', () => { // {{{

		expect(parseRules('')).toEqual([]);
		expect(parseRules([])).toEqual([]);
		// eslint-disable-next-line unicorn/no-null
		expect(parseRules(null)).toEqual([]);

	}); // }}}

	test('invalid rules', () => { // {{{

		// eslint-disable-next-line unicorn/no-null
		expect(() => parseRules({ 'filename.ext': { 'rule-name': null            } })).toThrow('invalid rules config: ');
		expect(() => parseRules({ 'filename.ext': { 'rule-name': true            } })).toThrow('invalid rules config: ');
		expect(() => parseRules({ 'filename.ext': { 'rule-name': false           } })).toThrow('invalid rules config: ');
		// eslint-disable-next-line unicorn/no-null
		expect(() => parseRules({ 'filename.ext': { 'rule-name': [null,  'foo']  } })).toThrow('invalid rules config: ');
		expect(() => parseRules({ 'filename.ext': { 'rule-name': [true, ['foo']] } })).toThrow('invalid rules config: ');

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
				name:       'first-rule',
				status:     'error',
				target:     ['filename.ext', []],
				permissive: false,
			},
			{
				name:       'third-rule',
				status:     'warn',
				target:     ['filename.ext', []],
				permissive: false,
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
				name:       'first-rule',
				status:     'error',
				target:     ['filename.ext', []],
				parameter:  'foo',
				permissive: false,
			},
			{
				name:       'third-rule',
				status:     'warn',
				target:     ['filename.ext', []],
				parameter:  ['foo', { foo: 'bar' }],
				permissive: false,
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
				name:       'first-rule',
				status:     'error',
				target:     ['filename.ext', []],
				permissive: false,
			},
			{
				name:       'second-rule',
				status:     'error',
				target:     ['filename.ext', ['property']],
				permissive: false,
			},
			{
				name:       'third-rule',
				status:     'error',
				target:     ['filename.ext', ['property', 'foo', 'bar']],
				permissive: false,
			},
			{
				name:       'fourth-rule',
				status:     'error',
				target:     ['filename.ext', ['property', 'foo', 'bar', 2]],
				permissive: false,
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
				name:       'first-rule',
				status:     'error',
				target:     ['.', []],
				parameter:  'foo',
				permissive: false,
			},
			{
				name:       'third-rule',
				status:     'warn',
				target:     ['.', []],
				parameter:  ['foo', { foo: 'bar' }],
				permissive: false,
			},
		]);

	}); // }}}

	test('conditional rules', () => { // {{{

		expect(parseRules({
			'first-rule (condition)':  'error',
			'second-rule (condition)': 'off',
			'(condition) third-rule':  'warn',
		}))
		.toEqual([
			{
				name:       'first-rule',
				status:     'error',
				target:     ['.', []],
				condition:  'condition',
				permissive: false,
			},
			{
				name:       'third-rule',
				status:     'warn',
				target:     ['.', []],
				condition:  'condition',
				permissive: false,
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
				name:       'first-rule',
				status:     'error',
				target:     ['.', []],
				permissive: false,
			},
			{
				name:       'third-rule',
				status:     'warn',
				target:     ['.', []],
				permissive: true,
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
