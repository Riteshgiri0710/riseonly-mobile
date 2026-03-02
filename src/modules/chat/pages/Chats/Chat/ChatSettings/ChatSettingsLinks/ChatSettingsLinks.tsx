import { Box, GroupedBtns } from '@core/ui';
import { ProfileSettingsWrapper } from '@core/widgets/wrappers';
import { checker } from '@lib/helpers';
import { getChatLinkBtn, getChatLinksBtns } from '@modules/chat/shared/config/grouped-btns-data';
import { chatsActionsStore, chatsInteractionsStore } from '@modules/chat/stores/chats';
import { EditChatLinkSheet } from '@modules/chat/widgets/bottomsheets';
import { CreateChatLinkSheet } from '@modules/chat/widgets/bottomsheets/CreateChatLinkSheet/CreateChatLinkSheet';
import { themeStore } from '@modules/theme/stores';
import { useFocusEffect } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const ChatSettingsLinks = observer(() => {
	const { currentTheme } = themeStore;
	const { inviteLinks, getInviteLinksAction } = chatsActionsStore;
	const { selectedChat } = chatsInteractionsStore;

	const { t } = useTranslation();

	checker(selectedChat, "[ChatSettingsLinks]: no selected chat");

	const chatLinkBtn = useMemo(() => getChatLinkBtn(t), []);
	const chatLinksBtns = useMemo(() => getChatLinksBtns(t, inviteLinks.data?.invite_links, currentTheme, inviteLinks.status || "idle"), [inviteLinks.data?.invite_links?.length, currentTheme, inviteLinks.status]);

	useFocusEffect(
		useCallback(() => {
			getInviteLinksAction();
		}, [])
	);

	return (
		<ProfileSettingsWrapper
			tKey='chat_settings_links_title'
			height={45}
			PageHeaderUiStyle={{ backgroundColor: currentTheme.bg_100 }}
		>
			<Box
				gap={40}
			>
				{/* TODO: make unique default link for chat */}
				{/* <GroupedBtns
					items={chatLinkBtn}
				/> */}

				<GroupedBtns
					items={chatLinksBtns}
				/>

				<CreateChatLinkSheet />
				<EditChatLinkSheet />
			</Box>
		</ProfileSettingsWrapper>
	);
});