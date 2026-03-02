import { RootStackParamList } from '@app/router';
import { messageActionsStore, messageInteractionsStore, GetMessageMessage } from '@modules/chat/stores/message';
import { runInAction } from 'mobx';
import React, { memo, useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent, Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native-bidirectional-infinite-scroll';
import { Box } from '@core/ui';
import { HoldItem } from '@core/ui/HoldMenu';
import { getMessageContextMenuActionsForMessage } from '@modules/chat/shared/config/context-menu-data';
import { MESSAGE_HOLD_CONTEXT_MENU_WIDTH, USE_HOLD_ITEM_FOR_MESSAGE_CONTEXT_MENU, USE_HOLD_ITEM_LAZY } from '@modules/chat/shared/config/const';
import { LeftMessage } from '../Message/LeftMessage/LeftMessage';
import { replyCircleView, RightMessage } from '../Message/RightMessage/RightMessage';
import { resetDeferredMessageContent } from '../Message/MessageContent/deferredMessageContent';
import { MESSAGE_LIST_CONFIG, type MessageListConfig } from '@core/config/const';
import { chatPerfDebug } from '@modules/chat/debug/chat-perf-debug';
import { chatRenderLog } from '@modules/chat/debug/chat-render-log';
import { ENABLE_HOLD_LAZY_LOGS } from '@modules/chat/debug/hold-lazy-log';
import type { SharedValue } from 'react-native-reanimated';

export interface ProcessedMessage extends GetMessageMessage {
	groupId: string;
	isFirstInGroup: boolean;
	isLastInGroup: boolean;
	showAvatar: boolean;
	showDate: boolean;
}

export type ProcessedMessageItem = ProcessedMessage | { type: 'date'; id: string; date: string; timestamp: number; } | { type: 'system'; id: string; content: string; timestamp: number; };

interface MessagesListProps {
	processedMessages: ProcessedMessageItem[];
	stickyHeaderIndices: number[];
	keyExtractor: (item: ProcessedMessageItem) => string;
	renderItem: ({ item, index }: { item: ProcessedMessageItem; index: number; }) => React.ReactElement;
	bottomHeight: number;
	onScrollProgressChange?: (progress: number) => void;
	listKey?: string;
	extraData?: number | string;
	contentPhase: "skeleton" | "content";
	/** When set, list content paddingBottom animates so messages can scroll under the sticker panel */
	stickerPanelProgress?: SharedValue<number>;
	stickerPanelHeight?: number;
	/** Pass from Chat to avoid reading store in render (fewer re-renders) */
	lastScrollOffsetRef?: React.MutableRefObject<number>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	setMessagesScrollRef?: (ref: any) => void;
	onMomentumScrollBegin?: () => void;
}

const noopPromise = () => Promise.resolve();
const noop = () => { };

export { MessageSkeletonList } from './MessageSkeleton';

export const MessagesList = memo(({
	processedMessages,
	stickyHeaderIndices,
	keyExtractor,
	renderItem,
	bottomHeight,
	onScrollProgressChange,
	listKey,
	extraData,
	contentPhase,
	stickerPanelProgress,
	stickerPanelHeight = 0,
	lastScrollOffsetRef: lastScrollOffsetRefProp,
	setMessagesScrollRef: setMessagesScrollRefProp,
	onMomentumScrollBegin: onMomentumScrollBeginProp,
}: MessagesListProps) => {
	chatRenderLog.messagesList();

	const scrollRef = useRef<any>(null);
	const fallbackScrollOffsetRef = useRef(0);
	const noopSetRef = useCallback(() => {}, []);
	const lastScrollOffsetRef = lastScrollOffsetRefProp ?? fallbackScrollOffsetRef;
	const setMessagesScrollRef = setMessagesScrollRefProp ?? noopSetRef;
	const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

	const BOTTOM_GAP = 12;
	const contentContainerStyle = useMemo(() => ({
		paddingHorizontal: replyCircleView,
		paddingBottom: BOTTOM_GAP,
		paddingTop: 90,
		flexGrow: 1,
		justifyContent: 'flex-end' as const,
	}), []);

	const handleScrollInternal = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		chatPerfDebug.scrollEvent();
		const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

		lastScrollOffsetRef.current = contentOffset.y;

		if (onScrollProgressChange) {
			const scrollTop = contentOffset.y;
			const scrollHeight = contentSize.height;
			const clientHeight = layoutMeasurement.height;
			const progress = scrollHeight > clientHeight
				? Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
				: 100;

			onScrollProgressChange(progress);
		}

		chatPerfDebug.dataScopeOnScroll();
		messageActionsStore.messages?.options?.dataScope?.onScroll?.(event);
	}, [onScrollProgressChange, lastScrollOffsetRef]);

	const handleMomentumScrollBegin = useCallback(() => {
		if (onMomentumScrollBeginProp) {
			onMomentumScrollBeginProp();
			return;
		}
		const msgIsFocused = messageInteractionsStore.msgIsFocused.msgIsFocused;
		if (msgIsFocused) {
			messageInteractionsStore.msgInputFocus.setMsgInputFocus(p => !p);
		}
	}, [onMomentumScrollBeginProp]);

	const onScrollToIndexFailed = useCallback((info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number; }) => {
		const wait = 100;
		setTimeout(() => {
			scrollRef.current?.scrollToIndex?.({ index: info.index, animated: true, viewPosition: 0.5 });
		}, wait);
	}, []);

	useEffect(() => {
		if (!scrollRef.current) return;
		setMessagesScrollRef(scrollRef as any);
	}, [scrollRef]);

	useEffect(() => {
		resetDeferredMessageContent();
	}, [listKey]);

	useEffect(() => {
		if (isScrolledToBottom) return;
		if (processedMessages.length > 0) {
			requestAnimationFrame(() => {
				scrollRef.current?.scrollToOffset({ offset: 0, animated: false });
				setIsScrolledToBottom(true);
			});
		}
	}, [processedMessages.length, isScrolledToBottom]);

	const flatListProps = useMemo(() => ({
		ref: scrollRef,
		data: processedMessages,
		renderItem,
		keyExtractor,
		extraData,
		inverted: true,
		contentContainerStyle,
		style: {
			backgroundColor: 'transparent' as const,
			...(Platform.OS === 'ios' && { clipsToBounds: false }),
		},
		onScroll: handleScrollInternal,
		onMomentumScrollBegin: handleMomentumScrollBegin,
		scrollEventThrottle: 32,
		keyboardShouldPersistTaps: 'handled' as const,
		keyboardDismissMode: 'interactive' as const,
		onStartReached: noopPromise,
		onEndReached: noopPromise,
		showDefaultLoadingIndicators: false,
		onStartReachedThreshold: 200,
		onEndReachedThreshold: 200,
		initialNumToRender: 10,
		maxToRenderPerBatch: 8,
		windowSize: 9,
		updateCellsBatchingPeriod: 50,
		removeClippedSubviews: true,
		onScrollToIndexFailed,
	}), [
		processedMessages,
		renderItem,
		keyExtractor,
		extraData,
		handleScrollInternal,
		handleMomentumScrollBegin,
		onScrollToIndexFailed,
		stickyHeaderIndices,
		contentPhase,
		contentContainerStyle,
	]);

	return <FlatList {...(flatListProps as any)} />;
}, (prevProps, nextProps) => {
	return (
		prevProps.processedMessages === nextProps.processedMessages &&
		prevProps.bottomHeight === nextProps.bottomHeight &&
		prevProps.stickyHeaderIndices === nextProps.stickyHeaderIndices &&
		prevProps.listKey === nextProps.listKey &&
		prevProps.extraData === nextProps.extraData &&
		prevProps.stickerPanelProgress === nextProps.stickerPanelProgress &&
		prevProps.stickerPanelHeight === nextProps.stickerPanelHeight
	);
});

