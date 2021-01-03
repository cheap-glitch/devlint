import { parseRules } from '../src/lib/rules';

describe("parseRules", () => {

	test("invalid rule object", () => { // {{{

		expect(parseRules('')).toEqual(new Map());
		expect(parseRules([])).toEqual(new Map());
		// eslint-disable-next-line unicorn/no-null
		expect(parseRules(null)).toEqual(new Map());

	}); // }}}

	test("invalid rules", () => { // {{{

		// eslint-disable-next-line unicorn/no-null
		expect(parseRules({ 'filename.ext': { 'rule-name': null            } })).toEqual(new Map());
		expect(parseRules({ 'filename.ext': { 'rule-name': true            } })).toEqual(new Map());
		expect(parseRules({ 'filename.ext': { 'rule-name': false           } })).toEqual(new Map());
		// eslint-disable-next-line unicorn/no-null
		expect(parseRules({ 'filename.ext': { 'rule-name': [null,  'foo']  } })).toEqual(new Map());
		expect(parseRules({ 'filename.ext': { 'rule-name': [true, ['foo']] } })).toEqual(new Map());

	}); // }}}

	test("rule status", () => { // {{{

		expect(parseRules({
			'filename.ext': {
				'first-rule':  'error',
				'second-rule': 'off',
				'third-rule':  'warn',
			},
		}))
		.toEqual(new Map([
			['filename.ext', new Map([
				['', [
					{
						name:       'first-rule',
						status:     'error',
						target:     [],
						parameters: undefined,
					},
					{
						name:       'third-rule',
						status:     'warn',
						target:     [],
						parameters: undefined,
					},
				]],
			])],
		]));

	}); // }}}

	test("rule status & parameters", () => { // {{{

		expect(parseRules({
			'filename.ext': {
				'first-rule':  ['error',  'foo'],
				'second-rule': ['off',    'foo'],
				'third-rule':  ['warn',  ['foo', { foo: 'bar' }]],
			},
		}))
		.toEqual(new Map([
			['filename.ext', new Map([
				['', [
					{
						name:       'first-rule',
						status:     'error',
						target:     [],
						parameters: 'foo',
					},
					{
						name:       'third-rule',
						status:     'warn',
						target:     [],
						parameters: ['foo', { foo: 'bar' }],
					},
				]],
			])],
		]));

	}); // }}}

	test("nested targets", () => { // {{{

		expect(parseRules({
			'filename.ext': {
				'first-rule': 'error',

				'#property': {
					'second-rule': 'error',

					'.foo.bar': {
						'third-rule': 'error',
					},
				},
			},
		}))
		.toEqual(new Map([
			['filename.ext', new Map([
				['', [
					{
						name:       'first-rule',
						status:     'error',
						target:     [],
						parameters: undefined,
					},
				]],
				['property', [
					{
						name:       'second-rule',
						status:     'error',
						target:     ['property'],
						parameters: undefined,
					},
				]],
				['property.foo.bar', [
					{
						name:       'third-rule',
						status:     'error',
						target:     ['property', 'foo', 'bar'],
						parameters: undefined,
					},
				]],
			])],
		]));

	}); // }}}

});
