import { todoNotify } from '@core/config/const';
import { getProfileStatuses } from '@core/config/tsx';
import { Box, InDevUi, MainText, SimpleButtonUi, SimpleInputUi, TabConfig } from '@core/ui';
import { SearchIcon } from '@icons/MainPage/Posts/SearchIcon';
import { EditIcon } from '@icons/Ui/EditIcon';
import { changeRgbA } from '@lib/theme';
import { useNavigation } from '@react-navigation/native';
import { ChatsWrapper } from '@widgets/wrappers';
import { BlurView } from 'expo-blur';
import { observer } from 'mobx-react-lite';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AllChats } from 'src/modules/chat/components/Tabs';
import { chatsActionsStore, chatsInteractionsStore } from 'src/modules/chat/stores/chats';
import { CreateChatSheet } from 'src/modules/chat/widgets/bottomsheets';
import { themeStore } from 'src/modules/theme/stores';

export const Chats = observer(() => {
	const { currentTheme, getBlurViewBgColor } = themeStore;
	const {
		chats: { data }
	} = chatsActionsStore;
	const { onCreateChatPress } = chatsInteractionsStore;
	const navigation = useNavigation();

	const { t } = useTranslation();
	const insets = useSafeAreaInsets();

	const [activeTab, setActiveTab] = useState(0);
	const scrollRef = useRef<ScrollView | null>(null);
	const scrollOffsetsRef = useRef<number[]>([]);
	const lastScrollYRef = useRef(0);
	const searchBlockHeightRef = useRef(56);
	const [tabsStuck, setTabsStuck] = useState(false);

	const HEADER_BOTTOM = insets.top + 47.5;

	const chatTabs: TabConfig[] = [
		{
			text: t("all_chats"),
			content: AllChats
		},
		{
			text: t("other"),
			content: () => {
				return (
					<Box
						flex={1}
						centered
						bgColor={currentTheme.bg_200}
					>
						<InDevUi />
					</Box>
				);
			}
		}
	];

	const tabsStuckRef = useRef(false);
	const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
		const y = e.nativeEvent.contentOffset.y;
		lastScrollYRef.current = y;
		scrollOffsetsRef.current[activeTab] = y;
		const threshold = searchBlockHeightRef.current + 10;
		const stuck = y >= threshold;
		if (tabsStuckRef.current !== stuck) {
			tabsStuckRef.current = stuck;
			setTabsStuck(stuck);
		}
	};

	const handleTabPress = (index: number) => {
		if (index === activeTab) return;

		if (index === 1) {
			todoNotify();
			return;
		}

		const nextOffset = scrollOffsetsRef.current[index] ?? 0;
		setActiveTab(index);

		requestAnimationFrame(() => {
			scrollRef.current?.scrollTo({ y: nextOffset, animated: false });
		});
	};

	return (
		<ChatsWrapper
			tKey='chats_title'
			requiredBg={false}
			noBg
			icon={getProfileStatuses("ts", 17)}
			wrapperStyle={{ paddingVertical: 0, paddingHorizontal: 0 }}
			transparentSafeArea
			scrollEnabled={false}
			PageHeaderUiStyle={{ borderBottomWidth: 0 }}
			isBlurView={true}
			noSafeZone
			headerHeight={90}
			rightJsx={(
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
					<SimpleButtonUi
						onPress={() => (navigation as any).navigate('TestNativeChat')}
						style={{ marginRight: 10 }}
					>
						<MainText color={currentTheme.primary_100} fontWeight="bold">PERF</MainText>
					</SimpleButtonUi>
					<SimpleButtonUi
						onPress={onCreateChatPress}
					>
						<EditIcon size={22} color={currentTheme.primary_100} />
					</SimpleButtonUi>
				</View>
			)}
		>
			<Box
				style={s.chatsWrapper}
				centered={(data && (data?.chats?.length != 0)) ? false : true}
			>
				<ScrollView
					ref={scrollRef}
					onScroll={handleScroll}
					scrollEventThrottle={16}
					contentContainerStyle={{
						paddingBottom: 16,
						width: "100%",
					}}
					style={{ flex: 1, width: "100%" }}
				>
					<View style={{ height: HEADER_BOTTOM, width: "100%" }} />

					<Box
						style={{ paddingHorizontal: 10 }}
						onLayout={(e) => {
							searchBlockHeightRef.current = e.nativeEvent.layout.height;
						}}
					>
						<ChatSearchBar />
					</Box>

					<Box
						style={{
							paddingHorizontal: 10,
							marginTop: 7.5,
							marginBottom: 5,
							opacity: tabsStuck ? 0 : 1
						}}
					>
						<ChatTabsHeader
							tabs={chatTabs}
							activeTab={activeTab}
							onTabPress={handleTabPress}
							getBlurViewBgColor={getBlurViewBgColor}
						/>
					</Box>

					<Box style={{ flex: 1 }}>
						{activeTab === 0 ? (
							<AllChats scrollEnabled={false} />
						) : (
							<Box
								flex={1}
								centered
								bgColor={currentTheme.bg_200}
							>
								<InDevUi />
							</Box>
						)}
					</Box>

					<CreateChatSheet />
				</ScrollView>

				{tabsStuck && (
					<View
						style={[
							s.stickyTabsWrapper,
							{ top: HEADER_BOTTOM - 12.5 }
						]}
						pointerEvents="box-none"
					>
						<Box
							style={{
								paddingHorizontal: 10,
								marginVertical: 10
							}}
						>
							<ChatTabsHeader
								tabs={chatTabs}
								activeTab={activeTab}
								onTabPress={handleTabPress}
								getBlurViewBgColor={getBlurViewBgColor}
							/>
						</Box>
					</View>
				)}
			</Box >
		</ChatsWrapper >
	);
});

