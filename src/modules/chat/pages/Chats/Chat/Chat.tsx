import { RootStackParamList } from '@app/router';
import { MESSAGE_LIST_CONFIG, showNotify } from '@core/config/const';
import { Box, MediaPickerUi } from '@core/ui';
import { useHoldMenuSetTopContent } from '@core/ui/HoldMenu/hooks';
import { ChatsWrapper } from '@core/widgets/wrappers';
import { formatExactDate, parseTimestamp } from '@lib/date/index';
import { logger } from '@lib/helpers';
import { getSaiInstanceById } from '@lib/mobx-toolbox/mobxSaiWs';
import { useNavigation, useRoute } from '@lib/navigation';
import { formatId } from '@lib/text';
import { MessageItemWrapper, MessagesList, ProcessedMessage, ProcessedMessageItem } from '@modules/chat/components';
import { chatPerfDebug } from '@modules/chat/debug/chat-perf-debug';
import { DeleteMessagesSheet } from '@modules/chat/widgets/bottomsheets/DeleteMessagesSheet/DeleteMessagesSheet';
import { StickerPackSheet, StickerReorderSheet } from '@modules/chat/widgets/bottomsheets';
import { stickerInteractionsStore } from 'src/modules/sticker/stores/sticker/sticker-interactions/sticker-interactions';
import { ReportsSheet } from '@modules/report/widgets/bottomsheets';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	UIManager,
	View
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { ChatBottomBar, ChatTopBar, ChatTopRightBar, STICKER_PANEL_HEIGHT } from 'src/modules/chat/components/Chat/Bar';
import { DateSeparator, SharedReactionsOverlay, SystemMessage } from 'src/modules/chat/components/Chat/Message';
import { chatsActionsStore, chatsInteractionsStore } from 'src/modules/chat/stores/chats';
import { GetMessageMessage, GetMessagesResponse, messageActionsStore, messageInteractionsStore, messageServicesStore } from 'src/modules/chat/stores/message';
import { themeStore } from 'src/modules/theme/stores';
import { profileStore } from 'src/modules/user/stores/profile';
import { chatRenderLog } from '@modules/chat/debug/chat-render-log';
import { USE_HOLD_ITEM_FOR_MESSAGE_CONTEXT_MENU, USE_HOLD_ITEM_LAZY } from '@modules/chat/shared/config/const';
import { ChatMessageContextMenuLayer } from './ChatMessageContextMenuLayer';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const replyCircleView = 50;

function reactionFingerprint(m: GetMessageMessage | null | undefined): string {
	if (!m) return '';
	const r = (m.reactions || []).map((x: any) => `${x.reaction}:${x.count}`).join('|');
	const rb = (m.reacted_by || []).map((x: any) => `${x.reaction}:${x.sender?.id ?? ''}`).join('|');
	const unread = m.reactions_unreaded ? 1 : 0;
	return `${m.has_reactions ? 1 : 0};${unread};${r};${rb}`;
}

function linkPreviewFingerprint(m: GetMessageMessage | null | undefined): string {
	if (!m?.link_preview) return '';
	const lp = m.link_preview;
	return `${lp.title ?? ''}|${lp.description ?? ''}|${lp.image_url ?? ''}|${lp.link_preview_type ?? 'SMALL'}`;
}

