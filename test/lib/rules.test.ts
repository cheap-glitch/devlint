import { parseRules } from '../../src/lib/rules';

import type { RulesMap } from '../../src/lib/rules';
import type { JsonObject } from 'type-fest';

function parseRulesMap(rulesObject: JsonObject): RulesMap {
	const rulesMap: RulesMap = new Map();
	parseRules(rulesMap, rulesObject);

	return rulesMap;
}

describe('parseRules', () => {

	test('invalid rule declarations', () => { // {{{

		expect(() => parseRulesMap({ 'rule name': 'warn' })).toThrow('invalid rule declaration:');
		expect(() => parseRulesMap({ 'rule-name': 'nope' })).toThrow('invalid rule declaration:');
		expect(() => parseRulesMap({ 'rule-name': '1' })).toThrow('invalid rule declaration:');
		expect(() => parseRulesMap({ 'rule-name': 3 })).toThrow('invalid rule declaration:');
		expect(() => parseRulesMap({ '?rule-name': 'warn' })).toThrow('invalid rule declaration:');
		expect(() => parseRulesMap({ 'rule-name condition': 'warn' })).toThrow('invalid rule declaration:');
		expect(() => parseRulesMap({ '(condition) rule-name': 'warn' })).toThrow('invalid rule declaration:');
		expect(() => parseRulesMap({ 'rule-name !(condition)': 'warn' })).toThrow('invalid rule declaration:');
		expect(() => parseRulesMap({ 'rule-name (condition!)': 'warn' })).toThrow('invalid rule declaration:');

		expect(() => parseRulesMap({ 'rule-name': null })).toThrow('invalid rule declaration:');
		expect(() => parseRulesMap({ 'rule-name': true })).toThrow('invalid rule declaration:');
		expect(() => parseRulesMap({ 'rule-name': false })).toThrow('invalid rule declaration:');
		expect(() => parseRulesMap({ 'rule-name': [null, 'foo'] })).toThrow('invalid rule declaration:');
		expect(() => parseRulesMap({ 'rule-name': [true, ['foo']] })).toThrow('invalid rule declaration:');
		expect(() => parseRulesMap({ 'rule-name': [true, ['foo'], { bar: 1 }] })).toThrow('invalid rule declaration:');

		expect(() => parseRulesMap({ 'file.ext': { '#property': { '#foo.bar': { 'rule-name': 'error' } } } })).toThrow('invalid rule declaration:');

	}); // }}}

	test('rule status', () => { // {{{

		expect(parseRulesMap({
			'file.ext': {
				'first-rule': 'error',
				'second-rule': 'off',
				'third-rule': 'warn',
			},
		}))
		.toEqual(new Map([
			['file.ext', new Map([
				[undefined, new Set([
					{
						name: 'first-rule',
						status: 'error',
					},
					{
						name: 'third-rule',
						status: 'warn',
					},
				])],
			])],
		]));

		expect(parseRulesMap({
			'file.ext': {
				'first-rule': 2,
				'second-rule': 0,
				'third-rule': 1,
			},
		}))
		.toEqual(new Map([
			['file.ext', new Map([
				[undefined, new Set([
					{
						name: 'first-rule',
						status: 'error',
					},
					{
						name: 'third-rule',
						status: 'warn',
					},
				])],
			])],
		]));

	}); // }}}

	test('rule status & parameter', () => { // {{{

		expect(parseRulesMap({
			'file.ext': {
				'first-rule': ['error', 'foo'],
				'second-rule': ['off', 'foo'],
				'third-rule': ['warn', ['foo', { foo: 'bar' }]],
			},
		}))
		.toEqual(new Map([
			['file.ext', new Map([
				[undefined, new Set([
					{
						name: 'first-rule',
						status: 'error',
						parameter: 'foo',
					},
					{
						name: 'third-rule',
						status: 'warn',
						parameter: ['foo', { foo: 'bar' }],
					},
				])],
			])],
		]));

	}); // }}}

	test('nested targets', () => { // {{{

		expect(parseRulesMap({
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
						name: 'first-rule',
						status: 'error',
					},
				])],
				['property', new Set([
					{
						name: 'second-rule',
						status: 'error',
					},
				])],
				['property.foo.bar', new Set([
					{
						name: 'third-rule',
						status: 'error',
					},
				])],
				['property.foo.bar.[2]', new Set([
					{
						name: 'fourth-rule',
						status: 'error',
					},
				])],
			])],
		]));

	}); // }}}

	test('top-level rules', () => { // {{{

		expect(parseRulesMap({
			'first-rule': ['error', 'foo'],
			'second-rule': ['off', 'foo'],
			'third-rule': ['warn', ['foo', { foo: 'bar' }]],
		}))
		.toEqual(new Map([
			['.', new Map([
				[undefined, new Set([
					{
						name: 'first-rule',
						status: 'error',
						parameter: 'foo',
					},
					{
						name: 'third-rule',
						status: 'warn',
						parameter: ['foo', { foo: 'bar' }],
					},
				])],
			])],
		]));

	}); // }}}

	test('conditional rules', () => { // {{{

		expect(parseRulesMap({
			'first-rule  (condition)': 'error',
			'second-rule (condition)': 'off',
			'third-rule  (!condition)': 'warn',
		}))
		.toEqual(new Map([
			['.', new Map([
				[undefined, new Set([
					{
						name: 'first-rule',
						status: 'error',
						condition: 'condition',
					},
					{
						name: 'third-rule',
						status: 'warn',
						condition: '!condition',
					},
				])],
			])],
		]));

		expect(parseRulesMap({
			'first-rule  (a && b)': 'error',
			'second-rule (a && !b  &&  c)': 'error',
			'third-rule  ( a || b || !c )': 'warn',
		}))
		.toEqual(new Map([
			['.', new Map([
				[undefined, new Set([
					{
						name: 'first-rule',
						status: 'error',
						condition: 'a && b',
					},
					{
						name: 'second-rule',
						status: 'error',
						condition: 'a && !b && c',
					},
					{
						name: 'third-rule',
						status: 'warn',
						condition: 'a || b || !c',
					},
				])],
			])],
		]));

	}); // }}}

	test('strict rule', () => { // {{{

		expect(parseRulesMap({
			'first-rule': 'error',
			'second-rule': 'off',
			'third-rule!': 'warn',
		}))
		.toEqual(new Map([
			['.', new Map([
				[undefined, new Set([
					{
						name: 'first-rule',
						status: 'error',
					},
					{
						name: 'third-rule',
						status: 'warn',
						isStrict: true,
					},
				])],
			])],
		]));

	}); // }}}

	test('permissive rule', () => { // {{{

		expect(parseRulesMap({
			'first-rule': 'error',
			'second-rule': 'off',
			'third-rule?': 'warn',
		}))
		.toEqual(new Map([
			['.', new Map([
				[undefined, new Set([
					{
						name: 'first-rule',
						status: 'error',
					},
					{
						name: 'third-rule',
						status: 'warn',
						isPermissive: true,
					},
				])],
			])],
		]));

	}); // }}}

	test('single declaration with multiple rules', () => { // {{{

		expect(parseRulesMap({
			'first-rule (condition), third-rule?': 'error',
			'second-rule, fourth-rule': 'off',
		}))
		.toEqual(new Map([
			['.', new Map([
				[undefined, new Set([
					{
						name: 'first-rule',
						status: 'error',
						condition: 'condition',
					},
					{
						name: 'third-rule',
						status: 'error',
						isPermissive: true,
					},
				])],
			])],
		]));

	}); // }}}

	test('normalized paths', () => { // {{{

		expect(parseRulesMap({
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
						name: 'first-rule',
						status: 'error',
					},
				])],
				['property.foo', new Set([
					{
						name: 'second-rule',
						status: 'error',
					},
				])],
				['property.foo.bar', new Set([
					{
						name: 'third-rule',
						status: 'error',
					},
				])],
				['property.foo.bar.[2]', new Set([
					{
						name: 'fourth-rule',
						status: 'error',
					},
					{
						name: 'fifth-rule',
						status: 'error',
					},
				])],
			])],
		]));

	}); // }}}

});
