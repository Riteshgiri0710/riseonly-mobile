import { Box, MainText } from '@core/ui';
import { chatsActionsStore } from '@modules/chat/stores/chats';
import { themeStore } from '@modules/theme/stores';
import { useFocusEffect } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { StyleSheet } from 'react-native';

export const ChatLinkGroupedBtn = observer(() => {
	const { currentTheme } = themeStore;
	const { getInviteLinksAction } = chatsActionsStore;

	useFocusEffect(
		useCallback(() => {
			getInviteLinksAction();
		}, [])
	);

	return (
		<Box
			style={s.main}
			width={"100%"}
		>
			<Box
				bgColor={currentTheme.bg_700}
				style={s.input}
				width={"100%"}
				bRad={30}
				centered
			>
				<MainText
					px={18}
				>
					Здесь будет ссылка
				</MainText>
			</Box>
		</Box>
	);
});

const s = StyleSheet.create({
	input: {
		paddingVertical: 10,
		paddingHorizontal: 20
	},
	main: {
		paddingVertical: 10
	},
});