import { isOdd } from './index';

describe('Test isOdd', () => {
	test('it detects even numbers', () => {
		expect(isOdd(0)).toBe(false);
		expect(isOdd(2)).toBe(false);
		expect(isOdd(4)).toBe(false);
		expect(isOdd(10)).toBe(false);
		expect(isOdd(132)).toBe(false);
	});

	test.only('it detects odd numbers', () => {
		expect(isOdd(1)).toBe(true);
		expect(isOdd(3)).toBe(true);
		expect(isOdd(5)).toBe(true);
		expect(isOdd(11)).toBe(true);
		expect(isOdd(133)).toBe(true);
	});
});
