import { useMobxContextMenu } from '@core/stores/global-interactions';
import { getServerId } from '@utils/functions';
import { checker } from '@lib/helpers';
import { getCurrentRoute } from '@lib/navigation';
import { makeAutoObservable } from 'mobx';
import { MobxUpdateInstance, mobxState } from 'mobx-toolbox';
import { RefObject } from 'react';
import { SharedValue } from 'react-native-reanimated';
import { ChatInfo, chatsActionsStore, chatsInteractionsStore } from 'src/modules/chat/stores/chats';
import { User, profileStore } from 'src/modules/user/stores/profile';
import { messageActionsStore } from '../message-actions/message-actions';
import { reactionsActionsStore } from '../../reactions';
import { CreateMessageBody, GetMessageMessage, GetMessagesResponse } from '../message-actions/types';
import { messageServicesStore } from '../message-services/message-services';

const REACTIONS_READ_DEBOUNCE_MS = 1000;
const MAX_REACTIONS_READ_BATCH = 100;
const MENTIONS_READ_DEBOUNCE_MS = 1000;
const MAX_MENTIONS_READ_BATCH = 100;

export let isSelectingMessagesSharedValue: SharedValue<boolean> | null = null;

export const getIsSelectingMessagesSharedValue = (): SharedValue<boolean> | null => {
	return isSelectingMessagesSharedValue;
};

export const setIsSelectingMessagesSharedValue = (value: SharedValue<boolean>) => {
	isSelectingMessagesSharedValue = value;
};

class MessageInteractionsStore {
	constructor() { makeAutoObservable(this); }

	// INPUTS

	msgText = mobxState("")("msgText");
	msgCloneText = mobxState("")("msgCloneText");
	msgRawText = mobxState("")("msgRawText");
	msgInputFocus = mobxState(false)("msgInputFocus");
	msgIsFocused = mobxState(false)("msgIsFocused");

	// MESSAGES

	selectedMessage = mobxState<GetMessageMessage | null>(null)("selectedMessage");
	selectedMessageForContextMenu = mobxState<GetMessageMessage | null>(null)("selectedMessageForContextMenu");
	messageMenuLayout = mobxState<{ x: number; y: number; width: number; height: number; transformValue?: number; } | null>(null)("messageMenuLayout");
	deleteMessagesSheet = mobxState<{ isOpen: boolean; messageIds: string[]; }>({ isOpen: false, messageIds: [] })("deleteMessagesSheet");
	selectedMessageToReply = mobxState<GetMessageMessage | null>(null)("selectedMessageToReply");
	draftBeforeEdit = mobxState<string>("")("draftBeforeEdit");
	contextMenuChatParams = mobxState<Record<string, any> | null>(null)("contextMenuChatParams");

	// IS

	isSendingMessage = mobxState(false)("isSendingMessage");
	isSelectingMessages = mobxState(false)("isSelectingMessages");

	// SELECTED MESSAGES

	selectedMessages = mobxState<Set<string>>(new Set())("selectedMessages");

	toggleMessageSelection = (messageId: string) => {
		const { selectedMessages: { selectedMessages, setSelectedMessages } } = this;
		const newSet = new Set(selectedMessages);

		if (newSet.has(messageId)) {
			newSet.delete(messageId);
		} else {
			if (newSet.size >= 100) {
				return;
			}
			newSet.add(messageId);
		}

		setSelectedMessages(newSet);
	};

	clearSelectedMessages = () => {
		this.selectedMessages.setSelectedMessages(new Set());
	};

	exitSelectionMode = () => {
		this.isSelectingMessages.setIsSelectingMessages(false);
		this.updateSharedValue(false);
		this.clearSelectedMessages();
	};

	updateSharedValue = (value: boolean) => {
		const sharedValue = getIsSelectingMessagesSharedValue();
		if (sharedValue) {
			sharedValue.value = value;
		}
	};

	private _reactionsReadPendingByChat = new Map<string, Set<string>>();
	private _reactionsReadTimersByChat = new Map<string, ReturnType<typeof setTimeout>>();
	private _mentionsReadPendingByChat = new Map<string, Set<string>>();
	private _mentionsReadTimersByChat = new Map<string, ReturnType<typeof setTimeout>>();

