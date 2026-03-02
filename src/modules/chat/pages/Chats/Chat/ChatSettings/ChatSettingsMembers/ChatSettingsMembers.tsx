import { Box, MainText } from '@core/ui';
import { ProfileSettingsWrapper } from '@core/widgets/wrappers';
import { chatsActionsStore } from '@modules/chat/stores/chats';
import { themeStore } from '@modules/theme/stores';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

export const ChatSettingsMembers = observer(() => {
	const { currentTheme } = themeStore;
	const { getMembersAction } = chatsActionsStore;

	const route = useRoute();
	const { selectedChat } = route.params as any;

	useFocusEffect(
		useCallback(() => {
			getMembersAction(selectedChat);
		}, [])
	);

	return (
		<ProfileSettingsWrapper
			tKey='chat_settings_members'
			height={45}
			PageHeaderUiStyle={{ backgroundColor: currentTheme.bg_100 }}
		>
			<Box
				gap={40}
			>
				<MainText>members</MainText>
			</Box>
		</ProfileSettingsWrapper>
	);
});