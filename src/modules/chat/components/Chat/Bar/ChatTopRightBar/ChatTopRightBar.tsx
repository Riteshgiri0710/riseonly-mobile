import { SimpleButtonUi } from '@core/ui';
import { checker } from '@lib/helpers';
import { navigate, useRoute } from '@lib/navigation';
import { observer } from 'mobx-react-lite';
import { GestureResponderEvent } from 'react-native';
import { ChatLogo } from '../../ChatLogo/ChatLogo';
import { BlurView } from 'expo-blur';
import { themeStore } from '@modules/theme/stores';
import { changeRgbA } from '@lib/theme';

export const ChatTopRightBar = observer(() => {
	const { currentTheme } = themeStore;

	const route = useRoute();

	const { selectedChat }: any = route.params || {};

	const onAvatarClick = (event: GestureResponderEvent) => {
		event.preventDefault();
		event.stopPropagation();
		checker(selectedChat, "ChatTopRightBar: selectedChat is not set", true);
		navigate("ChatProfile", {
			chatId: selectedChat?.id,
			tag: selectedChat?.participant?.tag || "",
			selectedChat
		});
	};

	return (
		<BlurView
			intensity={25}
			style={{
				borderWidth: 1,
				borderColor: currentTheme.border_100,
				backgroundColor: changeRgbA(currentTheme.bg_100, 0.8),
				borderRadius: "100%",
				overflow: "hidden",
				height: 43,
				width: 43,
			}}
		>
			<SimpleButtonUi
				onPress={onAvatarClick}
				height={"100%"}
				centered
			>
				<ChatLogo
					size={37.5}
					iconSize={18}
					chat={selectedChat}
					type={selectedChat?.type}
					logo={selectedChat?.participant?.more?.logo}
				/>
			</SimpleButtonUi>
		</BlurView>
	);
});