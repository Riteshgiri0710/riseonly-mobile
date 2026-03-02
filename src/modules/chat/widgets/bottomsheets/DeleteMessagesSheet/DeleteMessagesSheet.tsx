import { BottomSheetScreen, BottomSheetUi, Box, ButtonUi, MainText, SwitchUi } from '@core/ui';
import { messageActionsStore, messageInteractionsStore } from '@modules/chat/stores/message';
import { chatsInteractionsStore } from '@modules/chat/stores/chats';
import { themeStore } from '@modules/theme/stores';
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const DeleteMessagesSheet = observer(() => {
	const { currentTheme } = themeStore;
	const {
		deleteMessagesSheet: deleteMessagesSheetState,
		selectedMessageForContextMenu: selectedMessageForContextMenuState,
	} = messageInteractionsStore;
	const { t } = useTranslation();

	const { isOpen, messageIds } = deleteMessagesSheetState.deleteMessagesSheet;

	const screens: BottomSheetScreen[] = useMemo(
		() => [
			{
				name: 'menu',
				component: DeleteMessagesMenu,
				title: t('delete_messages_title', { count: messageIds.length }),
				heightPercent: 10,
			},
		],
		[t, messageIds.length]
	);

	const handleSetIsBottomSheet = (value: boolean) => {
		if (!value) {
			deleteMessagesSheetState.setDeleteMessagesSheet({ isOpen: false, messageIds: [] });
			selectedMessageForContextMenuState.setSelectedMessageForContextMenu(null);
		}
	};

	if (!isOpen) return null;

	return (
		<BottomSheetUi
			bottomSheetBgColor={currentTheme.bg_100}
			isBottomSheet={true}
			setIsBottomSheet={handleSetIsBottomSheet}
			title={t('delete_messages_title', { count: messageIds.length })}
			screens={screens}
			initialScreen="menu"
		/>
	);
});

const DeleteMessagesMenu = observer(() => {
	const { currentTheme } = themeStore;
	const {
		deleteMessagesSheet: deleteMessagesSheetState,
		selectedMessageForContextMenu: selectedMessageForContextMenuState,
	} = messageInteractionsStore;
	const { deleteMessagesAction } = messageActionsStore;
	const { selectedChat } = chatsInteractionsStore;
	const { t } = useTranslation();

	const { messageIds } = deleteMessagesSheetState.deleteMessagesSheet;
	const canDeleteForEveryone = selectedChat?.type === "PRIVATE";
	const [forEveryone, setForEveryone] = useState<boolean>(canDeleteForEveryone);

	const handleConfirm = () => {
		if (messageIds.length) {
			const applyForEveryone = canDeleteForEveryone && forEveryone;
			deleteMessagesAction(messageIds, applyForEveryone);
			deleteMessagesSheetState.setDeleteMessagesSheet({ isOpen: false, messageIds: [] });
			selectedMessageForContextMenuState.setSelectedMessageForContextMenu(null);
			messageInteractionsStore.exitSelectionMode();
		}
	};

	return (
		<Box
			style={{ paddingHorizontal: 15, marginTop: 10 }}
			bgColor={currentTheme.bg_100}
			gap={30}
			width="100%"
		>
			<Box gap={20} width="100%">
				{canDeleteForEveryone && (
					<Box fD="row" align="center" justify="space-between" width="100%">
						<MainText>{t('delete_messages_for_everyone')}</MainText>
						<SwitchUi
							isOpen={forEveryone}
							onPress={() => setForEveryone(!forEveryone)}
						/>
					</Box>
				)}
				<ButtonUi onPress={handleConfirm}>
					<MainText>{t('continue')}</MainText>
				</ButtonUi>
			</Box>
		</Box>
	);
});
