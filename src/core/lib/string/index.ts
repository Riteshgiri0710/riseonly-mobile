import { TFunction } from 'i18next';
import { TypingResponse } from 'src/modules/chat/stores/message/message-actions/types';

export const generateSimpleUUID = () => {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = Math.random() * 16 | 0;
		const v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
};

export function hashString(str: string): string {
	let hash = 0;
	if (str.length === 0) return hash.toString();
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // to 32bit
	}
	return hash.toString();
}

export const getTypingText = (typingUsers: TypingResponse[], t: TFunction): string => {
	const typingCount = typingUsers.length;

	if (typingCount === 1) return t('typing.one', { user: typingUsers[0].user_name });
	else if (typingCount === 2) return t('typing.two', { user1: typingUsers[0].user_name, user2: typingUsers[1].user_name });
	else return t('typing.many', { user1: typingUsers[0].user_name, count: typingCount - 1 });
};

export const getWebsocketStatusText = () => {
	let text = "";
	return text;
};