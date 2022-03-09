import { processConditionalExpression } from '../../src/lib/conditions';

const conditionsMap = new Map([
	['a', true],
	['b', false],
	['c', true],
]);

describe('processConditionalExpression', () => {

	test('invalid expressions', () => { // {{{

		expect(() => processConditionalExpression(conditionsMap, 'a||b&&c')).toThrow();
		expect(() => processConditionalExpression(conditionsMap, 'b&&c||a')).toThrow();

	}); // }}}

	test('single condition', () => { // {{{

		expect(processConditionalExpression(conditionsMap, 'a')).toBe(true);
		expect(processConditionalExpression(conditionsMap, 'b')).toBe(false);
		expect(processConditionalExpression(conditionsMap, '!b')).toBe(true);

	}); // }}}

	test('several conditions combined with AND', () => { // {{{

		expect(processConditionalExpression(conditionsMap, 'a&&b')).toBe(false);
		expect(processConditionalExpression(conditionsMap, 'a&&c')).toBe(true);
		expect(processConditionalExpression(conditionsMap, 'a&&b&&c')).toBe(false);
		expect(processConditionalExpression(conditionsMap, 'a&&c&&c')).toBe(true);
		expect(processConditionalExpression(conditionsMap, 'a&&!b&&c')).toBe(true);

	}); // }}}

	test('several conditions combined with OR', () => { // {{{

		expect(processConditionalExpression(conditionsMap, 'a||b')).toBe(true);
		expect(processConditionalExpression(conditionsMap, '!a||b')).toBe(false);
		expect(processConditionalExpression(conditionsMap, '!b||b')).toBe(true);
		expect(processConditionalExpression(conditionsMap, 'c||b||c')).toBe(true);
		expect(processConditionalExpression(conditionsMap, '!c||b||!c||!a')).toBe(false);

	}); // }}}

});
