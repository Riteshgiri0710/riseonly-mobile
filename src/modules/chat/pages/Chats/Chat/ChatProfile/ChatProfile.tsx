import { defaultFavouritesLogo } from '@core/config/const';
import { getChatProfileBtns } from '@core/config/tsx';
import { Box, GroupedBtns, MainText, SimpleButtonUi, UserLogo } from '@core/ui';
import { ProfileSettingsWrapper } from '@core/widgets/wrappers';
import { useRoute } from '@lib/navigation';
import { ChatLogo, ChatProfileTopBar } from '@modules/chat/components';
import { ChatProfileTabs } from '@modules/chat/components/Tabs';
import { messageActionsStore } from '@modules/chat/stores/message';
import { useFocusEffect } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedScrollHandler, useSharedValue, withTiming } from 'react-native-reanimated';
import { getChatProfileInfoBtns, getChatSettingsBtns } from 'src/modules/chat/shared/config/grouped-btns-data';
import { chatsInteractionsStore } from 'src/modules/chat/stores/chats';
import { themeStore } from 'src/modules/theme/stores';

export const ChatProfile = observer(() => {
	const { currentTheme } = themeStore;
	const {
		isMainScrollEnabled: { isMainScrollEnabled, setIsMainScrollEnabled },
		isTabScrollEnabled: { setIsTabScrollEnabled },
		tabsAreaY: { setTabsAreaY },
		handleParentScrollEnd,
		checkIfReachedTabsArea,
	} = chatsInteractionsStore;
	const { getMediaMessagesAction } = messageActionsStore;

	const { t } = useTranslation();

	const route = useRoute<"ChatProfile">();
	const { selectedChat } = route.params;

	const scrollY = useSharedValue(0);
	const scrollYForCanvasRaw = useSharedValue(0);
	const scrollRef = useRef<Animated.ScrollView>(null);
	const tabsRef = useRef<View>(null);
	const lastVelocityY = useSharedValue(0);
	const lastCheckY = useSharedValue(0);
	const lastCanvasUpdate = useSharedValue(0);

	const chatProfileBtns = useMemo(() => getChatProfileBtns(t, selectedChat), [t, selectedChat]);
	const chatProfileInfo = useMemo(() => getChatProfileInfoBtns(t, selectedChat), [t, selectedChat]);
	const chatSettingsBtn = useMemo(() => getChatSettingsBtns(t, selectedChat?.type, selectedChat), [t, selectedChat?.type, selectedChat]);

	const handleTabsLayout = useCallback(() => {
		if (tabsRef.current) {
			tabsRef.current.measure((x, y, width, height, pageX, pageY) => {
				setTabsAreaY(pageY);
			});
		}
	}, [setTabsAreaY]);

	useFocusEffect(
		useCallback(() => {
			getMediaMessagesAction();
			setIsMainScrollEnabled(true);
			setIsTabScrollEnabled(false);
		}, []),
	);

	const checkIfReachedTabsAreaCallback = useCallback((y: number) => {
		checkIfReachedTabsArea(y);
	}, [checkIfReachedTabsArea]);

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

	const scrollViewStyle = useMemo(() => [
		s.scrollView,
		{ backgroundColor: currentTheme.bg_200 }
	], [currentTheme.bg_200]);

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

			<Box style={s.main}>
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
					<UserLogo
						source={
							selectedChat?.type == "PRIVATE" ? selectedChat.participant.more.logo
								: selectedChat?.type == "FAVOURITES" ? defaultFavouritesLogo
									: selectedChat?.logo_url
						}
						size={100}
						canvas={true}
						selectedChat={selectedChat}
					// TODO: DONT USE IT. add scrollY and optimize UserLogo component for canvas with scrollY
					// scrollY={scrollY}
					/>

					<Box
						bgColor='black'
						style={{ paddingHorizontal: 15, paddingVertical: 20 }}
						gap={20}
					>
						<Box style={s.btns}>
							{chatProfileBtns.map((t, i) => {
								return (
									<SimpleButtonUi
										bgColor={currentTheme.btn_bg_300}
										style={s.btn}
										key={i}
										onPress={t.callback}
									>
										<Box
											centered
											width={"100%"}
										>
											{t.icon}
										</Box>
										<MainText
											px={11}
											width={"100%"}
											tac='center'
											primary
										>
											{t.text}
										</MainText>
									</SimpleButtonUi>
								);
							})}
						</Box>

						{selectedChat?.type != "FAVOURITES" && (
							<Box
								style={s.mid}
								gap={15}
							>
								<GroupedBtns
									items={chatProfileInfo}
									leftFlex={0}
								/>

								<GroupedBtns
									items={chatSettingsBtn}
									leftFlex={0}
								/>
							</Box>
						)}
					</Box>

					<Box style={s.bot}>
						<View
							ref={tabsRef}
							onLayout={handleTabsLayout}
						>
							<ChatProfileTabs scrollY={scrollY} />
						</View>
					</Box>
				</Animated.ScrollView>
			</Box >
		</ProfileSettingsWrapper >
	);
});

const s = StyleSheet.create({
	scrollView: { width: "100%" },
	container: {
		marginTop: 0,
		marginBottom: 20,
		flex: 1,
	},
	bot: {},
	btn: {
		flex: 1,
		borderRadius: 10,
		paddingTop: 10,
		paddingBottom: 7,
		flexDirection: "column",
		gap: 2,
		justifyContent: "center",
		alignItems: "center",
	},
	btns: {
		flexDirection: "row",
		gap: 10,
	},
	mid: { flex: 1 },
	backButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 15,
		marginRight: 16,
		position: 'absolute',
		left: 15,
	},
	namesBot: {},
	namesTop: {},
	namesSticky: { width: "100%", alignItems: "center", justifyContent: "center" },
	main: { flex: 1 }
});
