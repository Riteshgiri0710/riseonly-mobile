import { memo, useCallback, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

export interface MediaGridItem {
	id: string;
	content_type?: string;
	media_info?: {
		file_url?: string;
		thumbnail_url?: string;
		media_type?: string;
		mime_type?: string;
		duration?: number | null;
	};
}

interface MediaGridUiProps {
	items: Array<{ item: MediaGridItem; index: number; }>;
	onItemPress?: (index: number) => void;
	numColumns?: number;
	scrollEnabled?: boolean;
	contentContainerStyle?: any;
	style?: any;
}

const formatDuration = (seconds?: number | null): string => {
	if (!seconds) return '0:00';
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const VIDEO_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

interface GridItemProps {
	item: MediaGridItem;
	index: number;
	itemSize: number;
	onPress: (index: number) => void;
}

const GridItem = memo(({ item, index, itemSize, onPress }: GridItemProps) => {
	const isVideo = useMemo(() => {
		return (item.content_type || '').toLowerCase() === 'video' ||
			(item.media_info?.media_type || '').toLowerCase() === 'video' ||
			(item.media_info?.mime_type || '').toLowerCase().startsWith('video/');
	}, [item.content_type, item.media_info?.media_type, item.media_info?.mime_type]);

	const displayUrl = useMemo(() => {
		if (isVideo) {
			return item.media_info?.thumbnail_url || VIDEO_PLACEHOLDER;
		}
		return item.media_info?.file_url;
	}, [isVideo, item.media_info?.thumbnail_url, item.media_info?.file_url]);

	const handlePress = useCallback(() => {
		onPress(index);
	}, [index, onPress]);

	if (!displayUrl) return null;

	const duration = item.media_info?.duration;
	const sharedId = item?.id ? `media-${item.id}` : undefined;

	return (
		<View style={[styles.itemContainer, { width: itemSize, height: itemSize }]}>
			<Pressable style={styles.pressable} onPress={handlePress}>
				<Animated.Image
					source={{ uri: displayUrl }}
					style={styles.image}
					resizeMode="cover"
					sharedTransitionTag={sharedId}
				/>
				{isVideo && (
					<>
						<View style={styles.playButtonOverlay} pointerEvents="none">
							<View style={styles.playButton}>
								<View style={styles.playIcon} />
							</View>
						</View>
						{duration && (
							<View style={styles.videoDurationBadge} pointerEvents="none">
								<Text style={styles.videoDurationText}>
									{formatDuration(duration)}
								</Text>
							</View>
						)}
					</>
				)}
			</Pressable>
		</View>
	);
});

GridItem.displayName = 'GridItem';

export const MediaGridUi = ({
	items,
	onItemPress,
	numColumns = 3,
	scrollEnabled = false,
	contentContainerStyle,
	style,
}: MediaGridUiProps) => {
	const { width: screenWidth } = useWindowDimensions();
	const itemSize = useMemo(() => (screenWidth - 4) / numColumns, [screenWidth, numColumns]);

	const handleItemPress = useCallback((index: number) => {
		onItemPress?.(index);
	}, [onItemPress]);

	const renderItem = useCallback(({ item: { item, index } }: { item: { item: MediaGridItem; index: number; }; }) => {
		return (
			<GridItem
				item={item}
				index={index}
				itemSize={itemSize}
				onPress={handleItemPress}
			/>
		);
	}, [itemSize, handleItemPress]);

	const keyExtractor = useCallback((item: { item: MediaGridItem; index: number; }) => item.item.id, []);

	return (
		<FlashList
			data={items}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			numColumns={numColumns}
			estimatedItemSize={itemSize}
			contentContainerStyle={[styles.listContainer, contentContainerStyle]}
			style={[{ width: "100%", height: "100%" }, style]}
			scrollEnabled={scrollEnabled}
			drawDistance={itemSize * numColumns * 3}
		/>
	);
};

const styles = StyleSheet.create({
	listContainer: {
		paddingBottom: 80,
	},
	itemContainer: {
		margin: 0.5,
		overflow: 'hidden',
		position: 'relative',
	},
	pressable: {
		width: '100%',
		height: '100%',
	},
	image: {
		width: '100%',
		height: '100%',
	},
	playButtonOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 4,
	},
	playButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	playIcon: {
		width: 0,
		height: 0,
		borderLeftWidth: 14,
		borderTopWidth: 8,
		borderBottomWidth: 8,
		borderLeftColor: 'white',
		borderTopColor: 'transparent',
		borderBottomColor: 'transparent',
		marginLeft: 3,
	},
	videoDurationBadge: {
		position: 'absolute',
		bottom: 6,
		right: 6,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		paddingHorizontal: 4,
		paddingVertical: 2,
		borderRadius: 3,
		zIndex: 5,
	},
	videoDurationText: {
		color: 'white',
		fontSize: 9,
		fontWeight: '600',
	},
});

