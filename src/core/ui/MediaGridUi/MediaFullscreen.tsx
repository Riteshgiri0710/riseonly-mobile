import { ResizeMode, Video } from 'expo-av';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Modal, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
	Easing,
	runOnJS,
	useAnimatedGestureHandler,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming
} from 'react-native-reanimated';
import { MediaGridItem } from './MediaGridUi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MediaFullscreenProps {
	visible: boolean;
	items: MediaGridItem[];
	initialIndex: number;
	onClose: () => void;
}

interface MediaItemProps {
	item: MediaGridItem;
	getDisplayUrl: (item: MediaGridItem) => string | null;
	onToggleBars?: () => void;
	onZoomChange?: (isZoomed: boolean) => void;
}

const MediaItem = memo(({ item, getDisplayUrl, onToggleBars, onZoomChange }: MediaItemProps) => {
	const displayUrl = getDisplayUrl(item);
	if (!displayUrl) return null;

	const sharedId = item?.id ? `media-${item.id}` : undefined;

	const isVideo = (item.content_type || '').toLowerCase() === 'video' ||
		(item.media_info?.media_type || '').toLowerCase() === 'video' ||
		(item.media_info?.mime_type || '').toLowerCase().startsWith('video/');

	const videoUrl = isVideo ? item.media_info?.file_url : null;
	const thumbnailUrl = isVideo ? (item.media_info?.thumbnail_url || item.media_info?.file_url) : displayUrl;

	const { width: itemWidth, height: itemHeight } = Dimensions.get('window');
	const videoRef = useRef<Video>(null);
	const [isPlaying, setIsPlaying] = useState(false);

	const scale = useSharedValue(1);
	const savedScale = useSharedValue(1);
	const translateX = useSharedValue(0);
	const translateY = useSharedValue(0);
	const savedTranslateX = useSharedValue(0);
	const savedTranslateY = useSharedValue(0);
	const focalX = useSharedValue(0);
	const focalY = useSharedValue(0);
	const isPinching = useSharedValue(false);
	const canPan = useSharedValue(true);

	const MIN_SCALE = 1;
	const MAX_SCALE = 4;

	const clampTranslation = (scaleValue: number) => {
		'worklet';
		if (scaleValue <= 1) {
			translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
			translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
			savedTranslateX.value = 0;
			savedTranslateY.value = 0;
			return;
		}

		const maxTranslateX = (itemWidth * (scaleValue - 1)) / 2;
		const maxTranslateY = (itemHeight * (scaleValue - 1)) / 2;

		if (Math.abs(translateX.value) > maxTranslateX) {
			translateX.value = withSpring(
				translateX.value > 0 ? maxTranslateX : -maxTranslateX,
				{ damping: 20, stiffness: 90 }
			);
			savedTranslateX.value = translateX.value;
		}

		if (Math.abs(translateY.value) > maxTranslateY) {
			translateY.value = withSpring(
				translateY.value > 0 ? maxTranslateY : -maxTranslateY,
				{ damping: 20, stiffness: 90 }
			);
			savedTranslateY.value = translateY.value;
		}
	};

	const pinchGesture = Gesture.Pinch()
		.onStart((event) => {
			isPinching.value = true;
			canPan.value = false;
			focalX.value = event.focalX;
			focalY.value = event.focalY;
			savedScale.value = scale.value;
			savedTranslateX.value = translateX.value;
			savedTranslateY.value = translateY.value;
		})
		.onUpdate((event) => {
			'worklet';
			const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, savedScale.value * event.scale));
			scale.value = newScale;

			if (newScale > 1) {
				const deltaX = (focalX.value - itemWidth / 2) * (1 - savedScale.value / newScale);
				const deltaY = (focalY.value - itemHeight / 2) * (1 - savedScale.value / newScale);
				translateX.value = savedTranslateX.value + deltaX;
				translateY.value = savedTranslateY.value + deltaY;
			} else {
				translateX.value = 0;
				translateY.value = 0;
			}
		})
		.onEnd(() => {
			'worklet';
			isPinching.value = false;

			const currentScale = scale.value;
			const currentX = translateX.value;
			const currentY = translateY.value;

			if (currentScale < MIN_SCALE) {
				scale.value = withSpring(MIN_SCALE, { damping: 20, stiffness: 90 });
				translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
				translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
				savedScale.value = MIN_SCALE;
				savedTranslateX.value = 0;
				savedTranslateY.value = 0;
				if (onZoomChange) {
					runOnJS(onZoomChange)(false);
				}
				return;
			}

			savedScale.value = currentScale;

			let finalX = currentX;
			let finalY = currentY;
			let needsCorrectionX = false;
			let needsCorrectionY = false;

			if (currentScale <= 1) {
				if (Math.abs(currentX) > 0.01) {
					finalX = 0;
					needsCorrectionX = true;
				}
				if (Math.abs(currentY) > 0.01) {
					finalY = 0;
					needsCorrectionY = true;
				}
			} else {
				const maxTranslateX = (itemWidth * (currentScale - 1)) / 2;
				const maxTranslateY = (itemHeight * (currentScale - 1)) / 2;

				if (Math.abs(currentX) > maxTranslateX) {
					finalX = currentX > 0 ? maxTranslateX : -maxTranslateX;
					needsCorrectionX = true;
				}

				if (Math.abs(currentY) > maxTranslateY) {
					finalY = currentY > 0 ? maxTranslateY : -maxTranslateY;
					needsCorrectionY = true;
				}
			}

			savedTranslateX.value = finalX;
			savedTranslateY.value = finalY;

			const xDiff = Math.abs(currentX - finalX);
			const yDiff = Math.abs(currentY - finalY);

			if (needsCorrectionX || xDiff > 0.01) {
				translateX.value = withSpring(finalX, { damping: 20, stiffness: 90 });
			} else {
				translateX.value = finalX;
			}

			if (needsCorrectionY || yDiff > 0.01) {
				translateY.value = withSpring(finalY, { damping: 20, stiffness: 90 });
			} else {
				translateY.value = finalY;
			}

			canPan.value = true;

			const isZoomed = currentScale > 1;
			if (onZoomChange) {
				runOnJS(onZoomChange)(isZoomed);
			}
		});

	const panGesture = Gesture.Pan()
		.manualActivation(true)
		.onTouchesDown((event, stateManager) => {
			'worklet';
			if (canPan.value && !isPinching.value && scale.value > 1) {
				stateManager.activate();
			} else {
				stateManager.fail();
			}
		})
		.onStart(() => {
			'worklet';
			savedTranslateX.value = translateX.value;
			savedTranslateY.value = translateY.value;
		})
		.onUpdate((event) => {
			'worklet';
			if (!canPan.value || isPinching.value || scale.value <= 1) {
				return;
			}
			translateX.value = savedTranslateX.value + event.translationX;
			translateY.value = savedTranslateY.value + event.translationY;

			const maxTranslateX = (itemWidth * (scale.value - 1)) / 2;
			const maxTranslateY = (itemHeight * (scale.value - 1)) / 2;
			translateX.value = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX.value));
			translateY.value = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY.value));
		})
		.onEnd(() => {
			'worklet';
			if (!canPan.value || isPinching.value || scale.value <= 1) {
				return;
			}
			savedTranslateX.value = translateX.value;
			savedTranslateY.value = translateY.value;
			clampTranslation(scale.value);
		});

	const doubleTapGesture = Gesture.Tap()
		.numberOfTaps(2)
		.onEnd((event) => {
			if (scale.value > 1) {
				scale.value = withSpring(1, { damping: 20, stiffness: 90 });
				translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
				translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
				savedScale.value = 1;
				savedTranslateX.value = 0;
				savedTranslateY.value = 0;

				if (onZoomChange) {
					runOnJS(onZoomChange)(false);
				}
			} else {
				const targetScale = 2.5;
				scale.value = withSpring(targetScale, { damping: 20, stiffness: 90 });
				savedScale.value = targetScale;

				const deltaX = (event.x - itemWidth / 2) * (1 - targetScale);
				const deltaY = (event.y - itemHeight / 2) * (1 - targetScale);
				translateX.value = withSpring(deltaX, { damping: 20, stiffness: 90 });
				translateY.value = withSpring(deltaY, { damping: 20, stiffness: 90 });
				savedTranslateX.value = deltaX;
				savedTranslateY.value = deltaY;

				if (onZoomChange) {
					runOnJS(onZoomChange)(true);
				}
			}
		});

	const singleTapGesture = Gesture.Tap()
		.numberOfTaps(1)
		.maxDuration(250)
		.onEnd(() => {
			'worklet';
			if (onToggleBars) {
				runOnJS(onToggleBars)();
			}
		})
		.requireExternalGestureToFail(doubleTapGesture);

	const composedGesture = Gesture.Simultaneous(
		Gesture.Race(doubleTapGesture, singleTapGesture),
		Gesture.Simultaneous(pinchGesture, panGesture)
	);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: translateX.value },
			{ translateY: translateY.value },
			{ scale: scale.value },
		],
	}));

	const handlePlayPause = useCallback(() => {
		if (isVideo && videoRef.current) {
			if (isPlaying) {
				videoRef.current.pauseAsync();
			} else {
				videoRef.current.playAsync();
			}
			setIsPlaying(!isPlaying);
		}
	}, [isVideo, isPlaying]);

	const handleVideoLoad = useCallback(() => {
		if (isVideo && videoUrl && videoRef.current && typeof videoRef.current.playAsync === 'function') {
			setIsPlaying(true);
			videoRef.current.playAsync().catch(() => {
				setIsPlaying(false);
			});
		}
	}, [isVideo, videoUrl]);

	useEffect(() => {
		return () => {
			if (videoRef.current && typeof videoRef.current.pauseAsync === 'function') {
				videoRef.current.pauseAsync().catch(() => {
				});
			}
			setIsPlaying(false);
		};
	}, [isVideo, videoUrl]);

	return (
		<View style={styles.imageContainer}>
			{isVideo && videoUrl ? (
				<Video
					ref={videoRef}
					source={{ uri: videoUrl }}
					style={styles.image}
					resizeMode={ResizeMode.CONTAIN}
					shouldPlay={true}
					isLooping={true}
					useNativeControls={true}
					posterSource={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
					onLoad={handleVideoLoad}
					onPlaybackStatusUpdate={(status) => {
						if (status.isLoaded && status.isPlaying !== undefined) {
							setIsPlaying(status.isPlaying);
						}
					}}
				/>
			) : (
				<GestureDetector gesture={composedGesture}>
					<Animated.View style={animatedStyle}>
						<Animated.Image
							source={{ uri: displayUrl }}
							style={styles.image}
							resizeMode="contain"
							sharedTransitionTag={sharedId}
						/>
					</Animated.View>
				</GestureDetector>
			)}
		</View>
	);
});

