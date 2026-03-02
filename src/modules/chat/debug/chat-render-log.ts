/**
 * Render logging for chat: enable to prove re-renders are reduced.
 * Set ENABLE_CHAT_RENDER_LOGS = true, run app, do actions, send logs.
 * Format: [ChatRender] <Type> [details] #<count>
 */

export const ENABLE_CHAT_RENDER_LOGS = __DEV__ && true;

const counts = {
	Chat: 0,
	MessagesList: 0,
	MessageItem: 0,
	renderItem: 0,
};

function log(type: keyof typeof counts, detail?: string) {
	if (!ENABLE_CHAT_RENDER_LOGS) return;
	counts[type]++;
	const suffix = detail ? ` ${detail}` : '';
	console.log(`[ChatRender] ${type}${suffix} #${counts[type]}`);
}

export const chatRenderLog = {
	chat: () => log('Chat'),
	messagesList: () => log('MessagesList'),
	messageItem: (msgId: string) => log('MessageItem', `msgId=${msgId}`),
	renderItem: (msgId: string) => log('renderItem', `msgId=${msgId}`),
	getCounts: () => ({ ...counts }),
	reset: () => {
		counts.Chat = 0;
		counts.MessagesList = 0;
		counts.MessageItem = 0;
		counts.renderItem = 0;
	},
};
