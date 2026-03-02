import { RootStackParamList } from '@app/router';
import { Box, MainText, SimpleButtonUi } from '@core/ui';
import { ProfileSettingsWrapper } from '@core/widgets/wrappers';
import { navigate } from '@lib/navigation';
import { ChatItem } from '@modules/chat/components';
import { ChatInfo, chatsInteractionsStore } from '@modules/chat/stores/chats';
import { UnlinkChatSheet } from '@modules/chat/widgets/bottomsheets/UnlinkChatSheet/UnlinkChatSheet';
import { themeStore } from '@modules/theme/stores';
import { RouteProp, useRoute } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

export const ChatSettingsLinkedChat = observer(() => {
	const { currentTheme } = themeStore;
	const { unlinkChatHandler } = chatsInteractionsStore;

	const { params: { selectedChat } } = useRoute<RouteProp<RootStackParamList, 'ChatSettingsLinkedChat'>>();
	const { t } = useTranslation();

	return (
		<ProfileSettingsWrapper
			tKey={t(`chat_settings_linked_${selectedChat.type.toLowerCase()}`)}
			height={45}
			PageHeaderUiStyle={{ backgroundColor: currentTheme.bg_100 }}
		>
			<Box
				gap={20}
			>
				<ChatItem
					// TODO: use chat from get_linked_chat_by_chat_id
					item={selectedChat}
					chatCallback={(chat: ChatInfo) => {
						navigate('Chat', { chatId: chat.id });
					}}
					variant='linked'
					endGroupTitle={t(`chat_settings_linked_${selectedChat.type.toLowerCase()}_explanation`)}
				/>

				<SimpleButtonUi
					variant="groupedBtn"
					onPress={() => unlinkChatHandler()}
				>
					<MainText
						primary
					>
						{t(`chat_settings_linked_${selectedChat.type.toLowerCase()}_unlink`)}
					</MainText>
				</SimpleButtonUi>

				<UnlinkChatSheet />
			</Box>
		</ProfileSettingsWrapper>
	);
});