import { NoDataAnimation } from '@animations/components/NoDataAnimation';
import { RootStackParamList } from '@app/router';
import { AsyncDataRender, Box, MainText, SecondaryText, SimpleButtonUi, UserLogo, UserNameAndBadgeUi } from '@core/ui';
import { profileStore } from '@modules/user/stores/profile';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AnimatedFlashList } from '@shopify/flash-list';
import { SearchResultItem, tagActionsStore } from '@stores/tag';
import { observer } from 'mobx-react-lite';
import { MutableRefObject, RefObject, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet } from 'react-native';
import { searchActionsStore, searchInteractionsStore } from 'src/modules/search/stores/user';
import { themeStore } from 'src/modules/theme/stores';

export const GlobalSearchUsers = observer(({ headerRef }: { headerRef: RefObject<any>; }) => {
	const { currentTheme } = themeStore;
	const { profile } = profileStore;
	const {
		globalEntitys: { data, status }
	} = tagActionsStore;
	const {
		searchUserScrollRef: { setSearchUserScrollRef },
	} = searchInteractionsStore;

	const { t } = useTranslation();
	const { navigate } = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const scrollY = useRef(new Animated.Value(0)).current;
	const flatListRef = useRef(null) as MutableRefObject<null>;

	const handleScroll = useCallback(() => Animated.event(
		[{ nativeEvent: { contentOffset: { y: scrollY } } }],
		{
			useNativeDriver: true,
			listener: (event) => {
				searchActionsStore.users?.options?.dataScope?.onScroll?.(event);
				if (headerRef.current && headerRef.current.handleScroll) {
					headerRef.current.handleScroll(event);
				}
			}
		}
	), [headerRef.current, scrollY, searchActionsStore.users?.options?.dataScope?.onScroll]);

	const handleEntityPress = useCallback((entity: SearchResultItem) => {
		if (!entity) return;
		if (entity.user) {
			if (entity.user.id === profile?.id) {
				navigate("Profile" as any, {
					tag: entity.user.tag,
				});
				return;
			}
			navigate("UserPage", {
				userId: entity.user.id,
				tag: entity.user.tag,
			});
		} else {
			navigate("ChatProfile", {
				chatId: entity.chat?.id,
				tag: entity.chat?.tag,
			});
		}
	}, []);

	const renderItem = useCallback(
		({ item }: { item: SearchResultItem; }) => {
			const isUser = !!item.user;
			const user = item.user;
			const tag = item.user?.tag || item.chat?.tag || "error";

			return (
				<SimpleButtonUi
					style={{
						...s.userItem,
						backgroundColor: currentTheme.bg_200,
					}}
					onPress={() => handleEntityPress(item)}
				>
					<Box style={s.left}>
						<UserLogo
							source={item.user?.logo || item.chat?.logo_url || ''}
							size={50}
						/>
					</Box>

					<Box style={s.right}>
						<Box style={s.rightTop}>
							<Box style={s.rightTopLeft}>
								{isUser ? (
									<UserNameAndBadgeUi
										px={16.5}
										user={{ name: user?.name || "", tag: user?.tag || "", more: user?.more as any }}
										size={16}
									/>
								) : (
									<MainText>
										{item.chat?.title || "error"}
									</MainText>
								)}
							</Box>

							<Box style={s.rightTopRight}>
								{user?.is_premium && (
									<Box style={s.premiumBadge}>
										<MainText px={10}>
											Premium
										</MainText>
									</Box>
								)}
							</Box>
						</Box>

						<Box style={s.rightBot}>
							<Box style={s.rightBotLeft}>
								<SecondaryText
									numberOfLines={1}
									px={13}
									ellipsizeMode="tail"
								>
									@{tag}
								</SecondaryText>
							</Box>
						</Box>
					</Box>
				</SimpleButtonUi>
			);
		},
		[currentTheme, handleEntityPress],
	);

	useEffect(() => {
		if (flatListRef) {
			setSearchUserScrollRef(flatListRef);
		}
	}, [flatListRef]);

	return (
		<AsyncDataRender
			status={status}
			data={data?.results}
			noDataText={t('no_users_found')}
			emptyComponent={<NoDataAnimation />}
			renderContent={() => {
				return (
					<AnimatedFlashList
						onScroll={handleScroll}
						ref={flatListRef}
						data={data?.results}
						estimatedItemSize={70}
						scrollEventThrottle={16}
						renderItem={renderItem}
						keyExtractor={(item) => item.entity_id}
						contentContainerStyle={s.usersList}
					/>
				);
			}}
			messageHeightPercent={40}
		/>
	);
});

const s = StyleSheet.create({
	usersList: {
	},
	premiumBadge: {
		backgroundColor: 'rgba(255, 215, 0, 0.2)',
		borderRadius: 12,
		paddingHorizontal: 8,
		paddingVertical: 2,
	},
	ratingBadge: {
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: 10,
		paddingHorizontal: 6,
		paddingVertical: 2,
	},
	rightTopRight: {
		marginRight: 5,
		position: "absolute",
		right: 0
	},
	rightBotRight: {
		marginRight: 5,
		position: "absolute",
		top: 5,
		right: 0
	},
	rightTopLeft: {
		flex: 1,
		paddingRight: 80
	},
	rightBotLeft: {
		flex: 1,
		paddingRight: 80
	},
	rightTop: {
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
		marginBottom: 4,
	},
	rightBot: {
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
	},
	right: {
		borderBottomColor: themeStore.currentTheme.border_100,
		borderBottomWidth: 0.5,
		height: 65,
		paddingVertical: 8,
		flex: 1,
		justifyContent: "center",
	},
	left: {
		justifyContent: "center",
		alignItems: "center",
		height: 65,
		paddingLeft: 8,
	},
	userItem: {
		flexDirection: "row",
		height: 65,
		flex: 1,
		gap: 8
	},
});