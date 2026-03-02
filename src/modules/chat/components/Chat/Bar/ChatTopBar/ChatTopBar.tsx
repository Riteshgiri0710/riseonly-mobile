import { Box, MainText, SimpleButtonUi } from '@core/ui';
import { checker } from '@lib/helpers';
import { navigate, useRoute } from '@lib/navigation';
import { ChatTitle } from '@modules/chat/components/Chat/ChatTitle/ChatTitle';
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { GestureResponderEvent, StyleSheet } from 'react-native';
import { ChatUserActivity } from '../../ChatUserActivity/ChatUserActivity';
import { BlurView } from 'expo-blur';
import { themeStore } from '@modules/theme/stores';
import { changeRgbA } from '@lib/theme';
import { messageInteractionsStore } from 'src/modules/chat/stores/message';
import { t } from 'i18next';

export const ChatTopBar = observer(() => {
	const { currentTheme } = themeStore;
	const {
		isSelectingMessages: { isSelectingMessages },
		selectedMessages: { selectedMessages },
	} = messageInteractionsStore;

	const route = useRoute();

	const { previewUser, chatId, selectedChat }: any = route.params || {};

	const onMidPress = useCallback((e: GestureResponderEvent) => {
		e.preventDefault();
		e.stopPropagation();
		checker(selectedChat, "ChatTopBar: selectedChat is not set", true);
		navigate("ChatProfile", {
			chatId,
			tag: selectedChat?.participant?.tag || "",
			selectedChat
		});
	}, [navigate, chatId, previewUser]);

	return (
		<BlurView
			intensity={25}
			style={[
				s.blurView,
				{
					backgroundColor: changeRgbA(currentTheme.bg_100, 0.8),
					borderWidth: 1,
					borderColor: currentTheme.border_100,
				}
			]}
		>
			{isSelectingMessages ? (
				<Box
					style={{ flex: 1, width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}
				>
					<MainText style={{ fontWeight: "700", textAlign: "center" }}>
						{t("chat_selected_messages")}: {selectedMessages.size}
					</MainText>
				</Box>
			) : (
				<SimpleButtonUi
					width={"100%"}
					height={"100%"}
					align='center'
					justify='center'
					onPress={onMidPress}
				>
					<Box
						centered
						fD='row'
					>
						<ChatTitle
							chat={selectedChat}
							previewUser={previewUser}
						/>
					</Box>

					<ChatUserActivity />
				</SimpleButtonUi>
			)}
		</BlurView>
	);
});

const s = StyleSheet.create({
	blurView: {
		borderRadius: 1000, overflow: "hidden", paddingHorizontal: 15, height: 43,
	},
	navbarMidTop: {},
	navbarMidBot: {},
});