import { makeAutoObservable } from 'mobx';
import { messageInteractionsStore } from '../../message';
import { ChatInfo } from '../../chats';
import { reactionsActionsStore } from '../reactions-actions/reactions-actions';
import type { GetMessageMessage } from '../../message/message-actions/types';

class ReactionsInteractionsStore {
	constructor() { makeAutoObservable(this); }

	// HANDLERS

	reactionPressHandler = (reaction: string, selectedChat: ChatInfo, isReactedByYou: boolean, message?: GetMessageMessage) => {
		const { addReactionAction, removeReactionAction } = reactionsActionsStore;

		if (!isReactedByYou) {
			addReactionAction(selectedChat, reaction, message);
			return;
		}

		removeReactionAction(selectedChat, reaction, message);
	};
}

export const reactionsInteractionsStore = new ReactionsInteractionsStore();