import { validateConditionalExpression } from '../../src/lib/conditions';

const conditionsMap = new Map([
	['a', true],
	['b', false],
	['c', true],
]);

describe('validateConditionalExpression', () => {

	test('invalid expressions', () => { // {{{

		expect(() => validateConditionalExpression(conditionsMap, 'a || b && c')).toThrow();
		expect(() => validateConditionalExpression(conditionsMap, 'b && c || a')).toThrow();

	}); // }}}

	test('single condition', () => { // {{{

		expect(validateConditionalExpression(conditionsMap, 'a')).toBe(true);
		expect(validateConditionalExpression(conditionsMap, 'b')).toBe(false);
		expect(validateConditionalExpression(conditionsMap, '!b')).toBe(true);

	}); // }}}

	test('several conditions combined with AND', () => { // {{{

		expect(validateConditionalExpression(conditionsMap, 'a && b')).toBe(false);
		expect(validateConditionalExpression(conditionsMap, 'a && c')).toBe(true);
		expect(validateConditionalExpression(conditionsMap, 'a && b && c')).toBe(false);
		expect(validateConditionalExpression(conditionsMap, 'a && c && c')).toBe(true);
		expect(validateConditionalExpression(conditionsMap, 'a && !b && c')).toBe(true);

	}); // }}}

	test('several conditions combined with OR', () => { // {{{

		expect(validateConditionalExpression(conditionsMap, 'a || b')).toBe(true);
		expect(validateConditionalExpression(conditionsMap, '!a || b')).toBe(false);
		expect(validateConditionalExpression(conditionsMap, '!b || b')).toBe(true);
		expect(validateConditionalExpression(conditionsMap, 'c || b || c')).toBe(true);
		expect(validateConditionalExpression(conditionsMap, '!c || b || !c || !a')).toBe(false);

	}); // }}}

});
