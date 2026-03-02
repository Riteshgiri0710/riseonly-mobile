import { EyesAnimation } from '@animations/components/EyesAnimation';
import defaultBannerImport from '@images/BgTheme2.png';
import defaultLogoImport from '@images/defaultlogo.jpg';
import { logger } from '@lib/helpers';
import { appStorage } from '@storage/AppStorage';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { BlurView } from 'expo-blur';
import * as FileSystem from 'expo-file-system';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Image, ImageBackground, ImageProps, ImageStyle, Modal, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, { AnimateProps, runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { themeStore } from 'src/modules/theme/stores';
import { SkeletonUi } from '../SkeletonUi/SkeletonUi';

type AnimatedImageProps = AnimateProps<ImageProps>;

interface CleverImageProps extends AnimatedImageProps {
	source: any;
	alt?: string;
	placeholderStyles?: ViewStyle;
	type?: "default" | "user" | "banner";
	imageStyles?: StyleProp<ImageStyle>;
	wrapperStyles?: ViewStyle;
	withoutWrapper?: boolean;
	blur?: boolean;
	withBackgroundBlur?: boolean;
	blurRadius?: number;
	imgOpacity?: number;
	resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
	intensity?: number;
	onImageLoad?: () => void;
	onPress?: () => void;
	cacheTime?: number;
	debugDownload?: boolean;
	// Video props
	isVideo?: boolean;
	videoUri?: string;
	isInView?: boolean;
	onVideoPress?: () => void;
	autoPlay?: boolean;
	onRemainingTimeUpdate?: (remainingSeconds: number) => void;
	skipPoster?: boolean;
}

export const CleverImage = observer(({
	source,
	alt = "Image",
	type = "default",
	placeholderStyles,
	intensity,
	imageStyles,
	wrapperStyles,
	debugDownload = false,
	withoutWrapper = false,
	blur = false,
	withBackgroundBlur = false,
	blurRadius = 15,
	imgOpacity = 1,
	resizeMode = 'contain',
	onImageLoad,
	onPress,
	cacheTime,
	// Video props
	isVideo = false,
	videoUri,
	isInView = false,
	onVideoPress,
	autoPlay = false,
	onRemainingTimeUpdate,
	skipPoster = false,
	...props
}: CleverImageProps) => {
	const { currentTheme } = themeStore;
	const effectiveResizeMode = type === 'user' ? (resizeMode === 'contain' ? 'cover' : resizeMode) : resizeMode;

	const [imageLoaded, setImageLoaded] = useState(false);
	const [cachedSource, setCachedSource] = useState<any>(null);
	const [isLoadingFromNetwork, setIsLoadingFromNetwork] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [duration, setDuration] = useState(0);
	const [position, setPosition] = useState(0);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [imageError, setImageError] = useState(false);
	const [retryCount, setRetryCount] = useState(0);
	const originalSourceRef = useRef<string | null>(null);

	const videoRef = useRef<Video>(null);
	const opacity = useSharedValue(0);
	const progressX = useSharedValue(0);
	const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

	useEffect(() => {
		if (isVideo && videoRef.current && videoUri) {
			const shouldPlayVideo = (isInView || autoPlay) && !isFullscreen;
			if (shouldPlayVideo) {
				const timer = setTimeout(() => {
					if (videoRef.current && typeof videoRef.current.playAsync === 'function') {
						videoRef.current.playAsync().catch((error) => {
							console.log('Video play error:', error);
						});
						setIsPlaying(true);
					}
				}, 100);
				return () => clearTimeout(timer);
			} else {
				if (videoRef.current && typeof videoRef.current.pauseAsync === 'function') {
					videoRef.current.pauseAsync().catch((error) => {
						console.log('Video pause error:', error);
					});
				}
				setIsPlaying(false);
			}
		}
	}, [isInView, isVideo, isFullscreen, autoPlay, videoUri]);

	useEffect(() => {
		if (isVideo && videoRef.current && isInView && !isPlaying) {
			if (videoRef.current && typeof videoRef.current.setPositionAsync === 'function') {
				videoRef.current.setPositionAsync(0).catch((error) => {
					console.log('Error setting video position:', error);
				});
				setPosition(0);
				progressX.value = 0;
			}
		}
	}, [isInView, isVideo, isPlaying]);

	useEffect(() => {
		if (isVideo && autoPlay && videoRef.current && videoUri && !isFullscreen) {
			const timer = setTimeout(() => {
				if (videoRef.current && typeof videoRef.current.playAsync === 'function') {
					videoRef.current.playAsync().catch((error) => {
						console.log('AutoPlay video error:', error);
					});
					setIsPlaying(true);
				}
			}, 200);
			return () => clearTimeout(timer);
		}
	}, [isVideo, autoPlay, videoUri, isFullscreen]);

	const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
		if (status.isLoaded) {
			setDuration(status.durationMillis || 0);
			setPosition(status.positionMillis || 0);

			// Обновляем состояние воспроизведения
			if (status.isPlaying !== isPlaying) {
				setIsPlaying(status.isPlaying || false);
			}

			if (status.durationMillis && status.durationMillis > 0) {
				const progress = (status.positionMillis || 0) / status.durationMillis;
				progressX.value = progress * (screenWidth - 40);

				if (onRemainingTimeUpdate) {
					const remainingMillis = status.durationMillis - (status.positionMillis || 0);
					const remainingSeconds = Math.floor(remainingMillis / 1000);
					onRemainingTimeUpdate(Math.max(0, remainingSeconds));
				}
			}
		}
	}, [screenWidth, onRemainingTimeUpdate, isPlaying]);

	const progressGestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
		onStart: () => {
			if (videoRef.current && typeof videoRef.current.pauseAsync === 'function') {
				runOnJS((ref: any) => {
					if (ref && typeof ref.pauseAsync === 'function') {
						ref.pauseAsync().catch((error: any) => {
							console.log('Video pause error:', error);
						});
					}
				})(videoRef.current);
			}
		},
		onActive: (event: PanGestureHandlerGestureEvent['nativeEvent']) => {
			const maxWidth = screenWidth - 40;
			const newX = Math.max(0, Math.min(event.x, maxWidth));
			progressX.value = newX;

			const newPosition = (newX / maxWidth) * duration;
			runOnJS((pos: number) => {
				if (videoRef.current && typeof videoRef.current.setPositionAsync === 'function') {
					videoRef.current.setPositionAsync(pos).catch((error: any) => {
						console.log('Error setting video position:', error);
					});
				}
			})(newPosition);
		},
		onEnd: () => {
			if (videoRef.current && isPlaying && typeof videoRef.current.playAsync === 'function') {
				runOnJS((ref: any) => {
					if (ref && typeof ref.playAsync === 'function') {
						ref.playAsync().catch((error: any) => {
							console.log('Video play error:', error);
						});
					}
				})(videoRef.current);
			}
		}
	});

	const handleVideoPress = useCallback(() => {
		if (onVideoPress) {
			onVideoPress();
			return;
		}
		setIsFullscreen(true);
	}, [onVideoPress]);

	const animatedImageStyle = useAnimatedStyle(() => { return { opacity: opacity.value }; });
	const progressBarStyle = useAnimatedStyle(() => { return { width: progressX.value, }; });
	const progressHandleStyle = useAnimatedStyle(() => {
		return { transform: [{ translateX: progressX.value }] };
	});
	const handleCloseFullscreen = useCallback(() => { setIsFullscreen(false); }, []);

	useEffect(() => {
		if (!source) return;

		if (isVideo) {
			setCachedSource(source);
			setIsLoadingFromNetwork(false);
			setImageLoaded(false);
			setImageError(false);
			setRetryCount(0);
			return;
		}

		let isCancelled = false;

		if (typeof source === 'string' && source.startsWith('http')) {
			if (hasVideoExtensionUrl(source)) {
				setImageError(true);
				setCachedSource(null);
				setIsLoadingFromNetwork(false);
				return;
			}

			originalSourceRef.current = source;
			setImageError(false);
			setRetryCount(0);

			const mediaKey = `image_${hashString(source)}`;

			setCachedSource({ uri: source });
			setIsLoadingFromNetwork(true);
			setImageLoaded(false);

			const loadCachedImage = async () => {
				try {
					let cachedPath = sessionMediaCache.get(mediaKey);
					if (!cachedPath) {
						cachedPath = await appStorage.getMedia(mediaKey) ?? undefined;
						if (cachedPath && sessionMediaCache.size < SESSION_CACHE_MAX) {
							sessionMediaCache.set(mediaKey, cachedPath);
						}
					}

					if (isCancelled) return;

					if (cachedPath && cachedPath !== source) {
						try {
							const fileInfo = await FileSystem.getInfoAsync(cachedPath);
							if (fileInfo.exists) {
								if (debugDownload) {
									logger.ui("CleverImage", `✅ Loading from CACHE: ${cachedPath}`);
								}
								setCachedSource({ uri: cachedPath });
								setIsLoadingFromNetwork(false);
								return;
							}
							sessionMediaCache.delete(mediaKey);
							if (debugDownload) {
								logger.ui("CleverImage", `⚠️ Cached file missing, removing: ${mediaKey}`);
							}
							await appStorage.removeMedia(mediaKey);
						} catch (fileCheckError) {
							if (!isCancelled) {
								sessionMediaCache.delete(mediaKey);
								console.warn('CleverImage: cache check failed', fileCheckError);
								await appStorage.removeMedia(mediaKey).catch(() => { });
							}
						}
					}

					if (isCancelled) return;

					if (debugDownload) logger.ui("CleverImage", `🌐 Using NETWORK: ${source}`);
					setIsLoadingFromNetwork(false);

					appStorage.saveMedia(source, mediaKey).then((savedPath) => {
						if (isCancelled || !savedPath || savedPath === source) return;
						if (sessionMediaCache.size < SESSION_CACHE_MAX) {
							sessionMediaCache.set(mediaKey, savedPath);
						}
						if (debugDownload) logger.ui("CleverImage", `💾 Saved to cache: ${savedPath}`);
					}).catch(err => {
						if (!isCancelled) {
							logger.error('CleverImage: error saving to cache', err);
						}
					});
				} catch (error) {
					if (!isCancelled) {
						logger.error('CleverImage: load error', error);
						setCachedSource({ uri: source });
						setIsLoadingFromNetwork(false);
					}
				}
			};

			loadCachedImage();

			return () => { isCancelled = true; };
		} else {
			setCachedSource(source);
			setIsLoadingFromNetwork(false);
		}

		return () => { isCancelled = true; };
	}, [source]);

	const handleImageLoad = () => {
		setImageLoaded(true);
		setIsLoadingFromNetwork(false);
		opacity.value = withTiming(imgOpacity, { duration: 300 });
		if (onImageLoad) {
			onImageLoad();
		}
	};

	const getImageSource = () => {
		if (isLoadingFromNetwork && !imageLoaded) {
			if (type === "user") return defaultLogoImport;
			if (type === "banner") return defaultBannerImport;
			return null;
		}

		if (type === "user") {
			if (!cachedSource) return defaultLogoImport;
			return cachedSource;
		}
		if (type === "banner") {
			if (!cachedSource) return defaultBannerImport;
			return cachedSource;
		}
		return cachedSource || source;
	};

	const finalSource = getImageSource();

	let imageSource;
	if (typeof finalSource === 'string') {
		imageSource = { uri: finalSource };
	} else if (typeof finalSource === 'number') {
		imageSource = finalSource;
	} else {
		imageSource = finalSource;
	}

	const onImageError = (error: any) => {
		const currentUri = cachedSource && typeof cachedSource === 'object' && 'uri' in cachedSource
			? cachedSource.uri
			: null;

		logger.error('CleverImage', `❌ CleverImage error loading: ${{
			source,
			currentUri,
			error: error?.nativeEvent,
			retryCount
		}}`);

		if (retryCount === 0 && currentUri && currentUri.startsWith('file://') && originalSourceRef.current) {
			console.log('🔄 Cached file failed, falling back to network URL:', originalSourceRef.current);
			setRetryCount(1);
			setCachedSource({ uri: originalSourceRef.current });
			setImageError(false);
			setIsLoadingFromNetwork(true);
			setImageLoaded(false);
		}

		if (retryCount >= 1 || !originalSourceRef.current) {
			logger.error('CleverImage', '❌ All retry attempts failed, showing error');
			setImageError(true);
		}
	};

	if (imageError) {
		return (
			<View
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: currentTheme.btn_bg_300,
					justifyContent: 'center',
					alignItems: 'center'
				}}
			>
				<EyesAnimation
					style={{
						width: "100%",
						height: "100%",
						justifyContent: 'center',
						alignItems: 'center',
						paddingHorizontal: 10
					}}
					size={70}
					textSize={10}
					text='image_error'
				/>
			</View>
		);
	}

	if (intensity && imageSource) {
		return (
			<View style={[wrapperStyles, { flex: 1, width: "100%", overflow: "hidden" }]}>
				<Animated.Image
					source={imageSource}
					accessibilityLabel={alt}
					style={[
						styles.fullSizeAbsolute,
						{ opacity: imgOpacity, objectFit: "cover" },
						imageStyles,
						animatedImageStyle
					]}
					onError={onImageError}
					onLoad={handleImageLoad}
					resizeMode={effectiveResizeMode}
					{...props}
				/>
				<BlurView
					intensity={intensity}
					style={{ flex: 1, width: "100%", zIndex: 1, backgroundColor: "rgba(0, 0, 0, 0.8)" }}
				/>
			</View>
		);
	}

	if (isVideo && videoUri) {
		const posterSource = skipPoster ? undefined : (typeof source === 'string' ? { uri: source } : source);
		const videoOnError = skipPoster ? undefined : onImageError;

		if (withoutWrapper) {
			return (
				<>
					<TouchableOpacity
						style={[styles.fullSizeAbsolute, { zIndex: 1 }]}
						onPress={handleVideoPress}
						activeOpacity={1}
					>
						{posterSource && !isPlaying && (
							<Image
								source={posterSource}
								style={[styles.fullSizeAbsolute, styles.videoPoster, imageStyles]}
								resizeMode={effectiveResizeMode}
							/>
						)}
						<Video
							ref={videoRef}
							source={{ uri: videoUri }}
							style={[styles.fullSizeAbsolute, styles.video, imageStyles]}
							resizeMode={ResizeMode.COVER}
							shouldPlay={(isInView || autoPlay) && !isFullscreen}
							isLooping
							isMuted
							{...(posterSource ? { posterSource } : {})}
							onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
							{...(videoOnError ? { onError: videoOnError } : {})}
						/>
					</TouchableOpacity>
					{/* Fullscreen Modal */}
					<Modal
						visible={isFullscreen}
						animationType="slide"
						supportedOrientations={['portrait', 'landscape']}
						onRequestClose={handleCloseFullscreen}
					>
						<View style={styles.fullscreenContainer}>
							<TouchableOpacity
								style={styles.closeButton}
								onPress={handleCloseFullscreen}
							>
								<View style={styles.closeIcon} />
							</TouchableOpacity>

							<Video
								source={{ uri: videoUri }}
								style={styles.fullscreenVideo}
								resizeMode={ResizeMode.CONTAIN}
								shouldPlay={true}
								isLooping
								useNativeControls={false}
								onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
								{...(videoOnError ? { onError: videoOnError } : {})}
							/>

							{/* Custom Progress Bar */}
							<View style={styles.progressContainer}>
								<PanGestureHandler onGestureEvent={progressGestureHandler}>
									<Animated.View style={styles.progressBarContainer}>
										<View style={styles.progressBarBackground} />
										<Animated.View style={[styles.progressBarFill, progressBarStyle]} />
										<Animated.View
											style={[styles.progressHandle, progressHandleStyle]}
										/>
									</Animated.View>
								</PanGestureHandler>
							</View>
						</View>
					</Modal>
				</>
			);
		}

		return (
			<>
				<TouchableOpacity
					style={[styles.wrapper, wrapperStyles]}
					onPress={handleVideoPress}
					activeOpacity={0.8}
				>
					{posterSource && !isPlaying && (
						<Image
							source={posterSource}
							style={[styles.videoPoster, imageStyles]}
							resizeMode={effectiveResizeMode}
						/>
					)}
					<Video
						ref={videoRef}
						source={{ uri: videoUri }}
						style={[styles.video, imageStyles]}
						resizeMode={ResizeMode.COVER}
						shouldPlay={(isInView || autoPlay) && !isFullscreen}
						isLooping
						isMuted
						{...(posterSource ? { posterSource } : {})}
						onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
						{...(videoOnError ? { onError: videoOnError } : {})}
					/>
				</TouchableOpacity>

				{/* Fullscreen Modal */}
				<Modal
					visible={isFullscreen}
					animationType="slide"
					supportedOrientations={['portrait', 'landscape']}
					onRequestClose={handleCloseFullscreen}
				>
					<View style={styles.fullscreenContainer}>
						<TouchableOpacity
							style={styles.closeButton}
							onPress={handleCloseFullscreen}
						>
							<View style={styles.closeIcon} />
						</TouchableOpacity>

						<Video
							source={{ uri: videoUri }}
							style={styles.fullscreenVideo}
							resizeMode={ResizeMode.CONTAIN}
							shouldPlay={true}
							isLooping
							useNativeControls={false}
							onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
							{...(videoOnError ? { onError: videoOnError } : {})}
						/>

						{/* Custom Progress Bar */}
						<View style={styles.progressContainer}>
							<PanGestureHandler onGestureEvent={progressGestureHandler}>
								<Animated.View style={styles.progressBarContainer}>
									<View style={styles.progressBarBackground} />
									<Animated.View style={[styles.progressBarFill, progressBarStyle]} />
									<Animated.View
										style={[
											styles.progressHandle,
											{ transform: [{ translateX: progressX.value }] }
										]}
									/>
								</Animated.View>
							</PanGestureHandler>
						</View>
					</View>
				</Modal>
			</>
		);
	}

	if (withoutWrapper && imageSource && !isVideo) return (
		<>
			{isLoadingFromNetwork && type === "user" && (
				<View style={[styles.fullSizeAbsolute, { justifyContent: 'center', alignItems: 'center', backgroundColor: currentTheme.bg_200 }]}>
				</View>
			)}
			<Animated.Image
				source={imageSource}
				accessibilityLabel={alt}
				style={[
					styles.fullSizeAbsolute,
					{ opacity: imgOpacity },
					imageStyles,
					animatedImageStyle
				]}
				onError={onImageError}
				onLoad={handleImageLoad}
				resizeMode={effectiveResizeMode}
			/>
		</>
	);

	if (withBackgroundBlur) {
		return (
			<TouchableOpacity
				style={[styles.wrapper, wrapperStyles]}
				onPress={onPress}
				activeOpacity={onPress ? 0.8 : 1}
			>
				{!imageLoaded && (
					<SkeletonUi>
						<View
							style={{
								width: '100%',
								height: '100%',
								position: 'absolute',
								borderRadius: Number(placeholderStyles?.borderRadius) || 5,
								top: 0,
								left: 0,
								zIndex: 1,
								...placeholderStyles,
							}}
						/>
					</SkeletonUi>
				)}

				<ImageBackground
					source={imageSource}
					style={styles.backgroundImage}
					blurRadius={blurRadius}
					onError={onImageError}
				>
					<View style={styles.imageWrapper}>
						<Animated.Image
							source={imageSource}
							accessibilityLabel={alt}
							onError={onImageError}
							style={[
								styles.image,
								imageStyles,
								animatedImageStyle
							]}
							resizeMode={effectiveResizeMode}
							onLoad={handleImageLoad}
							{...props}
						/>
					</View>
				</ImageBackground>
			</TouchableOpacity>
		);
	}

	return (
		<TouchableOpacity
			style={[styles.wrapper, wrapperStyles]}
			onPress={onPress}
			activeOpacity={onPress ? 0.8 : 1}
		>
			{isLoadingFromNetwork && type === "user" && (
				<View
					style={{
						width: '100%',
						height: '100%',
						position: 'absolute',
						top: 0,
						left: 0,
						zIndex: 999,
						justifyContent: 'center',
						alignItems: 'center',
						backgroundColor: currentTheme.bg_200
					}}
				>
				</View>
			)}
			{!imageLoaded && !isLoadingFromNetwork && type !== "user" && (
				<SkeletonUi>
					<View
						style={{
							width: '100%',
							height: '100%',
							position: 'absolute',
							borderRadius: Number(placeholderStyles?.borderRadius) || 5,
							top: 0,
							left: 0,
							zIndex: 1,
							...placeholderStyles,
						}}
					/>
				</SkeletonUi>
			)}

			{blur && imageLoaded && (
				<View
					style={[
						styles.blurBackground,
						{
							backgroundColor: 'transparent',
						}
					]}
				>
					<Image
						source={imageSource}
						style={styles.blurredImage}
						blurRadius={blurRadius}
						onError={onImageError}
					/>
				</View>
			)}

			<Animated.Image
				source={imageSource}
				accessibilityLabel={alt}
				style={[
					styles.image,
					imageStyles,
					animatedImageStyle
				]}
				onError={onImageError}
				resizeMode={effectiveResizeMode}
				onLoad={handleImageLoad}
				{...props}
			/>
		</TouchableOpacity>
	);
});

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp'];