	private _subtractUnreadMentionsOptimistic = (chatId: string, messageIds: string[], user_id: string) => {
		const saiUpdater = chatsActionsStore.chats?.saiUpdater;
		if (!saiUpdater || !messageIds.length) return;
		const idsSet = new Set(messageIds);
		const subtractCount = messageIds.length;
		saiUpdater(
			null,
			null,
			(prev: ChatInfo[]) => {
				if (!prev || !Array.isArray(prev)) return prev;
				return prev.map((chat) => {
					if (chat.id !== chatId) return chat;
					const mentions = chat.unread_info?.mentions;
					const currentCount = mentions?.count ?? 0;
					const nextCount = Math.max(0, currentCount - subtractCount);
					const nextIds = (mentions?.message_ids ?? []).filter((id) => !idsSet.has(id));
					return {
						...chat,
						unread_info: {
							...chat.unread_info,
							mentions: nextCount > 0 || nextIds.length > 0 ? { message_ids: nextIds, count: nextCount } : undefined,
						},
					};
				});
			},
			"id",
			["getChats", user_id],
			"both"
		);
	};

	private _flushMentionsReadBatch = async (chatId: string) => {
		const pending = this._mentionsReadPendingByChat.get(chatId);
		if (!pending || pending.size === 0) {
			this._mentionsReadTimersByChat.delete(chatId);
			return;
		}
		const ids = Array.from(pending).slice(0, MAX_MENTIONS_READ_BATCH);
		ids.forEach((id) => pending.delete(id));
		if (pending.size === 0) this._mentionsReadPendingByChat.delete(chatId);
		this._mentionsReadTimersByChat.delete(chatId);
		const profile = await profileStore.getMyProfile();
		const user_id = profile?.id;
		if (user_id) {
			this._subtractUnreadMentionsOptimistic(chatId, ids, user_id);
			messageActionsStore.markMessageAsMentionedReadAction(ids);
		}
		if (pending.size > 0) {
			this._mentionsReadTimersByChat.set(
				chatId,
				setTimeout(() => this._flushMentionsReadBatch(chatId), MENTIONS_READ_DEBOUNCE_MS)
			);
		}
	};

	flushMentionsReadBatch = (chatId: string) => {
		this._flushMentionsReadBatch(chatId);
	};

	markMentionAsReadForMessage = (message: GetMessageMessage) => {
		const chatId = message.chat_id ?? (message as { chat?: { id?: string; }; }).chat?.id;
		if (!chatId) return;
		const messages = messageActionsStore.messages;
		if (messages?.saiUpdater) {
			messages.saiUpdater(
				null,
				null,
				(prev: GetMessageMessage[]) => {
					if (!prev || !Array.isArray(prev)) return prev;
					return prev.map((m) =>
						m.id === message.id ? { ...m, is_mentioned_you: false } : m
					);
				},
				"id",
				`getMessages-null-null-${chatId}`,
				"both"
			);
		}
		let pending = this._mentionsReadPendingByChat.get(chatId);
		if (!pending) {
			pending = new Set<string>();
			this._mentionsReadPendingByChat.set(chatId, pending);
		}
		pending.add(message.id);
		const existingTimer = this._mentionsReadTimersByChat.get(chatId);
		if (existingTimer) {
			clearTimeout(existingTimer);
			this._mentionsReadTimersByChat.delete(chatId);
		}
		if (pending.size >= MAX_MENTIONS_READ_BATCH) {
			this._flushMentionsReadBatch(chatId);
		} else {
			this._mentionsReadTimersByChat.set(
				chatId,
				setTimeout(() => this._flushMentionsReadBatch(chatId), MENTIONS_READ_DEBOUNCE_MS)
			);
		}
	};

	private _flushReactionsReadBatch = (chatId: string) => {
		const pending = this._reactionsReadPendingByChat.get(chatId);
		if (!pending || pending.size === 0) {
			this._reactionsReadTimersByChat.delete(chatId);
			return;
		}
		const ids = Array.from(pending).slice(0, MAX_REACTIONS_READ_BATCH);
		ids.forEach((id) => pending.delete(id));
		if (pending.size === 0) this._reactionsReadPendingByChat.delete(chatId);
		this._reactionsReadTimersByChat.delete(chatId);
		reactionsActionsStore.markReactionsAsReadAction(chatId, ids);
		if (pending.size > 0) {
			this._reactionsReadTimersByChat.set(
				chatId,
				setTimeout(() => this._flushReactionsReadBatch(chatId), REACTIONS_READ_DEBOUNCE_MS)
			);
		}
	};