interface MessageItemWrapperProps {
	message: ProcessedMessage;
	profile: any;
	selectedChat: any;
	params: RootStackParamList['Chat'];
	chatEnterKey: number;
	messageListConfig?: MessageListConfig;
	isSelected?: boolean;
	isSelectionMode?: boolean;
	activeHoldMessageIdShared?: import('react-native-reanimated').SharedValue<string | null>;
	holdItemId?: string;
}

function reactionEqual(a: ProcessedMessage['reactions'], b: ProcessedMessage['reactions']) {
	if (a === b) return true;
	if (!a || !b || a.length !== b.length) return false;
	return a.every((x, i) => x?.reaction === b[i]?.reaction && x?.count === b[i]?.count);
}

function reactedByEqual(a: ProcessedMessage['reacted_by'], b: ProcessedMessage['reacted_by']) {
	if (a === b) return true;
	if (!a || !b || a.length !== b.length) return false;
	return a.every((x, i) => x?.reaction === b[i]?.reaction && x?.sender?.id === b[i]?.sender?.id);
}

const MessageItemWrapperInner = ({
	message,
	profile,
	selectedChat,
	params,
	chatEnterKey,
	messageListConfig: config = MESSAGE_LIST_CONFIG,
	isSelected = false,
	isSelectionMode = false,
	activeHoldMessageIdShared,
	holdItemId,
}: MessageItemWrapperProps) => {
	chatRenderLog.messageItem(message?.id ?? '');
	const renderCountRef = useRef(0);
	renderCountRef.current += 1;
	if (ENABLE_HOLD_LAZY_LOGS) {
		console.log('[HoldLazy] MessageItemWrapper render', { msgId: message?.id, renderCount: renderCountRef.current });
	}

	const { t } = useTranslation();
	const containerRef = useRef<View>(null);
	const showAvatar = config.showAvatar && message.showAvatar;
	const style = useMemo(
		() => ({ marginTop: message.isFirstInGroup ? 3 : 2 }),
		[message.isFirstInGroup],
	);

	const isMyMessage = message?.sender?.id === profile?.id;

	const onLongPressLayer = useCallback(() => {
		requestAnimationFrame(() => {
			(containerRef.current as any)?.measureInWindow?.((x: number, y: number, w: number, h: number) => {
				runInAction(() => {
					messageInteractionsStore.selectedMessageForContextMenu.setSelectedMessageForContextMenu(message);
					messageInteractionsStore.selectedMessage.setSelectedMessage(message);
					messageInteractionsStore.contextMenuChatParams.setContextMenuChatParams(params);
					messageInteractionsStore.messageMenuLayout.setMessageMenuLayout({ x, y, width: w, height: h });
				});
			});
		});
	}, [message, params]);

	const menuItems = useMemo(
		() => getMessageContextMenuActionsForMessage(t, {
			message,
			profile: profile ?? null,
			selectedChat: selectedChat ?? null,
			params: params ?? {},
		}),
		[t, message?.id, profile?.id, selectedChat?.id, params]
	);

	const onHoldLongPress = useCallback(() => {
		runInAction(() => {
			messageInteractionsStore.selectedMessageForContextMenu.setSelectedMessageForContextMenu(message);
			messageInteractionsStore.contextMenuChatParams.setContextMenuChatParams(params);
		});
	}, [message, params]);

	const messageContent = isMyMessage && selectedChat?.type !== "CHANNEL" ? (
		<RightMessage
			message={message}
			showAvatar={showAvatar}
			style={style}
			onLongPress={USE_HOLD_ITEM_FOR_MESSAGE_CONTEXT_MENU ? noop : onLongPressLayer}
			onPressIn={noop}
			chatType={selectedChat?.type}
			params={params}
			chatEnterKey={chatEnterKey}
			messageListConfig={config}
			isSelected={isSelected}
			isSelectionMode={isSelectionMode}
		/>
	) : (
		<LeftMessage
			message={message}
			showAvatar={showAvatar}
			style={style}
			onLongPress={USE_HOLD_ITEM_FOR_MESSAGE_CONTEXT_MENU ? noop : onLongPressLayer}
			onPressIn={noop}
			chatType={selectedChat?.type}
			params={params}
			chatEnterKey={chatEnterKey}
			messageListConfig={config}
			isSelected={isSelected}
			isSelectionMode={isSelectionMode}
		/>
	);

	const content = USE_HOLD_ITEM_FOR_MESSAGE_CONTEXT_MENU ? (
		<Box overflow="visible" pointerEvents="box-none" width="100%" style={{ alignItems: 'stretch' }}>
			{messageContent}
		</Box>
	) : (
		<View ref={containerRef} collapsable={false} style={{ overflow: 'visible' as const, width: '100%', alignItems: 'stretch' }} pointerEvents="box-none">
			{messageContent}
		</View>
	);

	if (USE_HOLD_ITEM_FOR_MESSAGE_CONTEXT_MENU) {
		return (
			<HoldItem
				containerStyles={{ width: '100%' }}
				items={menuItems}
				menuAnchorPosition={isMyMessage ? 'top-right' : 'top-left'}
				disableMove={false}
				menuWidth={MESSAGE_HOLD_CONTEXT_MENU_WIDTH}
				longPressMinDurationMs={400}
				scaleDownValue={0.92}
				onLongPress={onHoldLongPress}
				activeHoldMessageIdShared={activeHoldMessageIdShared}
				itemId={holdItemId}
			>
				{content}
			</HoldItem>
		);
	}

	return content;
};

