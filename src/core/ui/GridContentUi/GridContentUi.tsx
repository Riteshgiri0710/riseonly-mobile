import { GRID_POST_WIDTH } from '@core/config/const';
import { VirtualList } from '@core/config/types';
import { AsyncDataRender, Box, CleverImage, LoaderUi, MainText } from '@core/ui';
import { calculatePadding } from '@lib/text';
import { observer } from 'mobx-react-lite';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { GetPostFeedResponse } from 'src/modules/post/stores';
import { SearchPost } from 'src/modules/search/stores/post';
import { themeStore } from 'src/modules/theme/stores';

interface BaseGridItem {
	id: string | number;
	images?: string[];
	title?: string;
	isTemp?: boolean;
	progress?: number;
}

interface GridItemAdapter<T> {
	getId: (item: T) => string | number;
	getImages: (item: T) => string[];
	getTitle?: (item: T) => string;
	getIsTemp?: (item: T) => boolean;
	getProgress?: (item: T) => number;
}

interface GridPostsProps<T extends GetPostFeedResponse | SearchPost | any = GetPostFeedResponse | SearchPost> {
	max?: number;
	data: VirtualList<T[]> | null | undefined;
	status?: "pending" | "fulfilled" | "rejected";
	handlePostPress: (entity: T) => void;
	handleScroll?: () => void;
	flatListRef?: MutableRefObject<null>;
	tag?: string;
	noDataTKey?: string;
	currentElement?: any[];
	postContainerStyle?: StyleProp<ViewStyle>;
	pageContainerStyle?: StyleProp<ViewStyle>;
	mainContainerStyle?: StyleProp<ViewStyle>;
	needPending?: boolean;
	fetchIfHaveData?: boolean;
	isPreview?: boolean;
	adapter?: GridItemAdapter<T>;
}

export const GridContentUi = observer(<T extends GetPostFeedResponse | SearchPost | any = GetPostFeedResponse | SearchPost>({
	max,
	data,
	status,
	handlePostPress,
	handleScroll,
	flatListRef,
	noDataTKey = 'no_posts',
	currentElement,
	postContainerStyle = {},
	pageContainerStyle = {},
	mainContainerStyle = {},
	needPending = true,
	fetchIfHaveData = true,
	isPreview = false,
	adapter
}: GridPostsProps<T>) => {

	const { currentTheme } = themeStore;
	const { t } = useTranslation();
	const titlePx = 3.5;

	const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<T>);

	const getId = useCallback((item: T): string | number => {
		if (adapter?.getId) return adapter.getId(item);
		return (item as any)?.id ?? '';
	}, [adapter]);

	const getImages = useCallback((item: T): string[] => {
		if (adapter?.getImages) return adapter.getImages(item);
		return (item as any)?.images ?? [];
	}, [adapter]);

	const getTitle = useCallback((item: T): string => {
		if (adapter?.getTitle) return adapter.getTitle(item);
		return (item as any)?.title ?? '';
	}, [adapter]);

	const getIsTemp = useCallback((item: T): boolean => {
		if (adapter?.getIsTemp) return adapter.getIsTemp(item);
		return (item as any)?.isTemp ?? false;
	}, [adapter]);

	const getProgress = useCallback((item: T): number => {
		if (adapter?.getProgress) return adapter.getProgress(item);
		return (item as any)?.progress ?? 0;
	}, [adapter]);

	const flatListData = useMemo(() => {
		if (max && currentElement) {
			return [...currentElement, ...(data?.list?.slice(0, max - 1) || [])] as T[];
		}
		return (data?.list || []) as T[];
	}, [max, currentElement, data?.list]);

	const keyExtractor = useCallback((item: T) => `post-${getId(item)}`, [getId]);

	const renderItem = useCallback(({ item }: { item: T; }) => {
		const itemId = getId(item);
		const itemImages = getImages(item);
		const itemTitle = getTitle(item);
		const itemIsTemp = getIsTemp(item);
		const itemProgress = getProgress(item);

		return (
			<TouchableOpacity
				style={[
					styles.postContainer,
					{
						width: GRID_POST_WIDTH,
						height: 150,
						borderColor: currentTheme.bg_200,
						borderWidth: 0.5,
						overflow: 'hidden',
						position: "relative"
					},
					postContainerStyle
				]}
				onPress={() => !max && handlePostPress(item)}
				activeOpacity={0.6}
			>
				{itemIsTemp && (
					<Box
						style={{ top: 0, left: 0, zIndex: 10 }}
						width={"100%"}
						height={"100%"}
						centered
						bgColor={"rgba(0, 0, 0, 0.5)"}
						position='absolute'
					>
						<LoaderUi
							color={currentTheme.text_100}
							size={40}
							progress={itemProgress}
							type='progress'
							closeCallback={() => {
								console.log("close");
							}}
						/>
					</Box>
				)}

				{itemImages?.[0] ? (
					<Animated.View
						style={styles.imageWrapper}
						sharedTransitionTag={itemId?.toString()}
					>
						<CleverImage
							source={itemImages[0] + ''}
							imageStyles={styles.image}
							withoutWrapper={true}
							sharedTransitionTag={itemId?.toString() + '1'}
						/>
					</Animated.View>
				) : (
					<View
						style={[
							styles.textContainer,
							{ backgroundColor: currentTheme.btn_bg_300 }
						]}
					>
						<MainText
							px={isPreview ? titlePx : calculatePadding(itemTitle)}
							tac='center'
						>
							{itemTitle || ''}
						</MainText>
					</View>
				)}
			</TouchableOpacity>
		);
	}, [currentTheme, max, handlePostPress, postContainerStyle, isPreview, titlePx, getId, getImages, getTitle, getIsTemp, getProgress]);

	return (
		<View style={[styles.mainContainer, mainContainerStyle]}>
			<AsyncDataRender
				status={status}
				data={data?.list}
				noDataText={t(noDataTKey)}
				noDataHeightPercent={5}
				renderContent={() => {
					return (
						<View style={[styles.listContainer, pageContainerStyle]}>
							<AnimatedFlatList
								key="grid-flatlist"
								keyExtractor={keyExtractor}
								ref={flatListRef}
								data={flatListData as any}
								renderItem={renderItem}
								numColumns={3}
								onScroll={handleScroll}
								bounces={false}
								scrollEventThrottle={16}
								style={styles.flatList}
								contentContainerStyle={styles.contentContainer}
								removeClippedSubviews={true}
								maintainVisibleContentPosition={{
									minIndexForVisible: 0,
									autoscrollToTopThreshold: 0
								}}
							/>
						</View>
					);
				}}
				messageHeightPercent={20}
			/>
		</View>
	);
});
const styles = StyleSheet.create({
	mainContainer: { flex: 1, },
	listContainer: { flex: 1, },
	flatList: { flex: 1, },
	contentContainer: { paddingBottom: 80, },
	textContainer: {
		width: "100%",
		height: "100%",
		justifyContent: "center",
		padding: 10,
		alignItems: "center",
	},
	postContainer: {
		position: 'relative',
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
});