export const Chat = observer(() => {
	chatPerfDebug.chatRender();
	chatRenderLog.chat();

	const { currentTheme } = themeStore;
	const { profile } = profileStore;
	const { chats } = chatsActionsStore;
	const {
		chatMediaOpen: { chatMediaOpen, setChatMediaOpen },
		onChangeChatInput
	} = chatsInteractionsStore;
	const { getMessagesAction, markChatAsReadAction } = messageActionsStore;
	const { setUploadChatMedia } = messageServicesStore;
	const {
		closeStickerPackLinkSheet: closeLinkSheet,
		reorderSheetOpen,
		reorderSheetPack,
		reorderSheetStickers,
		closeReorderSheet,
	} = stickerInteractionsStore;
	const isSelectionMode = messageInteractionsStore.isSelectingMessages.isSelectingMessages;
	const selectedMessageIds = messageInteractionsStore.selectedMessages.selectedMessages;

	const { t } = useTranslation();
	const route = useRoute();
	const navigation = useNavigation();
	const { chatId, selectedChat, scrollToReactionMessageId: scrollToReactionMessageIdParam, scrollToMentionMessageId: scrollToMentionMessageIdParam } = route.params as RootStackParamList['Chat'];
	const handledScrollToReactionRef = useRef<string | null>(null);
	const handledScrollToMentionRef = useRef<string | null>(null);

	const data = getSaiInstanceById<GetMessagesResponse>(`getMessages-null-null-${chatId || "empty"}`)?.data;

	const messagesLength = data?.messages?.length;

	const deferredSignature = useMemo(() => {
		if (!data?.messages) return '';
		return data.messages.map((m: any) => `${m.id}:${m.isTemp ? 'temp' : 'real'}:${m.created_at}:${m.is_read ? 1 : 0}:${m.is_mentioned_you ? 1 : 0}:${reactionFingerprint(m)}:${linkPreviewFingerprint(m)}:${(m.content ?? '')}:${(m.original_content ?? '')}:${m.edit_date ?? 0}`).join('|');
	}, [data?.messages, messagesLength]);

	const keyboardAvoidingViewRef = useRef<KeyboardAvoidingView>(null);
	const scrollProgressRef = useRef(100);
	const scrollProgressForUIRef = useRef(100);

	const [keyboardVisible, setKeyboardVisible] = useState(false);
	const [stickyHeaderIndices, setStickyHeaderIndices] = useState<number[]>([]);
	const [bottomHeight, setBottomHeight] = useState(0);
	const stickerPanelProgress = useSharedValue(0);
	const listWrapperAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: -stickerPanelProgress.value * STICKER_PANEL_HEIGHT }],
	}), []);
	const [processedMessages, setProcessedMessages] = useState<ProcessedMessageItem[]>([]);
	const [scrollProgressForUI, setScrollProgressForUI] = useState(100);
	const [contentPhase, setContentPhase] = useState<'skeleton' | 'content'>('skeleton');
	const activeHoldMessageIdShared = useSharedValue<string | null>(null);
	const processedMessagesCache = useRef<Map<string, ProcessedMessage>>(new Map());
	const hasProcessedMessagesOnce = useRef(false);
	const prevChatIdRef = useRef<string | undefined>(undefined);

	const handleScrollProgressChange = useCallback((progress: number) => {
		scrollProgressRef.current = progress;
		const prev = scrollProgressForUIRef.current;
		const showScrollToBottom = progress < 95;
		const prevShowScrollToBottom = prev < 95;
		if (showScrollToBottom !== prevShowScrollToBottom) {
			scrollProgressForUIRef.current = progress;
			setScrollProgressForUI(progress);
		}
	}, []);

	const chatsData = profile?.id ? getSaiInstanceById<{ chats?: { id: string; unread_info?: { reactions?: { count?: number; reactions?: string[]; }; messages?: { count?: number; }; mentions?: { count?: number; message_ids?: string[]; }; }; }[]; }>(formatId(['getChats', profile.id]))?.data : null;
	const currentChatFromCache = chatsData?.chats?.find((c) => c.id === chatId);
	const reactionCount = currentChatFromCache?.unread_info?.reactions?.count ?? 0;
	const mentionCount = currentChatFromCache?.unread_info?.mentions?.count ?? 0;

	const parseReactionMessageId = useCallback((reactionId: string | undefined): string | undefined => {
		if (!reactionId) return undefined;
		const i = reactionId.indexOf(':');
		return i >= 0 ? reactionId.slice(0, i) : reactionId;
	}, []);

	const handleScrollToReaction = useCallback(() => {
		const raw = currentChatFromCache?.unread_info?.reactions?.reactions?.[0];
		const messageId = parseReactionMessageId(raw);
		let idx = -1;
		if (messageId) {
			idx = processedMessages.findIndex(
				(item: ProcessedMessageItem) => !('type' in item) && (item as ProcessedMessage).id === messageId
			);
		}
		if (idx < 0) {
			idx = processedMessages.findIndex(
				(item: ProcessedMessageItem) => !('type' in item) && (item as ProcessedMessage).reactions_unreaded
			);
		}
		if (idx >= 0) {
			const scrollRef = messageInteractionsStore.messagesScrollRef.messagesScrollRef?.current as any;
			if (scrollRef?.scrollToIndex) {
				scrollRef.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
			}
			const item = processedMessages[idx] as ProcessedMessage;
			if (item?.id && chatId) {
				messageInteractionsStore.markReactionsAsReadForMessage(item);
				messageInteractionsStore.flushReactionsReadBatch(chatId);
			}
		} else {
			logger.debug('ScrollToReaction', `Message with unread reaction not in current list (messageId: ${messageId ?? 'n/a'})`);
		}
	}, [currentChatFromCache?.unread_info?.reactions?.reactions, processedMessages, chatId, parseReactionMessageId]);

	useEffect(() => {
		const prevChatId = prevChatIdRef.current;
		prevChatIdRef.current = chatId;
		if (prevChatId !== undefined && prevChatId !== chatId) {
			handledScrollToReactionRef.current = null;
			handledScrollToMentionRef.current = null;
			setContentPhase('skeleton');
			hasProcessedMessagesOnce.current = false;
			setProcessedMessages([]);
			setStickyHeaderIndices([]);
		}
	}, [chatId]);

	useEffect(() => {
		const rawParam = scrollToReactionMessageIdParam;
		const messageId = rawParam ? parseReactionMessageId(rawParam) : undefined;
		if (!messageId || !chatId || handledScrollToReactionRef.current === messageId) return;
		const messages = data?.messages;
		const inCache = Array.isArray(messages) && messages.some((m: GetMessageMessage) => m.id === messageId);
		const idx = processedMessages.findIndex(
			(item: ProcessedMessageItem) => !('type' in item) && (item as ProcessedMessage).id === messageId
		);
		if (idx >= 0) {
			handledScrollToReactionRef.current = messageId;
			requestAnimationFrame(() => {
				const scrollRef = messageInteractionsStore.messagesScrollRef.messagesScrollRef?.current as any;
				if (scrollRef?.scrollToIndex) {
					scrollRef.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
				}
				const item = processedMessages[idx] as ProcessedMessage;
				if (item?.id) {
					messageInteractionsStore.markReactionsAsReadForMessage(item);
					messageInteractionsStore.flushReactionsReadBatch(chatId);
				}
			});
			navigation.setParams?.({ scrollToReactionMessageId: undefined });
			return;
		}
		if (processedMessages.length > 0 || !inCache) {
			handledScrollToReactionRef.current = messageId;
			showNotify('system', { message: t('fetch_message', 'Fetch message') ?? 'Fetch message' });
			navigation.setParams?.({ scrollToReactionMessageId: undefined });
		}
	}, [scrollToReactionMessageIdParam, chatId, data?.messages, processedMessages, navigation, t, parseReactionMessageId]);

	useEffect(() => {
		const messageId = scrollToMentionMessageIdParam;
		if (!messageId || !chatId || handledScrollToMentionRef.current === messageId) return;
		const messages = data?.messages;
		const inCache = Array.isArray(messages) && messages.some((m: GetMessageMessage) => m.id === messageId);
		const idx = processedMessages.findIndex(
			(item: ProcessedMessageItem) => !('type' in item) && (item as ProcessedMessage).id === messageId
		);
		if (idx >= 0) {
			handledScrollToMentionRef.current = messageId;
			requestAnimationFrame(() => {
				const scrollRef = messageInteractionsStore.messagesScrollRef.messagesScrollRef?.current as any;
				if (scrollRef?.scrollToIndex) {
					scrollRef.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
				}
				const item = processedMessages[idx] as ProcessedMessage;
				if (item?.id) {
					messageInteractionsStore.markMentionAsReadForMessage(item);
					messageInteractionsStore.flushMentionsReadBatch(chatId);
				}
			});
			navigation.setParams?.({ scrollToMentionMessageId: undefined });
			return;
		}
		if (processedMessages.length > 0 || !inCache) {
			handledScrollToMentionRef.current = messageId;
			showNotify('system', { message: t('fetch_message', 'Fetch message') ?? 'Fetch message' });
			navigation.setParams?.({ scrollToMentionMessageId: undefined });
		}
	}, [scrollToMentionMessageIdParam, chatId, data?.messages, processedMessages, navigation, t]);

	const handleScrollToMention = useCallback(() => {
		const messageId = currentChatFromCache?.unread_info?.mentions?.message_ids?.[0];
		if (!messageId) return;
		const idx = processedMessages.findIndex(
			(item: ProcessedMessageItem) => !('type' in item) && (item as ProcessedMessage).id === messageId
		);
		if (idx < 0) {
			const fallbackIdx = processedMessages.findIndex(
				(item: ProcessedMessageItem) => !('type' in item) && (item as ProcessedMessage).is_mentioned_you
			);
			if (fallbackIdx >= 0) {
				const scrollRef = messageInteractionsStore.messagesScrollRef.messagesScrollRef?.current as any;
				if (scrollRef?.scrollToIndex) {
					scrollRef.scrollToIndex({ index: fallbackIdx, animated: true, viewPosition: 0.5 });
				}
				const item = processedMessages[fallbackIdx] as ProcessedMessage;
				if (item?.id && chatId) {
					messageInteractionsStore.markMentionAsReadForMessage(item);
					messageInteractionsStore.flushMentionsReadBatch(chatId);
				}
			}
			return;
		}
		const scrollRef = messageInteractionsStore.messagesScrollRef.messagesScrollRef?.current as any;
		if (scrollRef?.scrollToIndex) {
			scrollRef.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
		}
		const item = processedMessages[idx] as ProcessedMessage;
		if (item?.id && chatId) {
			messageInteractionsStore.markMentionAsReadForMessage(item);
			messageInteractionsStore.flushMentionsReadBatch(chatId);
		}
	}, [currentChatFromCache?.unread_info?.mentions?.message_ids, processedMessages, chatId]);

	const handleMomentumScrollBegin = useCallback(() => {
		const msgIsFocused = messageInteractionsStore.msgIsFocused.msgIsFocused;
		if (msgIsFocused) {
			messageInteractionsStore.msgInputFocus.setMsgInputFocus(p => !p);
		}
	}, []);

	const resetKeyboardAvoidingView = () => {
		if (keyboardAvoidingViewRef.current) {
			const current = keyboardAvoidingViewRef.current as any;
			if (current.updateBottomIfNecessary) {
				current.updateBottomIfNecessary(0);
			}
		}
	};

	const processMessages = useCallback((messages: GetMessageMessage[], chatIdFromResponse?: string) => {
		const t0 = performance.now();
		if (!messages || messages.length === 0) {
			processedMessagesCache.current.clear();
			hasProcessedMessagesOnce.current = true;
			setProcessedMessages([]);
			setStickyHeaderIndices([]);
			return;
		}

		const normalizeTimestamp = (ts: number) => {
			return ts < 1000000000000 ? ts * 1000 : ts;
		};

		const maxReadCreatedAt = messages.some((m) => m.is_read)
			? Math.max(...messages.filter((m) => m.is_read).map((m) => normalizeTimestamp(m.created_at)))
			: 0;
		const currentUserId = profileStore.profile?.id;

		const currentMessageIds = new Set(messages.map(m => m.id));
		const sortedMessages = [...messages];
		const result: ProcessedMessageItem[] = [];
		const dateIndices: number[] = [];

		let currentDate = '';
		let currentGroupMessages: ProcessedMessage[] = [];
		let lastSenderId = '';
		let groupCounter = 0;

		const finishCurrentGroup = () => {
			if (currentGroupMessages.length === 0) return;

			const processedGroup = currentGroupMessages.map((msg, index) => {
				const isFirst = index === 0;
				const isLast = index === currentGroupMessages.length - 1;
				const shouldShowAvatar = isLast;
				const isOwnMessage = currentUserId != null && msg.sender_id === currentUserId;
				const effectiveIsRead = isOwnMessage || (maxReadCreatedAt > 0 && normalizeTimestamp(msg.created_at) <= maxReadCreatedAt);
				const cacheKey = `${msg.id}-${msg.groupId}-${isFirst}-${isLast}-${shouldShowAvatar}-${reactionFingerprint(msg)}-${(msg.content ?? '')}-${(msg.original_content ?? '')}`;
				const cached = processedMessagesCache.current.get(cacheKey);

				if (cached) {
					const editDate = (msg as any).edit_date;
					if (cached.is_read === effectiveIsRead && (cached as any).edit_date === editDate && cached.created_at === msg.created_at) return cached;
					return { ...cached, created_at: msg.created_at, is_read: effectiveIsRead, ...(editDate != null && { edit_date: editDate }) } as ProcessedMessage;
				}

				const updated: ProcessedMessage = {
					...msg,
					chat_id: msg.chat_id ?? chatIdFromResponse,
					is_read: effectiveIsRead,
					isFirstInGroup: isFirst,
					isLastInGroup: isLast,
					showAvatar: shouldShowAvatar,
				};

				processedMessagesCache.current.set(cacheKey, updated);
				return updated;
			});

			result.push(...processedGroup);
			currentGroupMessages = [];
		};

		sortedMessages.forEach((message, index) => {
			const isSystemMessage = message.content_type === "system" || message.is_system_message === true;

			if (isSystemMessage) {
				finishCurrentGroup();

				result.push({
					type: 'system',
					id: `system-${message.id}-${message.created_at}`,
					content: message.content,
					timestamp: message.created_at,
				});

				lastSenderId = '';
				return;
			}

			const messageDate = format(parseTimestamp(message.created_at), 'yyyy-MM-dd');
			const isNewDate = messageDate !== currentDate;
			const isNewSender = message.sender_id !== lastSenderId;
			const currentNormalized = normalizeTimestamp(message.created_at);
			const lastNormalized = currentGroupMessages.length > 0
				? normalizeTimestamp(currentGroupMessages[currentGroupMessages.length - 1].created_at)
				: 0;
			const isTimeDifference = currentGroupMessages.length > 0 && (currentNormalized - lastNormalized) > 600000;

			if (isNewDate) {
				finishCurrentGroup();
				if (result.length > 0 || currentGroupMessages.length > 0) {
					dateIndices.push(result.length);
					result.push({
						type: 'date',
						id: `date-${messageDate}-${message.created_at}`,
						date: messageDate,
						timestamp: message.created_at,
					});
				}
				currentDate = messageDate;
				lastSenderId = '';
			}

			if (isNewSender || isTimeDifference) {
				finishCurrentGroup();
				groupCounter++;
			}

			const isOwnMessage = currentUserId != null && message.sender_id === currentUserId;
			const effectiveIsRead = isOwnMessage || (maxReadCreatedAt > 0 && normalizeTimestamp(message.created_at) <= maxReadCreatedAt);
			const processedMessage: ProcessedMessage = {
				...message,
				chat_id: message.chat_id ?? chatIdFromResponse,
				is_read: effectiveIsRead,
				groupId: `group-${groupCounter}-${message.sender_id}`,
				isFirstInGroup: false,
				isLastInGroup: false,
				showAvatar: false,
				showDate: isNewDate,
			};

			currentGroupMessages.push(processedMessage);
			lastSenderId = message.sender_id;

			if (index === sortedMessages.length - 1) {
				finishCurrentGroup();
			}
		});

		const hasMessagesAfterDate: boolean[] = new Array(result.length).fill(false);
		let seenMessage = false;
		for (let i = result.length - 1; i >= 0; i--) {
			const item = result[i];
			if (!('type' in item) || (item.type !== 'date' && item.type !== 'system')) {
				seenMessage = true;
			}
			if ('type' in item && item.type === 'date') {
				hasMessagesAfterDate[i] = seenMessage;
			}
		}

		const cleanedResult: ProcessedMessageItem[] = [];
		const cleanedIndices: number[] = [];
		for (let i = 0; i < result.length; i++) {
			const item = result[i];
			if ('type' in item && item.type === 'date') {
				if (hasMessagesAfterDate[i]) {
					cleanedResult.push(item);
					cleanedIndices.push(cleanedResult.length - 1);
				}
			} else {
				cleanedResult.push(item);
			}
		}
		cleanedIndices.sort((a, b) => a - b);

		const keysToDelete: string[] = [];
		processedMessagesCache.current.forEach((_, key) => {
			const messageId = key.length >= 36 ? key.slice(0, 36) : key.split('-')[0];
			if (!currentMessageIds.has(messageId)) {
				keysToDelete.push(key);
			}
		});
		keysToDelete.forEach((k) => processedMessagesCache.current.delete(k));

		hasProcessedMessagesOnce.current = true;
		chatPerfDebug.processMessages(cleanedResult.length, performance.now() - t0);
		setProcessedMessages(cleanedResult);
		setStickyHeaderIndices(cleanedIndices);
	}, []);

	useLayoutEffect(() => {
		if (!deferredSignature || !chatId) return;
		const data = getSaiInstanceById<GetMessagesResponse>(`getMessages-null-null-${chatId}`)?.data;
		const latest = data?.messages;
		if (latest) processMessages(latest, data?.chat_id ?? chatId);
	}, [deferredSignature, processMessages, chatId]);

	// Reactions/mentions are marked as read only when the message is in viewport (LeftMessage / MessageReactions mount).
	// No proactive pass over the full list to avoid marking off-screen messages.

	const tempMessagesCount = React.useMemo(() => {
		return data?.messages?.filter((m: any) => m.isTemp).length || 0;
	}, [data?.messages, messagesLength]);

	const previousTempCountRef = useRef(0);

	useEffect(() => {
		const { messagesScrollRef } = messageInteractionsStore.messagesScrollRef;

		if (tempMessagesCount > previousTempCountRef.current && messagesScrollRef?.current) {
			const scrollList = messagesScrollRef.current as any;
			const scrollToBottom = () => {
				if (scrollList?.scrollToOffset) {
					scrollList.scrollToOffset({ offset: 0, animated: false });
				}
			};
			scrollToBottom();
			setTimeout(scrollToBottom, 0);
		}

		previousTempCountRef.current = tempMessagesCount;
	}, [tempMessagesCount]);

	useEffect(() => {
		const keyboardWillShowListener = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
			() => setKeyboardVisible(true),
		);

		const keyboardWillHideListener = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
			() => {
				setKeyboardVisible(false);
				resetKeyboardAvoidingView();
				setTimeout(resetKeyboardAvoidingView, 100);
				setTimeout(resetKeyboardAvoidingView, 300);
			},
		);

		return () => {
			keyboardWillShowListener.remove();
			keyboardWillHideListener.remove();
		};
	}, []);

	const [chatEnterKey, setChatEnterKey] = useState(0);

	useFocusEffect(
		useCallback(() => {
			if (!chatId) return;
			setChatEnterKey((k) => k + 1);
			const cached = profile?.id ? getSaiInstanceById<{ chats?: { id: string; unread_info?: { messages?: { count?: number; }; }; }[]; }>(formatId(['getChats', profile.id]))?.data : null;
			const currentChat = cached?.chats?.find((c) => c.id === chatId);
			const messagesUnreadCount = currentChat?.unread_info?.messages?.count ?? 0;
			if (messagesUnreadCount >= 1) {
				markChatAsReadAction(chatId);
			}
			if (profile?.id && chats?.saiUpdater) {
				chats.saiUpdater(
					null,
					null,
					(prev: any[]) => {
						if (!prev || !Array.isArray(prev)) return prev;
						return prev.map((chat) => {
							if (chat.id !== chatId) return chat;
							const { messages: _m, ...unreadRest } = chat.unread_info || {};
							return {
								...chat,
								unread_info: Object.keys(unreadRest).length > 0 ? unreadRest : undefined,
							};
						});
					},
					"id",
					["getChats", profile.id],
					"both"
				);
			}
			if (messageInteractionsStore.shouldSkipGetMessagesOnFocus()) return;
			getMessagesAction(false, false, chatId);
		}, [chatId, profile?.id, chats?.saiUpdater, markChatAsReadAction, getMessagesAction])
	);

	useLayoutEffect(() => {
		if (!hasProcessedMessagesOnce.current) return;
		setContentPhase('content');
	}, [processedMessages.length]);

	const keyExtractor = useCallback((item: ProcessedMessageItem) => {
		if ('type' in item) {
			if (item.type === 'date') {
				return `date-${item.id || ''}`;
			}
			if (item.type === 'system') {
				return item.id || '';
			}
		}
		return `message-${item.id || ''}`;
	}, []);

	const systemContextMessage = useMemo(
		() => formatExactDate(selectedChat?.created_at ?? 0),
		[selectedChat?.created_at],
	);

	const renderItemRef = useRef({
		profile,
		selectedChat,
		params: route.params as RootStackParamList['Chat'],
		chatEnterKey,
		systemContextMessage,
		isSelectionMode,
		selectedMessageIds,
		activeHoldMessageIdShared,
	});
	renderItemRef.current = {
		profile,
		selectedChat,
		params: route.params as RootStackParamList['Chat'],
		chatEnterKey,
		systemContextMessage,
		isSelectionMode,
		selectedMessageIds,
		activeHoldMessageIdShared,
	};

	const renderItem = useCallback(({ item }: { item: ProcessedMessageItem; index: number; }) => {
		const { profile: p, selectedChat: sc, params: pr, chatEnterKey: cek, systemContextMessage: scm, isSelectionMode: selMode, selectedMessageIds: selIds, activeHoldMessageIdShared: activeHoldShared } = renderItemRef.current;

		if ('type' in item && item.type === 'date') {
			return <DateSeparator timestamp={item.timestamp} isSticky />;
		}

		if ('type' in item && item.type === 'system') {
			return (
				<SystemMessage
					message={item.content}
					contextMessage={scm}
					isSticky
				/>
			);
		}

		const message = item as ProcessedMessage;
		chatPerfDebug.renderItem(message?.id);
		chatRenderLog.renderItem(message?.id ?? '');

		const isSelected = message?.id ? selIds.has(message.id) : false;

		return (
			<Box pointerEvents="box-none" collapsable={false}>
				<MessageItemWrapper
					message={message}
					profile={p}
					selectedChat={sc}
					params={pr}
					chatEnterKey={cek}
					messageListConfig={MESSAGE_LIST_CONFIG}
					isSelected={isSelected}
					isSelectionMode={selMode}
					activeHoldMessageIdShared={USE_HOLD_ITEM_FOR_MESSAGE_CONTEXT_MENU && USE_HOLD_ITEM_LAZY ? activeHoldShared : undefined}
					holdItemId={USE_HOLD_ITEM_FOR_MESSAGE_CONTEXT_MENU && USE_HOLD_ITEM_LAZY ? message.id : undefined}
				/>
			</Box>
		);
	}, []);

	const selectionSignature = useMemo(
		() => (isSelectionMode ? `1-${Array.from(selectedMessageIds).sort().join(',')}` : '0'),
		[isSelectionMode, selectedMessageIds],
	);

	const listExtraData = useMemo(
		() => (deferredSignature ? `${chatEnterKey}-${profile?.id}-${selectedChat?.id}-${messagesLength ?? 0}-${selectionSignature}-${deferredSignature.slice(-32)}` : `${chatEnterKey}-${profile?.id}-${selectedChat?.id}-${messagesLength ?? 0}-${selectionSignature}`),
		[chatEnterKey, profile?.id, selectedChat?.id, messagesLength, selectionSignature, deferredSignature],
	);

	const setMenuTopContent = useHoldMenuSetTopContent();
	useEffect(() => {
		setMenuTopContent(<SharedReactionsOverlay />);
		return () => setMenuTopContent(null);
	}, [setMenuTopContent]);

	return (
		<KeyboardAvoidingView
			ref={keyboardAvoidingViewRef}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			style={{ flex: 1 }}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200}
		>
			<ChatsWrapper
				bottomHeight={bottomHeight}
				setBottomHeight={setBottomHeight}
				noSafeZone
				headerHeight={40}
				midJsx={<ChatTopBar />}
				rightJsx={<ChatTopRightBar />}
				Component={View}
				bottomStyle={{
					paddingBottom: keyboardVisible ? undefined : 0,
				}}
				topBottomBgColor={currentTheme.bg_100}
				bottomJsx={(
					<ChatBottomBar
						onChange={text => onChangeChatInput(text)}
						bottomHeight={bottomHeight}
						scrollProgressForUI={scrollProgressForUI}
						onScrollToReaction={handleScrollToReaction}
						onScrollToMention={handleScrollToMention}
						reactionCount={reactionCount}
						mentionCount={mentionCount}
						stickerPanelProgress={stickerPanelProgress}
					/>
				)}
				scrollEnabled={false}
				leftTop={0}
				rightTop={0}
				isBlurView={true}
				bottomInsenity={30}
				topIntensity={30}
				transparentSafeArea
				wrapperStyle={{ paddingHorizontal: 0, }}
				bottomTransparent
			>
				<Animated.View style={[{ flex: 1 }, listWrapperAnimatedStyle]}>
					<MessagesList
						listKey={chatId}
						processedMessages={processedMessages}
						stickyHeaderIndices={stickyHeaderIndices}
						keyExtractor={keyExtractor}
						renderItem={renderItem}
						bottomHeight={bottomHeight}
						onScrollProgressChange={handleScrollProgressChange}
						extraData={listExtraData}
						contentPhase={contentPhase}
						stickerPanelProgress={stickerPanelProgress}
						stickerPanelHeight={STICKER_PANEL_HEIGHT}
						lastScrollOffsetRef={messageInteractionsStore.lastScrollOffsetRef}
						setMessagesScrollRef={ref => messageInteractionsStore.messagesScrollRef.setMessagesScrollRef(ref)}
						onMomentumScrollBegin={handleMomentumScrollBegin}
					/>
				</Animated.View>
			</ChatsWrapper>

			{!USE_HOLD_ITEM_FOR_MESSAGE_CONTEXT_MENU && (
				<ChatMessageContextMenuLayer
					profile={profile}
					selectedChat={selectedChat ?? null}
					params={route.params as RootStackParamList['Chat']}
					chatEnterKey={chatEnterKey}
				/>
			)}

			<MediaPickerUi
				isVisible={chatMediaOpen}
				onClose={() => setChatMediaOpen(false)}
				onOpen={() => setUploadChatMedia([])}
				onSelectMedia={() => { }}
				includeEditing={true}
				multiple
				needAutoReset
				maxSelections={10}
				onFinish={setUploadChatMedia}
			/>

			<ReportsSheet />

			<DeleteMessagesSheet />

			<StickerPackSheet
				onSaveSuccess={closeLinkSheet}
				onRemoveSuccess={closeLinkSheet}
			/>

			<StickerReorderSheet
				visible={reorderSheetOpen.reorderSheetOpen}
				onClose={closeReorderSheet}
				pack={reorderSheetPack.reorderSheetPack}
				stickers={reorderSheetStickers.reorderSheetStickers}
			/>
		</KeyboardAvoidingView>
	);
});