export const MessageItemWrapper = memo(MessageItemWrapperInner, (prev, next) => {
	if (prev.message?.id !== next.message?.id) return false;
	if (prev.message?.content !== next.message?.content) return false;
	if (prev.message?.has_reactions !== next.message?.has_reactions) return false;
	if (prev.message?.reactions_unreaded !== next.message?.reactions_unreaded) return false;
	if (prev.message?.is_mentioned_you !== next.message?.is_mentioned_you) return false;
	if (prev.message?.is_read !== next.message?.is_read) return false;
	if (!reactionEqual(prev.message?.reactions, next.message?.reactions)) return false;
	if (!reactedByEqual(prev.message?.reacted_by, next.message?.reacted_by)) return false;
	if (prev.message?.showAvatar !== next.message?.showAvatar) return false;
	if (prev.message?.isFirstInGroup !== next.message?.isFirstInGroup) return false;
	if (prev.profile?.id !== next.profile?.id) return false;
	if (prev.selectedChat?.id !== next.selectedChat?.id) return false;
	if (prev.selectedChat?.type !== next.selectedChat?.type) return false;
	if (prev.params !== next.params) return false;
	if (prev.chatEnterKey !== next.chatEnterKey) return false;
	if (prev.messageListConfig !== next.messageListConfig) return false;
	if (prev.isSelected !== next.isSelected) return false;
	if (prev.isSelectionMode !== next.isSelectionMode) return false;
	if (prev.activeHoldMessageIdShared !== next.activeHoldMessageIdShared) return false;
	if (prev.holdItemId !== next.holdItemId) return false;
	return true;
});
