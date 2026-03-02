const REVEAL_PER_FRAME = 4;
type RevealCallback = () => void;

const queue: RevealCallback[] = [];
let rafId: number | null = null;

function drain() {
	rafId = null;
	let n = REVEAL_PER_FRAME;
	while (n > 0 && queue.length > 0) {
		const cb = queue.shift();
		if (cb) {
			try {
				cb();
			} catch (_) { }
			n--;
		}
	}
	if (queue.length > 0) {
		rafId = requestAnimationFrame(drain);
	}
}

export function scheduleReveal(callback: RevealCallback): void {
	queue.push(callback);
	if (rafId === null) {
		rafId = requestAnimationFrame(drain);
	}
}

export function resetDeferredMessageContent(): void {
	queue.length = 0;
	if (rafId !== null) {
		cancelAnimationFrame(rafId);
		rafId = null;
	}
}
