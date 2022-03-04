import { extendConfig } from '../../src/lib/config';

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