interface ChatSearchBarProps {
	value?: string;
	onChange?: (text: string) => void;
	placeholder?: string;
}

export const ChatSearchBar = observer(({
	value,
	onChange,
	placeholder
}: ChatSearchBarProps) => {
	const { currentTheme, getBlurViewBgColor } = themeStore;
	const {
		chatsInputText: { chatsInputText },
		handleChangeChatsInputText
	} = chatsInteractionsStore;

	const { t } = useTranslation();

	return (
		<BlurView
			intensity={25}
			style={[
				s.searchInputWrapper,
				{
					backgroundColor: changeRgbA(currentTheme.bg_100, 0.8),
					borderWidth: 0.7,
					borderColor: currentTheme.border_100,
				}
			]}
		>
			<Box
				centered
				style={s.searchIcon}
			>
				<SearchIcon
					size={16}
					color={currentTheme.secondary_100}
				/>
			</Box>

			<Box>
				<SimpleInputUi
					style={s.searchInput}
					value={value || chatsInputText}
					onChange={(e) => onChange ? onChange(e.nativeEvent.text) : handleChangeChatsInputText(e)}
					placeholder={placeholder || t("search_placeholder")}
					useValue
				/>
			</Box>
		</BlurView>
	);
});

const s = StyleSheet.create({
	searchIcon: {
		position: "absolute",
		left: 15,
		zIndex: 10000000,
	},
	searchInputWrapper: {
		width: "100%",
		borderRadius: 25,
		overflow: "hidden",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
		position: "relative",
	},
	searchWrapper: {
		paddingHorizontal: 10,
	},
	searchInput: {
		width: "100%",
		fontSize: 16,
		fontWeight: "600",
		height: 40,
		paddingHorizontal: 15,
		paddingLeft: 40,
	},
	chatsWrapper: {
		width: "100%",
		flex: 1,
		justifyContent: "flex-start"
	},
	stickyTabsWrapper: {
		position: "absolute",
		left: 0,
		right: 0,
		zIndex: 10,
	},
	chatsListContent: {},
	chatsList: {
		width: "100%",
		height: "100%",
		flex: 1,
	},
	emptyText: {},
	emptyContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center"
	},
	footerLoaderText: {},
	footerLoader: {},
	main: {
		flex: 1
	},
	loaderContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	loaderText: {
		marginTop: 16,
		fontSize: 16,
	},
});

interface ChatTabsHeaderProps {
	tabs: TabConfig[];
	activeTab: number;
	onTabPress: (index: number) => void;
	getBlurViewBgColor: () => string;
}

const ChatTabsHeader = ({
	tabs,
	activeTab,
	onTabPress,
	getBlurViewBgColor,
}: ChatTabsHeaderProps) => {
	const { currentTheme } = themeStore;

	return (
		<BlurView
			intensity={25}
			style={{
				height: 40,
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: changeRgbA(currentTheme.bg_100, 0.8),
				borderRadius: 25,
				borderWidth: 0.7,
				borderColor: currentTheme.border_100,
				overflow: "hidden",
				padding: 2.5
			}}
		>
			{tabs.map((tab, index) => {
				const isActive = index === activeTab;
				const Component = isActive ? BlurView : View;
				return (
					<Component
						intensity={25}
						key={index}
						style={[
							isActive && { backgroundColor: changeRgbA(currentTheme.bg_200, 0.8), },
							{
								flex: 1,
								alignItems: "center",
								justifyContent: "center",
								height: "100%",
								borderRadius: 25,
								overflow: "hidden",
							}
						]}
					>
						<SimpleButtonUi
							onPress={() => onTabPress(index)}
						>
							<MainText
								px={14}
								fontWeight={isActive ? 'bold' : 'normal'}
								color={currentTheme.text_100}
							>
								{tab.text}
							</MainText>
						</SimpleButtonUi>
					</Component>
				);
			})}
		</BlurView>
	);
};