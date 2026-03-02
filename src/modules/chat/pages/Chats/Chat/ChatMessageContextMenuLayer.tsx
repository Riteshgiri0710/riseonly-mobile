import { RootStackParamList } from '@app/router';
import { CONTEXT_MENU_STATE, WINDOW_HEIGHT } from '@core/ui/HoldMenu/constants';
import { calculateMenuHeight } from '@core/ui/HoldMenu/utils/calculations';
import { useInternal, useOpenContextMenu } from '@core/ui/HoldMenu/hooks';
import { MESSAGE_LIST_CONFIG } from '@core/config/const';
import { ProcessedMessage } from '@modules/chat/components';
import { getMessageContextMenuActions } from '@modules/chat/shared/config/context-menu-data';
import { MESSAGE_HOLD_CONTEXT_MENU_WIDTH } from '@modules/chat/shared/config/const';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Portal } from '@gorhom/portal';
import { useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '@core/ui';
import { LeftMessage, RightMessage } from 'src/modules/chat/components/Chat/Message';
import { ChatType } from 'src/modules/chat/stores/chats';
import { messageInteractionsStore } from 'src/modules/chat/stores/message';
import { observer } from 'mobx-react-lite';

export interface ChatMessageContextMenuLayerProps {
	profile: { id: string; } | null;
	selectedChat: { id: string; type?: string; } | null;
	params: RootStackParamList['Chat'];
	chatEnterKey: number;
}

/**
 * Isolated observer: only this component re-renders when context menu opens/closes.
 * Prevents the whole Chat from re-rendering (was causing JS ~15 FPS drop).
 */
export const ChatMessageContextMenuLayer = observer(({
	profile,
	selectedChat,
	params,
	chatEnterKey,
}: ChatMessageContextMenuLayerProps) => {
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const { openMenu } = useOpenContextMenu();
	const { state } = useInternal();
	const [showContextPreview, setShowContextPreview] = useState(false);

	const selectedMessageForContextMenu = messageInteractionsStore.selectedMessageForContextMenu.selectedMessageForContextMenu;
	const layout = messageInteractionsStore.messageMenuLayout.messageMenuLayout;
	const setSelectedMessageForContextMenu = messageInteractionsStore.selectedMessageForContextMenu.setSelectedMessageForContextMenu;
	const setMessageMenuLayout = messageInteractionsStore.messageMenuLayout.setMessageMenuLayout;

	const clearContextMenuState = useCallback(() => {
		setSelectedMessageForContextMenu(null);
		setShowContextPreview(false);
		setMessageMenuLayout(null);
	}, [setSelectedMessageForContextMenu, setMessageMenuLayout]);

	useAnimatedReaction(
		() => state.value,
		(current, previous) => {
			'worklet';
			if (previous === CONTEXT_MENU_STATE.ACTIVE && current === CONTEXT_MENU_STATE.END) {
				runOnJS(clearContextMenuState)();
			}
		},
		[clearContextMenuState]
	);

	const menuItems = useMemo(
		() => getMessageContextMenuActions(t),
		[t, profile?.id, selectedMessageForContextMenu?.id, selectedMessageForContextMenu]
	);

	useEffect(() => {
		if (!selectedMessageForContextMenu) return;
		if (!layout) return;
		const isMyMsg = selectedMessageForContextMenu?.sender?.id === profile?.id;
		const anchorPosition = isMyMsg ? 'top-right' : 'top-left';
		const itemY = layout.y;
		const itemHeight = layout.height ?? 44;
		const separatorCount = menuItems.filter((i) => i.withSeparator).length;
		const labelCount = menuItems.filter((i) => i.isLabel).length;
		const menuHeight = calculateMenuHeight(menuItems.length, separatorCount, labelCount);

		const spacing = 10;
		const isAnchorPointTop = anchorPosition.startsWith('top');
		let transformValue = 0;
		if (isAnchorPointTop) {
			const topTransform = itemY + itemHeight + menuHeight + spacing + insets.bottom;
			transformValue = topTransform > WINDOW_HEIGHT ? WINDOW_HEIGHT - topTransform : 0;
		} else {
			const bottomTransform = itemY - menuHeight - insets.top;
			transformValue = bottomTransform < 0 ? -bottomTransform + spacing * 2 : 0;
		}

		setMessageMenuLayout({ ...layout, transformValue });

		const rafId = requestAnimationFrame(() => {
			openMenu({
				items: menuItems,
				menuWidth: MESSAGE_HOLD_CONTEXT_MENU_WIDTH,
				itemX: layout.x,
				itemY,
				itemWidth: layout.width ?? 200,
				itemHeight,
				anchorPosition,
				transformValue,
				onClose: clearContextMenuState,
			});
		});

		const previewDelayMs = 250;
		const previewTimerId = setTimeout(() => setShowContextPreview(true), previewDelayMs);

		return () => {
			cancelAnimationFrame(rafId);
			clearTimeout(previewTimerId);
		};
	}, [selectedMessageForContextMenu, layout?.x, layout?.y, layout?.width, layout?.height, menuItems, openMenu, clearContextMenuState, profile?.id, insets.bottom, insets.top, setMessageMenuLayout]);

	if (!selectedMessageForContextMenu) return null;

	const menuLayout = messageInteractionsStore.messageMenuLayout.messageMenuLayout;
	if (!showContextPreview || !menuLayout) return null;

	const transformValue = menuLayout.transformValue ?? 0;
	const msg = selectedMessageForContextMenu as ProcessedMessage;

	return (
		<Portal name="chat-message-context-preview" key={msg?.id ?? 'clone'}>
			<Box
				style={{
					position: 'absolute',
					left: menuLayout.x,
					top: menuLayout.y + transformValue,
					width: Math.max(menuLayout.width, 280),
					height: menuLayout.height,
					zIndex: 9995,
					elevation: 9995,
					overflow: 'visible',
					borderRadius: 12,
				}}
				pointerEvents="none"
			>
				{msg.sender?.id === profile?.id && selectedChat?.type !== 'CHANNEL' ? (
					<RightMessage
						message={msg}
						showAvatar={MESSAGE_LIST_CONFIG.showAvatar && (msg as any).showAvatar}
						style={{ marginTop: (msg as any).isFirstInGroup ? 3 : 2 }}
						onLongPress={() => { }}
						onPressIn={() => { }}
						chatType={selectedChat?.type as ChatType}
						params={params}
						chatEnterKey={chatEnterKey}
						messageListConfig={MESSAGE_LIST_CONFIG}
					/>
				) : (
					<LeftMessage
						message={msg}
						showAvatar={MESSAGE_LIST_CONFIG.showAvatar && (msg as any).showAvatar}
						style={{ marginTop: (msg as any).isFirstInGroup ? 3 : 2 }}
						onLongPress={() => { }}
						onPressIn={() => { }}
						chatType={selectedChat?.type as ChatType}
						params={params}
						chatEnterKey={chatEnterKey}
						messageListConfig={MESSAGE_LIST_CONFIG}
					/>
				)}
			</Box>
		</Portal>
	);
});