function hasVideoExtensionUrl(url: string): boolean {
	if (!url || typeof url !== 'string') return false;
	const s = url.split('#')[0].split('?')[0].toLowerCase();
	return VIDEO_EXTENSIONS.some(ext => s.endsWith(ext));
}

const hashString = (str: string): string => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(36);
};

/** In-memory session cache for getMedia — avoids repeated async storage reads when scrolling */
const sessionMediaCache = new Map<string, string>();
const SESSION_CACHE_MAX = 200;

const styles = StyleSheet.create({
	wrapper: {
		position: 'relative',
		overflow: 'hidden',
	},
	fullSizeAbsolute: {
		width: '100%',
		height: '100%',
		position: 'absolute',
		top: 0,
		left: 0,
	},
	skeletonContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 1,
	},
	blurBackground: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 0,
	},
	blurredImage: {
		width: '110%',
		height: '110%',
		position: 'absolute',
		top: '-5%',
		left: '-5%',
	},
	backgroundImage: {
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	imageWrapper: {
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		width: '100%',
		height: '100%',
		resizeMode: 'contain',
		position: 'relative',
		zIndex: 2,
	},
	video: {
		width: '100%',
		height: '100%',
	},
	videoPoster: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		zIndex: 1,
	},
	fullscreenContainer: {
		flex: 1,
		backgroundColor: 'black',
		justifyContent: 'center',
		alignItems: 'center',
	},
	closeButton: {
		position: 'absolute',
		top: 50,
		right: 20,
		width: 50,
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
	closeIcon: {
		width: 30,
		height: 30,
		borderRadius: 15,
		backgroundColor: 'white',
	},
	fullscreenVideo: {
		width: '100%',
		height: '100%',
	},
	progressContainer: {
		position: 'absolute',
		bottom: 20,
		left: 20,
		right: 20,
		zIndex: 10,
	},
	progressBarContainer: {
		height: 10,
		borderRadius: 5,
		backgroundColor: 'rgba(255, 255, 255, 0.3)',
		overflow: 'hidden',
	},
	progressBarBackground: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: 5,
	},
	progressBarFill: {
		position: 'absolute',
		top: 0,
		left: 0,
		bottom: 0,
		borderRadius: 5,
		backgroundColor: 'white',
	},
	progressHandle: {
		position: 'absolute',
		top: -5,
		bottom: -5,
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: 'white',
		zIndex: 1,
	},
});
