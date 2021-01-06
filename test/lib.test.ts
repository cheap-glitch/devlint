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
						name:      'first-rule',
						status:    'error',
						target:    [['.', 'filename.ext'], []],
						parameter: undefined,
					},
					{
						name:      'third-rule',
						status:    'warn',
						target:    [['.', 'filename.ext'], []],
						parameter: undefined,
					},
				]],
			])],
		]));

	}); // }}}

	test("rule status & parameter", () => { // {{{

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
						name:      'first-rule',
						status:    'error',
						target:    [['.', 'filename.ext'], []],
						parameter: 'foo',
					},
					{
						name:      'third-rule',
						status:    'warn',
						target:    [['.', 'filename.ext'], []],
						parameter: ['foo', { foo: 'bar' }],
					},
				]],
			])],
		]));

	}); // }}}

	test("nested targets", () => { // {{{

		expect(parseRules({
			'filename.ext': {
				'first-rule': 'error',

				'@property': {
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
			['filename.ext', new Map([
				['', [
					{
						name:      'first-rule',
						status:    'error',
						target:    [['.', 'filename.ext'], []],
						parameter: undefined,
					},
				]],
				['.property', [
					{
						name:      'second-rule',
						status:    'error',
						target:    [['.', 'filename.ext'], ['property']],
						parameter: undefined,
					},
				]],
				['.property.foo.bar', [
					{
						name:      'third-rule',
						status:    'error',
						target:    [['.', 'filename.ext'], ['property', 'foo', 'bar']],
						parameter: undefined,
					},
				]],
				['.property.foo.bar[2]', [
					{
						name:      'fourth-rule',
						status:    'error',
						target:    [['.', 'filename.ext'], ['property', 'foo', 'bar', 2]],
						parameter: undefined,
					},
				]],
			])],
		]));

	}); // }}}

});