	flushReactionsReadBatch = (chatId: string) => {
		this._flushReactionsReadBatch(chatId);
	};

	markReactionsAsReadForMessage = (message: GetMessageMessage) => {
		const chatId = message.chat_id ?? (message as { chat?: { id?: string; }; }).chat?.id;
		if (!chatId) return;
		const messages = messageActionsStore.messages;
		if (messages?.saiUpdater) {
			messages.saiUpdater(
				null,
				null,
				(prev: GetMessageMessage[]) => {
					if (!prev || !Array.isArray(prev)) return prev;
					return prev.map((m) =>
						m.id === message.id ? { ...m, reactions_unreaded: false } : m
					);
				},
				"id",
				`getMessages-null-null-${chatId}`,
				"both"
			);
		}
		let pending = this._reactionsReadPendingByChat.get(chatId);
		if (!pending) {
			pending = new Set<string>();
			this._reactionsReadPendingByChat.set(chatId, pending);
		}
		pending.add(message.id);
		const existingTimer = this._reactionsReadTimersByChat.get(chatId);
		if (existingTimer) {
			clearTimeout(existingTimer);
			this._reactionsReadTimersByChat.delete(chatId);
		}
		if (pending.size >= MAX_REACTIONS_READ_BATCH) {
			this._flushReactionsReadBatch(chatId);
		} else {
			this._reactionsReadTimersByChat.set(
				chatId,
				setTimeout(() => this._flushReactionsReadBatch(chatId), REACTIONS_READ_DEBOUNCE_MS)
			);
		}
	};

	replyMessageHandler = async (message: GetMessageMessage | null = null) => {
		const { getMyProfile } = profileStore;
		const { chats: { saiUpdater } } = chatsActionsStore;
		const { selectedChat, setSelectedChat } = chatsInteractionsStore;

		checker(saiUpdater, "saiUpdater is not defined");

		const user = await getMyProfile();

		saiUpdater(
			null,
			null,
			(prev: ChatInfo[]) => {
				return prev.map((chat) => chat.id === selectedChat?.id ? { ...chat, selectedMessageToReply: message, selectedMessageToEdit: null } : chat);
			},
			"id",
			["getChats", user.id],
			"both"
		);

		checker(selectedChat, "no selectedChat");

		setSelectedChat({
			...selectedChat,
			selectedMessageToReply: message,
			selectedMessageToEdit: null
		});
	};

	editMessageHandler = async (message: GetMessageMessage | null = null) => {
		const { getMyProfile } = profileStore;
		const { chats: { saiUpdater } } = chatsActionsStore;
		const { selectedChat, setSelectedChat } = chatsInteractionsStore;
		const { msgText: { msgText, setMsgText }, msgRawText: { setMsgRawText }, draftBeforeEdit: { draftBeforeEdit, setDraftBeforeEdit } } = this;

		checker(saiUpdater, "saiUpdater is not defined");

		const user = await getMyProfile();

		saiUpdater(
			null,
			null,
			(prev: ChatInfo[]) => {
				return prev.map((chat) => chat.id === selectedChat?.id ? { ...chat, selectedMessageToEdit: message, selectedMessageToReply: null } : chat);
			},
			"id",
			["getChats", user.id],
			"both"
		);

		checker(selectedChat, "no selectedChat");

		setSelectedChat({
			...selectedChat,
			selectedMessageToEdit: message,
			selectedMessageToReply: null
		});

		if (message) {
			if (!selectedChat?.selectedMessageToEdit) {
				setDraftBeforeEdit(msgText ?? "");
			}
			setMsgText(message.content ?? "");
			setMsgRawText(message.content ?? "");
		} else {
			setMsgText(draftBeforeEdit ?? "");
			setMsgRawText(draftBeforeEdit ?? "");
			setDraftBeforeEdit("");
		}
	};

	private skipGetMessagesUntil = 0;
	private static readonly SKIP_GET_MESSAGES_MS = 2500;

	shouldSkipGetMessagesOnFocus = (): boolean => {
		const now = Date.now();
		if (now < this.skipGetMessagesUntil) return true;
		return false;
	};

	setSkipGetMessagesOnFocus = () => {
		this.skipGetMessagesUntil = Date.now() + MessageInteractionsStore.SKIP_GET_MESSAGES_MS;
	};

	// REFS