MediaItem.displayName = 'MediaItem';

const MediaFullscreenComponent = ({ visible, items, initialIndex, onClose }: MediaFullscreenProps) => {
	const [currentIndex, setCurrentIndex] = useState(initialIndex);
	const flatListRef = useRef<FlatList>(null);
	const translateY = useSharedValue(0);
	const opacity = useSharedValue(0);
	const barsOpacity = useSharedValue(0.5);
	const showBarsShared = useSharedValue(true);
	const isZoomed = useSharedValue(false);
	const zoomStateRef = useRef<{ [key: number]: boolean; }>({});

	const handleClose = useCallback(() => {
		onClose();
	}, [onClose]);

	const handleToggleBars = useCallback(() => {
		const newValue = !showBarsShared.value;
		showBarsShared.value = newValue;
		barsOpacity.value = withTiming(newValue ? 0.5 : 0, { duration: 200 });
	}, []);


	const VIDEO_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

	const getDisplayUrl = useCallback((item: MediaGridItem): string | null => {
		if (!item) return null;
		const isVideo = (item.content_type || '').toLowerCase() === 'video' ||
			(item.media_info?.media_type || '').toLowerCase() === 'video' ||
			(item.media_info?.mime_type || '').toLowerCase().startsWith('video/');
		if (isVideo) {
			return item.media_info?.thumbnail_url || VIDEO_PLACEHOLDER;
		}
		return item.media_info?.file_url || null;
	}, []);

	useEffect(() => {
		if (visible && items.length > 0) {
			const validIndex = Math.max(0, Math.min(initialIndex, items.length - 1));
			setCurrentIndex(validIndex);
			translateY.value = 0;
			opacity.value = 1;
			showBarsShared.value = true;
			barsOpacity.value = 0.5;

			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					try {
						if (flatListRef.current && validIndex >= 0 && validIndex < items.length) {
							flatListRef.current.scrollToIndex({
								index: validIndex,
								animated: false
							});
						}
					} catch (error) {
						console.warn('Error scrolling to index:', error);
						if (flatListRef.current) {
							flatListRef.current.scrollToOffset({
								offset: SCREEN_WIDTH * validIndex,
								animated: false
							});
						}
					}
				});
			});
		} else {
			translateY.value = 0;
			opacity.value = 0;
			barsOpacity.value = 0.5;
			showBarsShared.value = true;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [visible, initialIndex, items.length]);

	const startY = useSharedValue(0);

	const gestureHandler = useAnimatedGestureHandler({
		onStart: (_, ctx: any) => {
			if (isZoomed.value) {
				return;
			}
			ctx.startY = translateY.value;
		},
		onActive: (event, ctx) => {
			if (isZoomed.value) {
				return;
			}
			if (event.translationY > 0) {
				translateY.value = ctx.startY + event.translationY;
				const progress = Math.min(translateY.value / 300, 1);
				opacity.value = 1 - progress * 0.7;
				barsOpacity.value = Math.max(0, 0.5 - progress);
			}
		},
		onEnd: (event) => {
			if (isZoomed.value) {
				return;
			}
			if (translateY.value > 150 || event.velocityY > 350) {
				opacity.value = withTiming(0, { duration: 200 });
				barsOpacity.value = withTiming(0, { duration: 200 });
				translateY.value = withTiming(SCREEN_HEIGHT, {
					duration: 300,
					easing: Easing.bezier(0.16, 1, 0.3, 1)
				}, (finished) => {
					if (finished) {
						runOnJS(handleClose)();
					}
				});
			} else {
				translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
				opacity.value = withSpring(1, { damping: 15, stiffness: 150 });
				barsOpacity.value = withSpring(0.5, { damping: 15, stiffness: 150 });
			}
		}
	});

	const handleZoomChange = useCallback((index: number, zoomed: boolean) => {
		zoomStateRef.current[index] = zoomed;
		if (index === currentIndex) {
			isZoomed.value = zoomed;
		}
	}, [currentIndex]);

	const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
		if (viewableItems && viewableItems.length > 0 && viewableItems[0]) {
			const index = viewableItems[0].index;
			if (index !== null && index !== undefined && index >= 0 && index < items.length) {
				setCurrentIndex(index);
				const currentZoomed = zoomStateRef.current[index] || false;
				isZoomed.value = currentZoomed;
			}
		}
	}, [items.length]);

	const containerStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	const wrapperStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	const barsStyle = useAnimatedStyle(() => ({
		opacity: barsOpacity.value,
	}));

	const renderItem = useCallback(({ item, index }: { item: MediaGridItem; index: number; }) => {
		return (
			<MediaItem
				item={item}
				getDisplayUrl={getDisplayUrl}
				onToggleBars={handleToggleBars}
				onZoomChange={(zoomed) => handleZoomChange(index, zoomed)}
			/>
		);
	}, [getDisplayUrl, handleToggleBars, handleZoomChange]);

	const keyExtractor = useCallback((item: MediaGridItem) => item.id || String(item), []);

	const getItemLayout = useCallback((_: any, index: number) => {
		if (index < 0 || index >= items.length) {
			return { length: SCREEN_WIDTH, offset: 0, index: 0 };
		}
		return {
			length: SCREEN_WIDTH,
			offset: SCREEN_WIDTH * index,
			index,
		};
	}, [items.length]);

	if (!visible || items.length === 0) return null;

	return (
		<Modal
			visible={visible}
			transparent
			animationType="none"
			onRequestClose={handleClose}
			statusBarTranslucent
			hardwareAccelerated={true}
		>
			<Animated.View style={[styles.container, containerStyle]}>
				<PanGestureHandler
					onGestureEvent={gestureHandler}
					activeOffsetY={10}
					failOffsetX={[-30, 30]}
					shouldCancelWhenOutside={false}
				>
					<Animated.View style={[styles.wrapper, wrapperStyle]}>
						<FlatList
							ref={flatListRef}
							data={items}
							renderItem={renderItem}
							keyExtractor={keyExtractor}
							horizontal
							pagingEnabled
							showsHorizontalScrollIndicator={false}
							getItemLayout={getItemLayout}
							initialScrollIndex={Math.max(0, Math.min(initialIndex, items.length - 1))}
							removeClippedSubviews={false}
							maxToRenderPerBatch={3}
							windowSize={5}
							initialNumToRender={3}
							onViewableItemsChanged={handleViewableItemsChanged}
							viewabilityConfig={{
								itemVisiblePercentThreshold: 50,
							}}
							scrollEventThrottle={16}
							bounces={false}
							decelerationRate="fast"
							onScrollToIndexFailed={(info) => {
								console.warn('ScrollToIndex failed:', info);
								const wait = new Promise(resolve => setTimeout(resolve, 500));
								wait.then(() => {
									if (flatListRef.current && info.index >= 0 && info.index < items.length) {
										flatListRef.current.scrollToIndex({
											index: info.index,
											animated: false
										});
									}
								});
							}}
						/>
					</Animated.View>
				</PanGestureHandler>

				<Animated.View style={[styles.topBar, barsStyle]} pointerEvents="none" />
				<Animated.View style={[styles.bottomBar, barsStyle]} pointerEvents="none" />
			</Animated.View>
		</Modal>
	);
};

export const MediaFullscreen = memo(MediaFullscreenComponent);

MediaFullscreen.displayName = 'MediaFullscreen';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000000',
	},
	wrapper: {
		flex: 1,
	},
	imageContainer: {
		width: SCREEN_WIDTH,
		height: SCREEN_HEIGHT,
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		width: SCREEN_WIDTH,
		height: SCREEN_HEIGHT,
	},
	topBar: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: 100,
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
	},
	bottomBar: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: 100,
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
	},
});
