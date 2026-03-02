import { logger } from '@lib/helpers';
import { useEffect } from 'react';
import { NotificationHandler } from '../utils/NotificationHandler';
import { chatsActionsStore, chatsInteractionsStore } from '@modules/chat/stores/chats';
import { messageActionsStore } from '@modules/chat/stores/message/message-actions/message-actions';
import { waitForWebSocketConnection } from '@lib/mobx-toolbox/mobxSaiWs';

export const useNotifications = (navigation: any) => {
	useEffect(() => {
		const tapSubscription = NotificationHandler.onNotificationTapped((data) => {
			logger.info('useNotifications', `🔔 Opening chat from notification: ${JSON.stringify(data)}`);

			if (data.type !== 'new_message' || !data.chat_id) return;
			chatsInteractionsStore.setNotificationPendingPayload({
				chatId: data.chat_id,
				messageId: data.message_id,
			});
			chatsActionsStore.getChatByChatIdOrUserChatId(data.chat_id, 'chat_id');
		});

		const receiveSubscription = NotificationHandler.onNotificationReceived((data) => {
			logger.info('useNotifications', `📱 New message in foreground: ${data}`);
		});

		const replySubscription = NotificationHandler.onNotificationReply(async (data) => {
			logger.info('useNotifications', `💬 Reply action: ${data}`);

			const replyText = data.reply_text || '';
			const chatId = data.chat_id;
			const messageId = data.message_id;

			if (!replyText || !chatId || !messageId) {
				logger.warn('useNotifications', `Missing required data for reply: replyText=${replyText}, chatId=${chatId}, messageId=${messageId}`);
				return;
			}

			try {
				logger.info('useNotifications', `⏳ Waiting for WebSocket connection...`);
				await waitForWebSocketConnection(10000);
				logger.info('useNotifications', `✅ WebSocket connected, creating message...`);

				const { createMessageAction } = messageActionsStore;

				await createMessageAction({
					chat_id: chatId,
					content: replyText,
					original_content: replyText,
					content_type: 'text',
					reply_to_id: messageId,
					forward_from_message_id: null,
					forward_from_chat_id: null,
					media_group_id: null,
					entities: null,
					caption: null,
				});

				logger.info('useNotifications', `✅ Reply message created successfully`);
			} catch (error) {
				logger.error('useNotifications', `❌ Error creating reply message: ${error}`);
			}
		});

		const markReadSubscription = NotificationHandler.onNotificationMarkAsRead(async (data) => {
			logger.info('useNotifications', `✅ Mark as Read action: ${data}`);

			const messageId = data.message_id;

			if (!messageId) {
				logger.warn('useNotifications', `Missing message_id for mark as read`);
				return;
			}

			try {
				logger.info('useNotifications', `⏳ Waiting for WebSocket connection...`);
				await waitForWebSocketConnection(10000); // Wait up to 10 seconds
				logger.info('useNotifications', `✅ WebSocket connected, marking message as read...`);

				const { markMessagesAsReadAction } = messageActionsStore;

				await markMessagesAsReadAction([messageId]);

				logger.info('useNotifications', `✅ Message marked as read successfully`);
			} catch (error) {
				logger.error('useNotifications', `❌ Error marking message as read: ${error}`);
			}
		});

		return () => {
			tapSubscription?.remove();
			receiveSubscription?.remove();
			replySubscription?.remove();
			markReadSubscription?.remove();
		};
	}, [navigation]);
};