	messagesScrollRef = mobxState<RefObject<null> | null>(null)("messagesScrollRef");
	mediaMessagesScrollRef = mobxState<RefObject<null> | null>(null)("mediaMessagesScrollRef");
	/** Current list contentOffset.y, updated on scroll (for sticker panel scroll compensation) */
	lastScrollOffsetRef = { current: 0 };

	// CONTEXT MENU

	msgContextMenu = useMobxContextMenu();

	// HOLD CONTEXT MENU

	itemCordinates = mobxState<{ x: number, y: number; }>({ x: 0, y: 0 })("itemCordinates");

	// ========== REMOVED: Manual queue logic - now handled by mobxSaiWs library ==========

	// HANDLERS

	onSendMsgHandler = async () => {
		const { selectedChat } = chatsInteractionsStore;
		const { createMessageAction, editMessageAction } = messageActionsStore;
		const { uploadChatMedia } = messageServicesStore;
		const { profile } = profileStore;
		const {
			msgText: { msgText, setMsgText },
			msgRawText: { setMsgRawText },
			isSendingMessage: { isSendingMessage, setIsSendingMessage },
		} = this;

		const hasMedia = uploadChatMedia.length > 0;
		const hasText = msgText && msgText.trim().length > 0;
		const editing = !!selectedChat?.selectedMessageToEdit;

		if (isSendingMessage) return;
		if (editing) {
			if (!hasText) return;
			const messageText = msgText!.trim();
			const user_id = profile?.id;
			if (!user_id || !selectedChat?.id || !selectedChat.selectedMessageToEdit) return;
			editMessageAction({
				user_id,
				message_id: getServerId(selectedChat.selectedMessageToEdit),
				content: messageText,
				chat_id: selectedChat.id,
				previous_content: selectedChat.selectedMessageToEdit.content ?? undefined,
			});
			this.editMessageHandler(null);
			setMsgText("");
			setMsgRawText("");
			return;
		}

		if (!hasText && !hasMedia) return;

		const messageText = hasText ? msgText!.trim() : "";

		const wasFocused = this.msgIsFocused.msgIsFocused;

		setIsSendingMessage(true);

		setMsgText("");
		setMsgRawText("");
		setTimeout(() => {
			setMsgText("");
			setMsgRawText("");
		}, 0);

		if (wasFocused) {
			setTimeout(() => {
				this.msgInputFocus.setMsgInputFocus(true);
			}, 0);
		}

		const params: {
			chatId: string;
			previewUser: User;
		} = getCurrentRoute()?.params as any;

		if (!selectedChat && !params?.previewUser) {
			setIsSendingMessage(false);
			if (wasFocused) {
				this.msgInputFocus.setMsgInputFocus(true);
			}
			return;
		}

		if (!hasMedia && !hasText) {
			return;
		}

		const contentType = hasMedia
			? (uploadChatMedia[0]?.type?.startsWith?.("video") ? "video" : "image")
			: "text";
		const replyToMsg = selectedChat?.selectedMessageToReply;
		let reply_to_id: string | null = null;

		if (replyToMsg && selectedChat?.id) {
			const cachedMessages = (messageActionsStore.messages?.data as GetMessagesResponse | undefined)?.messages ?? [];
			const fromCache = cachedMessages.find((m: GetMessageMessage) => m.id === replyToMsg.id || (m as any).server_id === replyToMsg.id);
			const serverId = getServerId(fromCache ?? replyToMsg);
			reply_to_id = serverId || null;
		}

		const body: CreateMessageBody = {
			"content": messageText || "",
			"original_content": messageText || "",
			"reply_to_id": reply_to_id,
			"forward_from_message_id": null,
			"forward_from_chat_id": null,
			"media_group_id": null,
			"entities": null,
			"caption": messageText || null,
			"content_type": contentType
		};

		createMessageAction(body);

		this.replyMessageHandler();

		if (hasMedia) {
			messageServicesStore.setUploadChatMedia([]);
		}

		setIsSendingMessage(false);

		if (wasFocused) {
			this.msgInputFocus.setMsgInputFocus(true);
		}
	};

	// UPDATERS

	messageUpdater: MobxUpdateInstance<GetMessageMessage> | null = null;
	setMessageUpdater = (updater: MobxUpdateInstance<GetMessageMessage>) => this.messageUpdater = updater;

}

export const messageInteractionsStore = new MessageInteractionsStore();