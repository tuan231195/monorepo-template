import { isEven } from '@vdtn359/is-even';

export function isOdd(n: number): boolean {
	return !isEven(n);
}
