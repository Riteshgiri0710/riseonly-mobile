import { BottomSheetScreen, BottomSheetUi, Box, GroupedBtns, useBottomSheetNavigation } from '@core/ui';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getCreateChatSheetItems } from 'src/modules/chat/shared/config/grouped-btns-data';
import { chatsInteractionsStore } from 'src/modules/chat/stores/chats';
import { CreateChannelChat, CreateChannelSettings, CreateGroupChat } from 'src/modules/chat/widgets/bottomsheets';
import { themeStore } from 'src/modules/theme/stores';
import { CreateGroupSettings } from './CreateGroupChat/CreateGroupSettings';

export const CreateChatSheet = observer(() => {
	const { currentTheme } = themeStore;
	const {
		isCreateChatSheetOpen: { isCreateChatSheetOpen, setIsCreateChatSheetOpen },
		createChatSheetCloseSignal: { createChatSheetCloseSignal, setCreateChatSheetCloseSignal }
	} = chatsInteractionsStore;

	const { t } = useTranslation();

	const screens: BottomSheetScreen[] = useMemo(() => [
		{ name: 'menu', component: CreateChatMenu, title: t('create_chat_sheet_title'), heightPercent: 10 },
		{ name: 'group', component: CreateGroupChat, title: t('create_group_chat'), heightPercent: 40 },
		{ name: 'groupSettings', component: CreateGroupSettings, title: t('group_settings'), heightPercent: 80 },
		{ name: 'channel', component: CreateChannelChat, title: t('create_channel_chat'), heightPercent: 40 },
		{ name: 'channelSettings', component: CreateChannelSettings, title: t('channel_settings'), heightPercent: 80 },
	], [t]);

	return (
		<>
			{isCreateChatSheetOpen && (
				<BottomSheetUi
					bottomSheetBgColor={currentTheme.bg_100}
					isBottomSheet={isCreateChatSheetOpen}
					setIsBottomSheet={setIsCreateChatSheetOpen}
					onCloseSignal={createChatSheetCloseSignal}
					setOnCloseSignal={setCreateChatSheetCloseSignal}
					title={t('create_chat_sheet_title')}
					screens={screens}
					initialScreen="menu"
					dynamicSizing
				/>
			)}
		</>
	);
});

export const CreateChatMenu = observer(() => {
	const { currentTheme } = themeStore;
	const { t } = useTranslation();
	const { navigate } = useBottomSheetNavigation();

	const createChatSheetItems = getCreateChatSheetItems(t, navigate);

	return (
		<Box
			style={{ paddingHorizontal: 15 }}
			bgColor={currentTheme.bg_100}
		>
			<GroupedBtns
				items={createChatSheetItems}
				groupBg={currentTheme.bg_200}
			/>
		</Box>
	);
});