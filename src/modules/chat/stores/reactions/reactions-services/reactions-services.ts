import { makeAutoObservable } from 'mobx';
import { ProtoAddReactionResponse, ProtoRemoveReactionResponse } from '../reactions-actions/types';
import { showNotify } from '@core/config/const';
import i18n from 'i18n';
import { logger } from '@lib/helpers';
import { ChatInfo, chatsActionsStore } from 'src/modules/chat/stores/chats';
import { profileStore } from 'src/modules/user/stores/profile';
import type { MarkReactionsAsReadResponse } from 'src/modules/chat/stores/message/message-actions/types';

class ReactionsServicesStore {
	constructor() { makeAutoObservable(this); }

	// HANDLERS

	// ADD REACTION HANDLERS

	addReactionSuccessHandler = (data: ProtoAddReactionResponse) => { };

	addReactionErrorHandler = (error: any) => {
		logger.error('[ReactionsServicesStore] addReactionErrorHandler:', error);
		showNotify('error', { message: i18n.t('add_reaction_error') });
	};

	// REMOVE REACTION HANDLERS

	removeReactionSuccessHandler = (data: ProtoRemoveReactionResponse) => { };

	removeReactionErrorHandler = (error: any) => {
		logger.error('[ReactionsServicesStore] removeReactionErrorHandler:', error);
		showNotify('error', { message: i18n.t('remove_reaction_error') });
	};

	// MARK REACTIONS AS READ HANDLERS (updates getChats unread count)

	subtractUnreadReactionsOptimistic = (chatId: string, messageIds: string[], user_id: string) => {
		const saiUpdater = chatsActionsStore.chats?.saiUpdater;
		if (!saiUpdater || !messageIds?.length) return;

		const subtractCount = messageIds.length;
		const idsSet = new Set(messageIds);

		saiUpdater(
			null,
			null,
			(prev: ChatInfo[]) => {
				if (!prev || !Array.isArray(prev)) return prev;
				return prev.map((chat) => {
					if (chat.id !== chatId) return chat;
					const reactions = chat.unread_info?.reactions;
					const current = reactions?.count ?? 0;
					const next = Math.max(0, current - subtractCount);
					const nextReactionsList = (reactions?.reactions ?? []).filter((id) => !idsSet.has(id));
					return {
						...chat,
						unread_info: {
							...chat.unread_info,
							reactions: {
								...reactions,
								count: next,
								reactions: nextReactionsList,
							},
						},
					};
				});
			},
			"id",
			["getChats", user_id],
			"both"
		);
	};

	markReactionsAsReadSuccessHandler = (data: MarkReactionsAsReadResponse, chatId: string, optimisticSubtractCount = 0) => {
		const { profile } = profileStore;
		const { chats } = chatsActionsStore;

		const user_id = profile?.id;
		const saiUpdater = chats?.saiUpdater;

		const raw = data as any;
		const cleared = raw?.cleared_reaction_count ?? raw?.data?.cleared_reaction_count ?? 0;
		const delta = Math.max(0, cleared - optimisticSubtractCount);

		if (delta === 0) return;
		if (!saiUpdater) return;
		if (!user_id) return;

		saiUpdater(
			null,
			null,
			(prev: ChatInfo[]) => {
				if (!prev || !Array.isArray(prev)) return prev;
				return prev.map((chat) => {
					if (chat.id !== chatId) return chat;
					const reactions = chat.unread_info?.reactions;
					const current = reactions?.count ?? 0;
					const next = Math.max(0, current - delta);
					return {
						...chat,
						unread_info: {
							...chat.unread_info,
							reactions: {
								...reactions,
								count: next,
								reactions: reactions?.reactions ?? [],
							},
						},
					};
				});
			},
			"id",
			["getChats", user_id],
			"both"
		);
	};

	markReactionsAsReadErrorHandler = (error: any) => {
		logger.error('[ReactionsServicesStore] markReactionsAsReadErrorHandler:', error);
	};
}

export const reactionsServicesStore = new ReactionsServicesStore();