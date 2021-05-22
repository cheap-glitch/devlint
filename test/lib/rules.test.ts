import { parseRules } from '../../src/lib/rules';

describe('parseRules', () => {

	test('invalid rule object', () => { // {{{

		expect(parseRules(null)).toEqual(new Map());
		expect(parseRules('')).toEqual(new Map());
		expect(parseRules([])).toEqual(new Map());

	}); // }}}

	test('invalid rule declarations', () => { // {{{

		expect(() => parseRules({ 'rule name':              'warn'         })).toThrow('invalid rule declaration:');
		expect(() => parseRules({ 'rule-name':              'nope'         })).toThrow('invalid rule declaration:');
		expect(() => parseRules({ 'rule-name':              '1'            })).toThrow('invalid rule declaration:');
		expect(() => parseRules({ 'rule-name':              3              })).toThrow('invalid rule declaration:');
		expect(() => parseRules({ '?rule-name':             'warn'         })).toThrow('invalid rule declaration:');
		expect(() => parseRules({ 'rule-name condition':    'warn'         })).toThrow('invalid rule declaration:');
		expect(() => parseRules({ '(condition) rule-name':  'warn'         })).toThrow('invalid rule declaration:');
		expect(() => parseRules({ 'rule-name !(condition)': 'warn'         })).toThrow('invalid rule declaration:');
		expect(() => parseRules({ 'rule-name (condition!)': 'warn'         })).toThrow('invalid rule declaration:');

		expect(() => parseRules({ 'rule-name': null                        })).toThrow('invalid rule declaration:');
		expect(() => parseRules({ 'rule-name': true                        })).toThrow('invalid rule declaration:');
		expect(() => parseRules({ 'rule-name': false                       })).toThrow('invalid rule declaration:');
		expect(() => parseRules({ 'rule-name': [null,  'foo']              })).toThrow('invalid rule declaration:');
		expect(() => parseRules({ 'rule-name': [true, ['foo']]             })).toThrow('invalid rule declaration:');
		expect(() => parseRules({ 'rule-name': [true, ['foo'], { bar: 1 }] })).toThrow('invalid rule declaration:');

		expect(() => parseRules({ 'file.ext': { '#property': { '#foo.bar': { 'rule-name': 'error' } } } })).toThrow('invalid rule declaration:');

	}); // }}}

	test('rule status', () => { // {{{

		expect(parseRules({
			'file.ext': {
				'first-rule':  'error',
				'second-rule': 'off',
				'third-rule':  'warn',
			},
		}))
		.toEqual(new Map([
			['file.ext', new Map([
				[undefined, new Set([
					{
						name:   'first-rule',
						status: 'error',
					},
					{
						name:   'third-rule',
						status: 'warn',
					},
				])],
			])],
		]));

		expect(parseRules({
			'file.ext': {
				'first-rule':  2,
				'second-rule': 0,
				'third-rule':  1,
			},
		}))
		.toEqual(new Map([
			['file.ext', new Map([
				[undefined, new Set([
					{
						name:   'first-rule',
						status: 'error',
					},
					{
						name:   'third-rule',
						status: 'warn',
					},
				])],
			])],
		]));

	}); // }}}

	test('rule status & parameter', () => { // {{{

		expect(parseRules({
			'file.ext': {
				'first-rule':  ['error',  'foo'],
				'second-rule': ['off',    'foo'],
				'third-rule':  ['warn',  ['foo', { foo: 'bar' }]],
			},
		}))
		.toEqual(new Map([
			['file.ext', new Map([
				[undefined, new Set([
					{
						name:      'first-rule',
						status:    'error',
						parameter: 'foo',
					},
					{
						name:      'third-rule',
						status:    'warn',
						parameter: ['foo', { foo: 'bar' }],
					},
				])],
			])],
		]));

	}); // }}}

	test('nested targets', () => { // {{{

		expect(parseRules({
			'file.ext': {
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
		.toEqual(new Map([
			['file.ext', new Map([
				[undefined, new Set([
					{
						name:   'first-rule',
						status: 'error',
					},
				])],
				['property', new Set([
					{
						name:   'second-rule',
						status: 'error',
					},
				])],
				['property.foo.bar', new Set([
					{
						name:   'third-rule',
						status: 'error',
					},
				])],
				['property.foo.bar.[2]', new Set([
					{
						name:   'fourth-rule',
						status: 'error',
					},
				])],
			])],
		]));

	}); // }}}

	test('top-level rules', () => { // {{{

		expect(parseRules({
			'first-rule':  ['error',  'foo'],
			'second-rule': ['off',    'foo'],
			'third-rule':  ['warn',  ['foo', { foo: 'bar' }]],
		}))
		.toEqual(new Map([
			['.', new Map([
				[undefined, new Set([
					{
						name:      'first-rule',
						status:    'error',
						parameter: 'foo',
					},
					{
						name:      'third-rule',
						status:    'warn',
						parameter: ['foo', { foo: 'bar' }],
					},
				])],
			])],
		]));

	}); // }}}

	test('conditional rules', () => { // {{{

		expect(parseRules({
			'first-rule  (condition)': 'error',
			'second-rule (condition)': 'off',
			'third-rule (!condition)': 'warn',
		}))
		.toEqual(new Map([
			['.', new Map([
				[undefined, new Set([
					{
						name:      'first-rule',
						status:    'error',
						condition: { name: 'condition', isNegated: false },
					},
					{
						name:      'third-rule',
						status:    'warn',
						condition: { name: 'condition', isNegated: true },
					},
				])],
			])],
		]));

	}); // }}}

	test('strict rule', () => { // {{{

		expect(parseRules({
			'first-rule':  'error',
			'second-rule': 'off',
			'third-rule!': 'warn',
		}))
		.toEqual(new Map([
			['.', new Map([
				[undefined, new Set([
					{
						name:     'first-rule',
						status:   'error',
					},
					{
						name:     'third-rule',
						status:   'warn',
						isStrict: true,
					},
				])],
			])],
		]));

	}); // }}}

	test('permissive rule', () => { // {{{

		expect(parseRules({
			'first-rule':  'error',
			'second-rule': 'off',
			'third-rule?': 'warn',
		}))
		.toEqual(new Map([
			['.', new Map([
				[undefined, new Set([
					{
						name:         'first-rule',
						status:       'error',
					},
					{
						name:         'third-rule',
						status:       'warn',
						isPermissive: true,
					},
				])],
			])],
		]));

	}); // }}}

	test('single declaration with multiple rules', () => { // {{{

		expect(parseRules({
			'first-rule (condition), third-rule?': 'error',
			'second-rule, fourth-rule':            'off',
		}))
		.toEqual(new Map([
			['.', new Map([
				[undefined, new Set([
					{
						name:         'first-rule',
						status:       'error',
						condition:    { name: 'condition', isNegated: false },
					},
					{
						name:         'third-rule',
						status:       'error',
						isPermissive: true,
					},
				])],
			])],
		]));

	}); // }}}

	test('normalized paths', () => { // {{{

		expect(parseRules({
			'foo///bar/baz/../../bar': {
				'./file.ext': {
					'first-rule': 'error',
					'#property..foo': {
						'second-rule': 'error',
						'..bar.': {
							'third-rule': 'error',
							'[2].': {
								'fourth-rule': 'error',
							},
						},
						'bar.[2]': {
							'fifth-rule': 'error',
						},
					},
				},
			},
		}))
		.toEqual(new Map([
			['foo/bar/file.ext', new Map([
				[undefined, new Set([
					{
						name:   'first-rule',
						status: 'error',
					},
				])],
				['property.foo', new Set([
					{
						name:   'second-rule',
						status: 'error',
					},
				])],
				['property.foo.bar', new Set([
					{
						name:   'third-rule',
						status: 'error',
					},
				])],
				['property.foo.bar.[2]', new Set([
					{
						name:   'fourth-rule',
						status: 'error',
					},
					{
						name:   'fifth-rule',
						status: 'error',
					},
				])],
			])],
		]));

	}); // }}}

});
