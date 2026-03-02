import { defaultFavouritesLogo } from '@core/config/const';
import { Box, GroupedBtns, MainText, SimpleButtonUi, SimpleInputUi, SimpleTextAreaUi, UserLogo } from '@core/ui';
import { ProfileSettingsWrapper } from '@core/widgets/wrappers';
import { checker } from '@lib/helpers';
import { useRoute } from '@lib/navigation';
import { defaultScreensHorizontalPadding } from '@lib/theme';
import { ChatProfileTopBar } from '@modules/chat/components';
import { getChatBaseSettingsBtns, getChatDeleteBtn, getChatInfoBtns, getChatInputSettingsBtns, getChatTypeSettingsBtn } from '@modules/chat/shared/config/grouped-btns-data';
import { chatsInteractionsStore } from '@modules/chat/stores/chats';
import { themeStore } from '@modules/theme/stores';
import { mediaInteractionsStore } from '@stores/media';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, StyleSheet } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedScrollHandler, useSharedValue, withTiming } from 'react-native-reanimated';

export const ChatSettings = observer(() => {
	const { currentTheme } = themeStore;
	const {
		isMainScrollEnabled: { isMainScrollEnabled },
		checkIfReachedTabsArea,
		handleParentScrollEnd
	} = chatsInteractionsStore;
	const {
		mediaOpen: { setMediaOpen }
	} = mediaInteractionsStore;

	const { t } = useTranslation();

	const route = useRoute<"ChatSettings">();
	const { selectedChat } = route.params;

	const scrollY = useSharedValue(0);
	const lastCanvasUpdate = useSharedValue(0);
	const lastVelocityY = useSharedValue(0);
	const scrollYForCanvasRaw = useSharedValue(0);
	const lastCheckY = useSharedValue(0);

	const scrollRef = useRef<Animated.ScrollView>(null);

	checker(selectedChat, "[ChatSettings.tsx - 39:20]: no selected chat");

	const chatInputSettingsBtns = useMemo(() => getChatInputSettingsBtns(), []);
	const chatTypeSettingsBtn = useMemo(() => getChatTypeSettingsBtn(t, selectedChat.is_public, selectedChat.type), [selectedChat.is_public, selectedChat.type]);
	const chatSettingsBtns = useMemo(() => getChatBaseSettingsBtns(t, selectedChat), [selectedChat.type]);
	const chatInfoBtns = useMemo(() => getChatInfoBtns(t, selectedChat.member_count, selectedChat), [selectedChat.member_count, selectedChat]);
	const chatDeleteBtn = useMemo(() => getChatDeleteBtn(t, selectedChat.type), [selectedChat.type]);

	const checkIfReachedTabsAreaCallback = useCallback((y: number) => {
		checkIfReachedTabsArea(y);
	}, [checkIfReachedTabsArea]);

	const scrollViewStyle = useMemo(() => [
		s.scrollView,
		{ backgroundColor: currentTheme.bg_100 }
	], [currentTheme.bg_200]);

	const onSelectAvatarPress = () => setMediaOpen(true);

	const onScroll = useAnimatedScrollHandler({
		onScroll: (e) => {
			const currentY = e.contentOffset.y;
			scrollY.value = currentY;

			const canvasDiff = Math.abs(currentY - lastCanvasUpdate.value);
			if (canvasDiff > 100) {
				lastCanvasUpdate.value = currentY;
				scrollYForCanvasRaw.value = withTiming(currentY, {
					duration: 400,
					easing: Easing.out(Easing.quad)
				});
			}

			const diff = Math.abs(currentY - lastCheckY.value);
			if (diff > 5) {
				lastCheckY.value = currentY;
				runOnJS(checkIfReachedTabsAreaCallback)(currentY);
			}
		}
	});

	useEffect(() => {
		return () => setMediaOpen(false);
	}, []);

	return (
		<ProfileSettingsWrapper
			tKey=''
			needHeader={false}
			transparentSafeArea
			PageHeaderUiStyle={{ borderBottomWidth: 0 }}
			needScrollView={false}
			wrapperStyle={{ paddingVertical: 0, paddingHorizontal: 0 }}
			withoutBackBtn={true}
		>
			<Box
				style={[
					s.main,
					{ paddingHorizontal: defaultScreensHorizontalPadding }
				]}
			>
				<ChatProfileTopBar
					scrollY={scrollY}
				/>

				<Animated.ScrollView
					style={scrollViewStyle}
					scrollEventThrottle={16}
					bounces={false}
					showsVerticalScrollIndicator={false}
					scrollEnabled={isMainScrollEnabled}
					onScroll={onScroll}
					ref={scrollRef}
					removeClippedSubviews={true}
					onScrollEndDrag={(e) => {
						const currentScrollY = scrollY.value;
						if (currentScrollY < 30) {
							if (!scrollRef.current) return;
							scrollRef.current.scrollTo({ y: 0, animated: true });
						}

						const velocity = e.nativeEvent.velocity?.y || 0;
						lastVelocityY.value = velocity;

						handleParentScrollEnd(velocity);
					}}
				>
					<SafeAreaView>
						<Box
							flex={1}
							centered
						>
							<Box
								flex={1}
								centered
								style={s.container}
							>
								<UserLogo
									source={
										selectedChat?.type == "PRIVATE" ? selectedChat.participant.more.logo
											: selectedChat?.type == "FAVOURITES" ? defaultFavouritesLogo
												: selectedChat?.logo_url
									}
									size={100}
									noBanner
									noTitle
								/>

								<SimpleButtonUi
									onPress={onSelectAvatarPress}
									style={s.selectAvatarBtn}
								>
									<MainText
										tac='center'
										primary
									>
										{t("select_avatar_text")}
									</MainText>
								</SimpleButtonUi>

								<Box
									style={s.btnsContainer}
									gap={40}
								>
									<GroupedBtns
										items={chatInputSettingsBtns}
									/>

									<Box
										gap={20}
									>
										<GroupedBtns
											items={chatTypeSettingsBtn}
										/>

										<GroupedBtns
											items={chatSettingsBtns}
										/>

										<GroupedBtns
											// @ts-ignore
											items={chatInfoBtns}
										/>

										<GroupedBtns
											items={chatDeleteBtn}
										/>
									</Box>
								</Box>
							</Box>
						</Box>
					</SafeAreaView>
				</Animated.ScrollView>
			</Box>
		</ProfileSettingsWrapper>
	);
});

