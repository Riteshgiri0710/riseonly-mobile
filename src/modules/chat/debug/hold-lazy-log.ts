export const ENABLE_HOLD_LAZY_LOGS = __DEV__;

const seq = { n: 0 };

export function holdLazyLog(step: string, data: Record<string, unknown>) {
	if (!ENABLE_HOLD_LAZY_LOGS) return;
	seq.n += 1;
	console.log(`[HoldLazy] #${seq.n} ${step}`, data);
}

export function holdLazyGetSeq() {
	return seq.n;
}
