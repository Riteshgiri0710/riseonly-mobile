/**
 * Chat scroll performance debug.
 * Set CHAT_PERF_DEBUG = true to enable. Logs are throttled to avoid adding load.
 */

const CHAT_PERF_DEBUG = __DEV__ && false; // Set true to enable scroll perf logs

let scrollEventCount = 0;
let scrollProgressSetStateCount = 0;
let chatRenderCount = 0;
let renderItemCallCount = 0;
let lastLogTime = 0;
let processMessagesLastTime = 0;
let dataScopeOnScrollCount = 0;

export const chatPerfDebug = {
	scrollEvent: () => {
		if (!CHAT_PERF_DEBUG) return;
		scrollEventCount++;
		chatPerfDebug.maybeLogSummary();
	},

	scrollProgressSetState: () => {
		if (!CHAT_PERF_DEBUG) return;
		scrollProgressSetStateCount++;
		console.log('[ChatPerf] setScrollProgressForUI called');
	},

	dataScopeOnScroll: () => {
		if (!CHAT_PERF_DEBUG) return;
		dataScopeOnScrollCount++;
		chatPerfDebug.maybeLogSummary();
	},

	chatRender: () => {
		if (!CHAT_PERF_DEBUG) return;
		chatRenderCount++;
		chatPerfDebug.maybeLogSummary();
	},

	renderItem: (msgId?: string) => {
		if (!CHAT_PERF_DEBUG) return;
		renderItemCallCount++;
		chatPerfDebug.maybeLogSummary();
	},

	processMessages: (msgCount: number, durationMs: number) => {
		if (!CHAT_PERF_DEBUG) return;
		processMessagesLastTime = durationMs;
		console.log(`[ChatPerf] processMessages: ${msgCount} msgs, ${durationMs.toFixed(1)}ms`);
	},

	messagesSignatureCompute: (msgCount: number, durationMs: number) => {
		if (!CHAT_PERF_DEBUG) return;
		if (durationMs > 5) {
			console.log(`[ChatPerf] messagesSignature: ${msgCount} msgs, ${durationMs.toFixed(1)}ms (SLOW)`);
		}
	},

	performScrollFetch: (direction: string) => {
		if (!CHAT_PERF_DEBUG) return;
		console.log(`[ChatPerf] performScrollFetch: ${direction}`);
	},

	maybeLogSummary: () => {
		const now = Date.now();
		if (now - lastLogTime < 1000) return;
		lastLogTime = now;
		console.log(
			`[ChatPerf] 1s summary: scrollEvents=${scrollEventCount} dataScopeScroll=${dataScopeOnScrollCount} chatRenders=${chatRenderCount} renderItemCalls=${renderItemCallCount} scrollProgressSetState=${scrollProgressSetStateCount}`
		);
		scrollEventCount = 0;
		dataScopeOnScrollCount = 0;
		chatRenderCount = 0;
		renderItemCallCount = 0;
		scrollProgressSetStateCount = 0;
	},

	reset: () => {
		scrollEventCount = 0;
		scrollProgressSetStateCount = 0;
		chatRenderCount = 0;
		renderItemCallCount = 0;
		dataScopeOnScrollCount = 0;
		lastLogTime = 0;
	},
};