export const ChatSettingsTitleInput = observer(() => {
	const {
		chatSettingsForm: {
			values,
			setValue
		},
	} = chatsInteractionsStore;

	const route = useRoute<"ChatSettings">();
	const { selectedChat } = route.params;

	const { t } = useTranslation();

	useEffect(() => {
		setValue("title", selectedChat?.title || "");
	}, [selectedChat]);

	return (
		<Box
			flex={1}
			width={"100%"}
		>
			<SimpleInputUi
				values={values}
				name={"title"}
				setValue={setValue}
				placeholder={t("chat_group_title_placeholder")}
				style={s.input}
				groupContainerStyle={s.groupContainer}
			/>
		</Box>
	);
});

export const ChatSettingsDescriptionInput = observer(() => {
	const {
		chatSettingsForm: {
			values,
			setValue
		},
	} = chatsInteractionsStore;

	const { t } = useTranslation();

	const route = useRoute<"ChatSettings">();
	const { selectedChat } = route.params;

	useEffect(() => {
		setValue("description", selectedChat?.description || "");
	}, [selectedChat]);

	return (
		<Box
			flex={1}
			width={"100%"}
		>
			<SimpleTextAreaUi
				values={values}
				name={"description"}
				placeholder={t("chat_group_description_placeholder")}
				setValue={setValue}
				style={s.textArea}
				groupContainerStyle={s.groupTextAreaContainer}
			/>
		</Box>
	);
});

const s = StyleSheet.create({
	groupTextAreaContainer: {
		paddingTop: 10,
		width: "100%"
	},
	btnsContainer: {
		marginTop: 3
	},
	main: {
		flex: 1
	},
	scrollView: { width: "100%" },
	container: {
		paddingVertical: 10,
	},
	selectAvatarBtn: {
		paddingVertical: 7
	},
	input: {
		height: "100%",
		width: "100%",
		fontSize: 17
	},
	textArea: {
		width: "100%",
		fontSize: 17,
		minHeight: "auto",
		height: "auto",
		paddingBottom: 15
	},
	groupContainer: {
		width: "100%",
		height: "100%"
	}
});