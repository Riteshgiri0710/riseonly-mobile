import { GRID_POST_WIDTH } from '@config/const';
import { Box, CleverImage, MainText, SecondaryText } from '@core/ui';
import { formatBytes } from '@lib/text';
import { FlashList } from '@shopify/flash-list';
import { memoryServiceStore, memoryStore } from '@stores/memory';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, FlatList, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { themeStore } from 'src/modules/theme/stores';

interface CacheItem {
	key: string;
	value: any;
	size: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_SIZE = 3;
const SPACING = 2;
const ITEM_WIDTH = SCREEN_WIDTH / GRID_SIZE - SPACING;

export const CachedMedia = observer(() => {
	const { currentTheme } = themeStore;
	const { getCachedMediaItems, getWhichCacheItem } = memoryStore;

	const { height } = useWindowDimensions();
	const { t } = useTranslation();

	const getCacheItems = (item: CacheItem | null, key: string) => {
		const {
			imagesCacheItems: { imagesCacheItems },
			otherCacheItems: { otherCacheItems }
		} = memoryServiceStore;
		const { whichCacheItem: { whichCacheItem } } = memoryStore;

		const cacheRoute = {
			"CachedOther": { render: <RenderOtherCacheItem item={item} />, items: otherCacheItems?.items || [] },
			"CachedImages": { render: <RenderImagesCacheItem item={item} />, items: imagesCacheItems?.items || [] },
			"CachedPhotos": { render: <RenderOtherCacheItem item={item} />, items: otherCacheItems?.items || [] },
			"CachedVideos": { render: <RenderOtherCacheItem item={item} />, items: otherCacheItems?.items || [] },
			"CachedFiles": { render: <RenderOtherCacheItem item={item} />, items: otherCacheItems?.items || [] },
			"CachedStories": { render: <RenderOtherCacheItem item={item} />, items: otherCacheItems?.items || [] },
			"CachedAudio": { render: <RenderOtherCacheItem item={item} />, items: otherCacheItems?.items || [] },
		};

		return cacheRoute[whichCacheItem as keyof typeof cacheRoute][key as keyof typeof cacheRoute[keyof typeof cacheRoute]];
	};

	useEffect(() => {
		memoryServiceStore.getImagesCacheItems();
	}, []);

	return (
		<ProfileSettingsWrapper
			title={`${t("cache")}`}
			requiredBg={false}
			bgColor={currentTheme.bg_200}
			PageHeaderUiStyle={{
				backgroundColor: currentTheme.btn_bg_300
			}}
			height={38}
			wrapperNoPadding
			needScrollView={false}
		>
			<Box
				flex={1}
				minHeight={height}
				bgColor={currentTheme.btn_bg_300}
				style={{ paddingVertical: getWhichCacheItem() === "CachedImages" ? 0 : 10 }}
			>
				{getWhichCacheItem() === "CachedImages" ? (
					getCacheItems(null, "render")
				) : (
					<FlatList
						data={getCachedMediaItems().items}
						renderItem={({ item }) => getCacheItems(item, "render")}
						keyExtractor={(item) => item.key}
						ListEmptyComponent={<SecondaryText>Кэш пуст</SecondaryText>}
						style={styles.flatList}
						contentContainerStyle={styles.flatListContent}
					/>
				)}
			</Box>
		</ProfileSettingsWrapper>
	);
});

// RENDER COMPONENTS

const RenderOtherCacheItem = observer(({ item }: { item: CacheItem | null; }) => {
	const { currentTheme } = themeStore;
	const { getOtherCacheItems, deleteOtherCacheItem } = memoryServiceStore;

	useEffect(() => { getOtherCacheItems(); }, []);

	if (!item) return null;

	return (
		<View style={styles.dataItem}>
			<View style={styles.dataHeader}>
				<MainText style={styles.dataKey} numberOfLines={1}>
					{item.key}
				</MainText>
				<TouchableOpacity
					style={[styles.deleteButton, { backgroundColor: currentTheme.primary_100 }]}
					onPress={() => deleteOtherCacheItem(item.key)}
				>
					<Icon name="delete" size={16} color="#FFFFFF" />
				</TouchableOpacity>
			</View>

			<SecondaryText style={styles.dataSize}>
				{formatBytes(item.size)}
			</SecondaryText>

			<ScrollView style={styles.dataValueContainer}>
				<SecondaryText style={styles.dataValue}>
					{JSON.stringify(item.value)}
				</SecondaryText>
			</ScrollView>
		</View>
	);
});

const RenderImagesCacheItem = observer(({ item }: { item: CacheItem | null; }) => {
	const { currentTheme } = themeStore;
	const { imagesCacheItems: { imagesCacheItems } } = memoryServiceStore;

	const items = imagesCacheItems?.items || [];

	if (!items.length) {
		return null;
	}

	return (
		<View style={styles.gridContainer}>
			<FlashList
				data={[{}]}
				renderItem={() => {
					return (
						<Box style={styles.pageContainer}>
							{items.map((item: any) => {
								return (
									<TouchableOpacity
										key={item.id}
										style={[
											styles.postContainer,
											{
												width: GRID_POST_WIDTH,
												height: 150,
												borderColor: currentTheme.bg_200,
												borderWidth: 0.5,
												overflow: 'hidden',
												position: "relative"
											}
										]}
										activeOpacity={0.6}
									>
										<Animated.View
											style={styles.imageWrapper}
											sharedTransitionTag={item?.id?.toString()}
										>
											<CleverImage
												source={item.uri}
												imageStyles={styles.image}
												withoutWrapper={true}
												sharedTransitionTag={item?.id?.toString() + '1'}
											/>
										</Animated.View>
									</TouchableOpacity>
								);
							})}
						</Box>
					);
				}}
				estimatedItemSize={150}
				showsVerticalScrollIndicator={false}
				showsHorizontalScrollIndicator={false}
			/>
		</View>
	);
});

const styles = StyleSheet.create({
	pageContainer: {
		flex: 1,
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	imageWrapper: {
		width: "100%",
		height: "100%",
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	image: {
		width: "100%",
		height: "100%",
		objectFit: "cover"
	},
	postContainer: {
		position: 'relative',
	},
	title: {
		fontSize: 18,
		fontWeight: '600',
	},
	flatList: {
		flex: 1,
	},
	flatListContent: {
	},
	dataItem: {
		marginBottom: 16,
		marginHorizontal: 10,
		padding: 12,
		borderRadius: 8,
		backgroundColor: 'rgba(0, 0, 0, 0.2)',
	},
	dataHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	dataKey: {
		fontWeight: '600',
		flex: 1,
		marginRight: 8,
	},
	dataSize: {
		fontSize: 12,
		marginBottom: 8,
	},
	dataValueContainer: {
		maxHeight: 100,
		padding: 8,
		backgroundColor: 'rgba(0, 0, 0, 0.2)',
		borderRadius: 6,
	},
	dataValue: {
		fontSize: 12,
	},
	clearButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 8,
	},
	clearButtonText: {
		color: '#FFFFFF',
		fontWeight: '500',
		fontSize: 14,
	},
	deleteButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 6,
	},
	deleteButtonText: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '500',
		marginLeft: 4,
	},
	gridContainer: {
		flex: 1,
		width: "100%"
	},
	gridContent: {
		flex: 1
	},
	gridRow: {
		justifyContent: 'flex-start',
		gap: SPACING,
		marginBottom: SPACING,
	},
	gridItem: {
		borderRadius: 0,
		overflow: 'hidden',
		backgroundColor: 'rgba(0, 0, 0, 0.1)',
	},
	gridImage: {
		width: '100%',
		height: '100%',
	},
	deleteImageButton: {
		position: 'absolute',
		top: 4,
		right: 4,
		width: 24,
		height: 24,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
});