import { Box, GroupedBtns } from '@core/ui';
import { ProfileSettingsWrapper } from '@core/widgets/wrappers';
import { checker } from '@lib/helpers';
import { getChatTypeBtns } from '@modules/chat/shared/config/grouped-btns-data';
import { chatsInteractionsStore } from '@modules/chat/stores/chats';
import { themeStore } from '@modules/theme/stores';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const ChatSettingsType = observer(() => {
	const { currentTheme } = themeStore;
	const { selectedChat } = chatsInteractionsStore;

	const { t } = useTranslation();

	checker(selectedChat, "[ChatSettingsType]: no selected chat");

	const chatTypeBtsn = useMemo(() => getChatTypeBtns(t, selectedChat.type, selectedChat.is_public), [selectedChat.type, selectedChat.is_public]);

	return (
		<ProfileSettingsWrapper
			tKey='chat_settings_type_title'
			height={45}
			PageHeaderUiStyle={{ backgroundColor: currentTheme.bg_100 }}
		>
			<Box>
				<GroupedBtns
					items={chatTypeBtsn}
				/>
			</Box>
		</ProfileSettingsWrapper>
	);
});