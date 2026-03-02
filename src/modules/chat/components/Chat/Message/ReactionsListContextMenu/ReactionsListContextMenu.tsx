import { REACTIONS_LIST_BY_DEFAULT } from '@core/config/const';
import { Box, MainText, PressableUi } from '@core/ui';
import { useHoldMenuClose } from '@core/ui/HoldMenu/hooks';
import { ChatTypeEnum } from '@modules/chat/stores/chats';
import { messageInteractionsStore } from '@modules/chat/stores/message';
import { reactionsInteractionsStore } from '@modules/chat/stores/reactions';
import { themeStore } from '@modules/theme/stores';
import { profileStore } from '@modules/user/stores/profile';
import { BlurView } from 'expo-blur';
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { FlatList, StyleSheet } from 'react-native';

export const SharedReactionsOverlay = observer(() => {
	const { profile } = profileStore;
	const { getContextMenuBg, contextMenuBlurIntensity } = themeStore;
	const { reactionPressHandler } = reactionsInteractionsStore;
	const closeMenu = useHoldMenuClose();
	const message = messageInteractionsStore.selectedMessageForContextMenu.selectedMessageForContextMenu;
	const params = messageInteractionsStore.contextMenuChatParams.contextMenuChatParams;

	const chat = params?.selectedChat;
	const allowedReactions = chat?.type === ChatTypeEnum.PRIVATE ? REACTIONS_LIST_BY_DEFAULT : chat?.allowed_reactions;

	const handleReactionPress = useCallback(
		(item: string, isReactedByYou: boolean) => {
			if (!chat) return;
			closeMenu();
			reactionPressHandler(item, chat, isReactedByYou);
		},
		[chat, closeMenu, reactionPressHandler]
	);

	if (!message || !allowedReactions || allowedReactions?.length === 0 || !chat) return null;

	return (
		<Box
			width={"100%"}
			style={s.main}
		>
			<BlurView
				intensity={contextMenuBlurIntensity}
				style={[
					s.container,
					{
						backgroundColor: getContextMenuBg(),
						borderRadius: 1000,
						overflow: "hidden",
						height: 45
					}
				]}
			>
				<FlatList
					data={allowedReactions}
					renderItem={({ item }) => {
						const isReactedByYou = message?.reacted_by?.find((r) => r.reaction === item)?.sender?.id === profile?.id;

						return (
							<PressableUi
								key={item}
								style={s.reaction}
								onPress={() => handleReactionPress(item, isReactedByYou)}
								onLongPress={() => handleReactionPress(item, isReactedByYou)}
								longPressDuration={500}
								longPressScale={0.8}
								tapScale={0.1}
							>
								{isReactedByYou && (
									<Box
										bRad={1000}
										bgColor={"rgba(255, 255, 255, 0.25)"}
										height={35}
										width={37}
										centered
										position={"absolute"}
									/>
								)}

								<MainText
									px={26}
								>
									{item}
								</MainText>
							</PressableUi>
						);
					}}
					keyExtractor={(item) => item}
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={s.contentContainer}
				/>
			</BlurView>
		</Box>
	);
});

const s = StyleSheet.create({
	main: {
		paddingHorizontal: 20
	},
	container: {},
	contentContainer: {
		gap: 10,
		paddingHorizontal: 13,
	},
	reaction: {
		position: "relative",
		alignItems: "center",
		justifyContent: "center",
	}
});