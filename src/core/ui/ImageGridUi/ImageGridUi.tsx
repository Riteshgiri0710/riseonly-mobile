import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { BlurView } from 'expo-blur';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CleverImage } from '../CleverImage/CleverImage';
import { LoaderUi } from '../LoaderUi/LoaderUi';

interface ImageItem {
	url: string;
	width?: number;
	height?: number;
	media_type?: string;
	file_url?: string;
	thumbnail_url?: string | null;
	server_thumbnail_url?: string | null;
	duration?: number;
	isUploading?: boolean;
	isCompressing?: boolean;
	/** 0–100 */
	uploadProgress?: number;
	uploadedBytes?: number;
	totalBytes?: number;
	currentStage?: string;
	compressionProgress?: number;
	uploadId?: string;
	/** Video без локального превью — не грузить Image, показывать View+loader */
	isVideoPlaceholder?: boolean;
}

export type ImageGridGapMode = 'none' | 'full';

interface ImageGridUiProps {
	images: ImageItem[];
	maxWidth?: number;
	maxHeight?: number;
	minWidth?: number;
	spacing?: number;
	paddingHorizontal?: number;
	gapMode?: ImageGridGapMode;
	onImagePress?: (index: number) => void;
	onCancelUpload?: (uploadId: string) => void;
}

interface LayoutItem {
	cellX: number;
	cellY: number;
	cellWidth: number;
	cellHeight: number;
	imageX: number;
	imageY: number;
	imageWidth: number;
	imageHeight: number;
	url: string;
	media_type?: string;
	file_url?: string;
	thumbnail_url?: string | null;
	server_thumbnail_url?: string | null;
	duration?: number;
	isUploading?: boolean;
	isCompressing?: boolean;
	uploadProgress?: number;
	uploadedBytes?: number;
	totalBytes?: number;
	currentStage?: string;
	compressionProgress?: number;
	uploadId?: string;
	isVideoPlaceholder?: boolean;
}

type LayoutRow = { cellY: number; cellHeight: number; cells: LayoutItem[]; };

type LayoutResult = {
	layout: LayoutItem[];
	layoutRows: LayoutRow[];
	containerWidth: number;
	containerHeight: number;
	scale: number;
	offsetX: number;
	isSingleImage: boolean;
	effectiveMaxWidth: number;
	imagesLength: number;
	scaledGap: number;
};

const formatBytes = (bytes: number): string => {
	if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${bytes} B`;
};

const formatDuration = (totalSeconds?: number, remaining?: number): string => {
	if (remaining !== undefined) {
		const mins = Math.floor(remaining / 60);
		const secs = Math.floor(remaining % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
	if (!totalSeconds) return '0:00';
	const mins = Math.floor(totalSeconds / 60);
	const secs = Math.floor(totalSeconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const BLUR_MIN = 2;
const SINGLE_IMAGE_MAX_WIDTH = 280;
const BUBBLE_MIN_WIDTH = 120;
const FULL_GAP_SIZE = 1;

const calculateAspectRatio = (width?: number, height?: number): number => {
	if (!width || !height) return 1;
	return width / height;
};

/**
 * Generic image grid layout. Works for any number of items.
 */
const calculateUniversalLayout = (
	images: ImageItem[],
	maxWidth: number,
	maxHeight: number,
	minWidth: number,
	spacing: number,
	bubbleMaxWidth: number
): LayoutItem[] => {
	if (images.length === 0) return [];

	if (images.length === 1) {
		const image = images[0];
		const aspectRatio = calculateAspectRatio(image.width, image.height);
		const effectiveMaxWidth = Math.min(SINGLE_IMAGE_MAX_WIDTH, maxWidth, bubbleMaxWidth);

		let imageWidth = Math.max(minWidth, effectiveMaxWidth);
		let imageHeight = imageWidth / aspectRatio;

		if (imageHeight > maxHeight) {
			imageHeight = maxHeight;
			imageWidth = imageHeight * aspectRatio;
			imageWidth = Math.min(imageWidth, effectiveMaxWidth);
		}

		const cellWidth = effectiveMaxWidth;
		const cellHeight = imageHeight;

		const imageX = (cellWidth - imageWidth) / 2;
		const imageY = 0;

		return [{
			cellX: 0,
			cellY: 0,
			cellWidth,
			cellHeight,
			imageX,
			imageY,
			imageWidth,
			imageHeight,
			url: image.url,
			media_type: image.media_type,
			file_url: image.file_url,
			thumbnail_url: image.thumbnail_url,
			server_thumbnail_url: image.server_thumbnail_url,
			duration: image.duration,
			isUploading: image.isUploading,
			isCompressing: image.isCompressing,
			uploadProgress: image.uploadProgress,
			uploadedBytes: image.uploadedBytes,
			totalBytes: image.totalBytes,
			currentStage: image.currentStage,
			compressionProgress: image.compressionProgress,
			uploadId: image.uploadId,
			isVideoPlaceholder: image.isVideoPlaceholder,
		}];
	}

	const layout: LayoutItem[] = [];
	const rows: ImageItem[][] = [];
	let currentRow: ImageItem[] = [];
	let currentRowAspectRatios: number[] = [];
	let currentY = 0;

	for (let i = 0; i < images.length; i++) {
		const image = images[i];
		const aspectRatio = calculateAspectRatio(image.width, image.height);

		currentRow.push(image);
		currentRowAspectRatios.push(aspectRatio);

		const totalAspectRatio = currentRowAspectRatios.reduce((sum, ar) => sum + ar, 0);
		const rowHeight = (maxWidth - (currentRow.length - 1) * spacing) / totalAspectRatio;

		if (rowHeight <= maxHeight || currentRow.length >= 3 || i === images.length - 1) {
			const finalRowHeight = Math.min(maxHeight, rowHeight);
			const isSingleCellRow = currentRow.length === 1;

			let currentX = 0;
			let actualRowHeight = finalRowHeight;
			for (let j = 0; j < currentRow.length; j++) {
				const itemAspectRatio = currentRowAspectRatios[j];
				let cellWidth: number;
				let cellHeight: number;
				if (isSingleCellRow) {
					cellWidth = maxWidth;
					cellHeight = Math.min(maxWidth / itemAspectRatio, maxHeight);
					actualRowHeight = cellHeight;
				} else {
					cellWidth = finalRowHeight * itemAspectRatio;
					cellHeight = finalRowHeight;
				}

				const imageAspectRatio = calculateAspectRatio(currentRow[j].width, currentRow[j].height);

				let imageWidth = cellWidth;
				let imageHeight = cellHeight;

				if (imageAspectRatio > cellWidth / cellHeight) {
					imageWidth = cellWidth;
					imageHeight = cellWidth / imageAspectRatio;
				} else {
					imageHeight = cellHeight;
					imageWidth = cellHeight * imageAspectRatio;
				}

				const imageX = (cellWidth - imageWidth) / 2;
				const imageY = (cellHeight - imageHeight) / 2;

				layout.push({
					cellX: currentX,
					cellY: currentY,
					cellWidth,
					cellHeight,
					imageX: currentX + imageX,
					imageY: currentY + imageY,
					imageWidth,
					imageHeight,
					url: currentRow[j].url,
					media_type: currentRow[j].media_type,
					file_url: currentRow[j].file_url,
					thumbnail_url: currentRow[j].thumbnail_url,
					server_thumbnail_url: currentRow[j].server_thumbnail_url,
					duration: currentRow[j].duration,
					isUploading: currentRow[j].isUploading,
					isCompressing: currentRow[j].isCompressing,
					uploadProgress: currentRow[j].uploadProgress,
					uploadedBytes: currentRow[j].uploadedBytes,
					totalBytes: currentRow[j].totalBytes,
					currentStage: currentRow[j].currentStage,
					compressionProgress: currentRow[j].compressionProgress,
					uploadId: currentRow[j].uploadId,
					isVideoPlaceholder: currentRow[j].isVideoPlaceholder,
				});

				currentX += cellWidth + spacing;
			}

			currentY += actualRowHeight + spacing;
			currentRow = [];
			currentRowAspectRatios = [];
		}
	}

	return layout;
};

import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { logger } from '@lib/helpers';
import { formatDiffData } from '@lib/text';

const PRIORITY_LOAD_DELAY_MS = 40;

interface ImageGridCellProps {
	item: LayoutItem;
	index: number;
	scale: number;
	offsetX: number;
	isSingleImage: boolean;
	imagesLength: number;
	useFlexLayout?: boolean;
	scaledGap?: number;
	loadDelayMs?: number;
	onImagePress?: (index: number) => void;
	onCancelUpload?: (uploadId: string) => void;
	t: TFunction;
}

const ImageGridCell = memo(({
	item,
	index,
	scale,
	offsetX,
	isSingleImage,
	imagesLength,
	useFlexLayout = false,
	scaledGap = 0,
	loadDelayMs = 0,
	onImagePress,
	onCancelUpload,
	t,
}: ImageGridCellProps) => {
	const [shouldLoad, setShouldLoad] = useState(loadDelayMs === 0 || !!item.uploadId);
	const [remainingSeconds, setRemainingSeconds] = useState<number | undefined>(() =>
		item.duration ? Math.floor(item.duration) : undefined
	);
	const [videoLoaded, setVideoLoaded] = useState(false);
	const videoRef = useRef<Video>(null);

	useEffect(() => {
		if (shouldLoad || (loadDelayMs <= 0) || item.uploadId) return;
		const tId = setTimeout(() => setShouldLoad(true), loadDelayMs);
		return () => clearTimeout(tId);
	}, [loadDelayMs, item.uploadId, shouldLoad]);

	const isVideo = item.media_type === 'video' || item.media_type === 'animation';
	let videoUrl = item.file_url || item.url;
	if (item.uploadId && typeof videoUrl === 'string' && videoUrl.startsWith('file://')) {
		const cleaned = videoUrl.split('#')[0].split('?')[0];
		if (cleaned !== videoUrl) {
			console.log(`[ImageGridCell] Cleaned video URL for ${item.uploadId}:`, { original: videoUrl, cleaned });
			videoUrl = cleaned;
		}
	}
	// Сначала пробуем локальный thumbnail (для темповых сообщений), затем серверный thumbnail, затем сам видео URL
	const primaryThumb = item.thumbnail_url || item.server_thumbnail_url || null;
	const hasThumbnail = !!(primaryThumb &&
		typeof primaryThumb === 'string' &&
		primaryThumb.startsWith('file://') &&
		!primaryThumb.includes('#') &&
		primaryThumb !== videoUrl);
	const thumbnailUrl = hasThumbnail ? primaryThumb : (item.server_thumbnail_url || videoUrl || item.url);

	useEffect(() => {
		if (isVideo && item.uploadId && videoUrl) {
			setVideoLoaded(false);
			console.log(`[ImageGridCell] Video URL changed for ${item.uploadId}, resetting load state:`, videoUrl);
		}
	}, [isVideo, item.uploadId, videoUrl]);

	useEffect(() => {
		if (isVideo && item.uploadId) {
			console.log(`[ImageGridCell] Video with uploadId ${item.uploadId}:`, {
				file_url: item.file_url,
				url: item.url,
				thumbnail_url: item.thumbnail_url,
				videoUrl,
				thumbnailUrl,
				hasThumbnail,
				isUploading: item.isUploading,
				isCompressing: item.isCompressing,
				hasVideoUrl: !!videoUrl,
				hasThumbnailUrl: !!thumbnailUrl,
			});
			if (!videoUrl || !videoUrl.startsWith('file://')) {
				console.warn(`[ImageGridCell] Invalid video URL for ${item.uploadId}:`, videoUrl);
			}
		}
	}, [isVideo, item.uploadId, item.file_url, item.url, item.thumbnail_url, videoUrl, thumbnailUrl, hasThumbnail, item.isUploading, item.isCompressing]);

	const scaledCellX = Math.round(item.cellX * scale + offsetX);
	const scaledCellY = Math.round(item.cellY * scale);
	const scaledCellWidth = Math.round(item.cellWidth * scale);
	const scaledCellHeight = Math.round(item.cellHeight * scale);
	const scaledImageWidth = Math.round(item.imageWidth * scale);
	const scaledImageHeight = Math.round(item.imageHeight * scale);

	const imageOffsetX = Math.round((item.imageX - item.cellX) * scale);
	const imageOffsetY = Math.round((item.imageY - item.cellY) * scale);

	const needsBlur = scaledImageWidth < scaledCellWidth || scaledImageHeight < scaledCellHeight;
	const blurLeft = Math.max(0, imageOffsetX);
	const blurRight = Math.max(0, scaledCellWidth - (imageOffsetX + scaledImageWidth));
	const blurTop = Math.max(0, imageOffsetY);
	const blurBottom = Math.max(0, scaledCellHeight - (imageOffsetY + scaledImageHeight));

	const hasBlurArea = blurLeft >= BLUR_MIN || blurRight >= BLUR_MIN || blurTop >= BLUR_MIN || blurBottom >= BLUR_MIN;

	const onPress = useCallback(() => {
		onImagePress?.(index);
	}, [index, onImagePress]);

	const onCancel = useCallback(() => {
		if (item.uploadId) onCancelUpload?.(item.uploadId);
	}, [item.uploadId, onCancelUpload]);

	const onRemainingTimeUpdate = useCallback((seconds: number) => {
		setRemainingSeconds(seconds);
	}, []);

	const handleTempVideoStatusUpdate = (status: any) => {
		if (!status || !status.isLoaded) return;

		if (status.durationMillis != null) {
			const remainingMillis = status.durationMillis - (status.positionMillis ?? 0);
			const remainingSeconds = Math.max(0, Math.floor(remainingMillis / 1000));
			setRemainingSeconds(remainingSeconds);
		}
	};

	const progress = Math.min(1, Math.max(0, item.isCompressing
		? (item?.compressionProgress ?? 0) / 100
		: (item?.uploadProgress ?? 0) / 100));

	const uploadStatusText = item.isCompressing
		? `${t("processing")}${typeof item.compressionProgress === 'number' ? ` ${Math.round(item.compressionProgress)}%` : '...'}`
		: (item.uploadedBytes != null && item.totalBytes != null && item.totalBytes > 0)
			? `${formatBytes(item.uploadedBytes)} / ${formatBytes(item.totalBytes)}`
			: `${t("loading")}...`;

	const cellStyle = useMemo(() => {
		const size = { width: scaledCellWidth, height: scaledCellHeight };
		if (useFlexLayout) {
			return [styles.cellWrapper, styles.cellFlex, size];
		}
		return [
			styles.cellWrapper,
			{
				position: 'absolute' as const,
				left: scaledCellX,
				top: scaledCellY,
				...size,
				zIndex: -1,
			},
		];
	}, [useFlexLayout, scaledCellX, scaledCellY, scaledCellWidth, scaledCellHeight]);

	const imageContainerStyle = useMemo(() => [
		styles.imageContainer,
		{
			position: 'absolute' as const,
			left: imageOffsetX,
			top: imageOffsetY,
			width: scaledImageWidth,
			height: scaledImageHeight,
			zIndex: 3,
		},
	], [imageOffsetX, imageOffsetY, scaledImageWidth, scaledImageHeight]);

	const isSingleVideo = imagesLength === 1 && isVideo;

	const blurBackgroundSource = isVideo && item.uploadId
		? (hasThumbnail && thumbnailUrl ? thumbnailUrl : videoUrl)
		: (item.uploadId ? item.url : thumbnailUrl);

	return (
		<View style={cellStyle}>
			{needsBlur && hasBlurArea && !isVideo && (
				<>
					<View style={[StyleSheet.absoluteFill, { zIndex: 0 }]}>
						{item.uploadId ? (
							<Image
								source={{ uri: typeof blurBackgroundSource === 'string' && blurBackgroundSource.startsWith('file://') && blurBackgroundSource.includes('#') ? blurBackgroundSource.split('#')[0].split('?')[0] : blurBackgroundSource }}
								style={imageStylesFull}
								resizeMode="cover"
							/>
						) : (
							<CleverImage
								source={blurBackgroundSource}
								imageStyles={imageStylesFull}
								withoutWrapper
								resizeMode="cover"
							/>
						)}
					</View>
					{blurLeft >= BLUR_MIN && (
						<BlurView intensity={50} tint="dark" style={[styles.blurOverlay, { left: 0, width: blurLeft, height: '100%', zIndex: 2 }]} />
					)}
					{blurRight >= BLUR_MIN && (
						<BlurView intensity={50} tint="dark" style={[styles.blurOverlay, { right: 0, width: blurRight, height: '100%', zIndex: 2 }]} />
					)}
					{blurTop >= BLUR_MIN && (
						<BlurView intensity={50} tint="dark" style={[styles.blurOverlay, { top: 0, height: blurTop, width: '100%', zIndex: 2 }]} />
					)}
					{blurBottom >= BLUR_MIN && (
						<BlurView intensity={50} tint="dark" style={[styles.blurOverlay, { bottom: 0, height: blurBottom, width: '100%', zIndex: 2 }]} />
					)}
				</>
			)}
			<Pressable style={imageContainerStyle} onPress={onPress}>
				{!shouldLoad ? (
					<View style={[StyleSheet.absoluteFill, styles.imagePlaceholder]} />
				) : isVideo && item.uploadId ? (
					<>
						<View style={StyleSheet.absoluteFill}>
							{hasThumbnail && thumbnailUrl && thumbnailUrl.startsWith('file://') && (
								<Image
									source={{ uri: thumbnailUrl }}
									style={[StyleSheet.absoluteFill, { opacity: videoLoaded ? 0 : 1 }]}
									resizeMode="cover"
								/>
							)}
							{videoUrl && videoUrl.startsWith('file://') ? (
								<Video
									ref={videoRef}
									source={{ uri: videoUrl }}
									style={[StyleSheet.absoluteFill, { opacity: videoLoaded || !hasThumbnail ? 1 : 0 }]}
									resizeMode={ResizeMode.COVER}
									shouldPlay={isSingleVideo && (videoLoaded || !hasThumbnail)}
									isLooping
									isMuted
									usePoster={false}
									onPlaybackStatusUpdate={handleTempVideoStatusUpdate}
									onError={(error) => {
										console.error(`[ImageGridCell] ❌ Video error for ${item.uploadId}:`, error);
										setVideoLoaded(false);
									}}
									onLoad={() => {
										console.log(`[ImageGridCell] ✅ Video loaded successfully for ${item.uploadId}: ${videoUrl}`);
										setVideoLoaded(true);
									}}
									onLoadStart={() => {
										console.log(`[ImageGridCell] 🟡 Video load started for ${item.uploadId}: ${videoUrl}`);
									}}
									onReadyForDisplay={() => {
										console.log(`[ImageGridCell] ✅ Video ready for display for ${item.uploadId}`);
										setVideoLoaded(true);
									}}
								/>
							) : (
								<View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
									<Text style={{ color: '#fff' }}>Loading video...</Text>
								</View>
							)}
						</View>
						<View style={styles.videoDurationBadge} pointerEvents="none">
							<Text style={styles.videoDurationText}>
								{formatDuration(item.duration, remainingSeconds)}
							</Text>
						</View>
						{!isSingleVideo && (
							<View style={styles.playButtonOverlay} pointerEvents="none">
								<View style={imagesLength > 1 ? styles.playButtonSmall : styles.playButton}>
									<View style={imagesLength > 1 ? styles.playIconSmall : styles.playIcon} />
								</View>
							</View>
						)}
					</>
				) : isVideo ? (
					<>
						<CleverImage
							source={thumbnailUrl}
							imageStyles={imageStylesFull}
							withoutWrapper
							resizeMode="cover"
							isVideo
							videoUri={videoUrl}
							isInView={isSingleVideo}
							autoPlay={isSingleVideo}
							onRemainingTimeUpdate={onRemainingTimeUpdate}
						/>
						<View style={styles.videoDurationBadge} pointerEvents="none">
							<Text style={styles.videoDurationText}>
								{formatDuration(item.duration, remainingSeconds)}
							</Text>
						</View>
						{!isSingleVideo && (
							<View style={styles.playButtonOverlay} pointerEvents="none">
								<View style={imagesLength > 1 ? styles.playButtonSmall : styles.playButton}>
									<View style={imagesLength > 1 ? styles.playIconSmall : styles.playIcon} />
								</View>
							</View>
						)}
					</>
				) : item.uploadId ? (
					<Image
						source={{ uri: typeof item.url === 'string' && item.url.startsWith('file://') && item.url.includes('#') ? item.url.split('#')[0].split('?')[0] : item.url }}
						style={imageStylesFull}
						resizeMode="cover"
					/>
				) : (
					<CleverImage
						source={item.url}
						imageStyles={imageStylesFull}
						withoutWrapper
						resizeMode="cover"
					/>
				)}
				{(item.isUploading || item.isCompressing) && (
					<View style={styles.uploadLoaderOverlay} pointerEvents="box-none">
						{onCancelUpload && item.uploadId ? (
							<Pressable style={styles.uploadOverlayPressable} onPress={onCancel}>
								<View style={styles.uploadStatusTopLeft}>
									<Text style={styles.uploadStatusText} numberOfLines={1}>{uploadStatusText}</Text>
								</View>
								<View style={styles.uploadLoaderCenter}>
									<LoaderUi type="progress" progress={progress} size={40} />
									<View style={styles.uploadCancelIcon}>
										<MaterialCommunityIcons name="close" size={20} color="#fff" />
									</View>
								</View>
							</Pressable>
						) : (
							<>
								<View style={styles.uploadStatusTopLeft}>
									<Text style={styles.uploadStatusText} numberOfLines={1}>{uploadStatusText}</Text>
									{!item.isCompressing && (
										<Text style={styles.uploadProgressText}>{Math.round(item?.uploadProgress ?? 0)}%</Text>
									)}
								</View>
								<LoaderUi type="progress" progress={progress} size={40} />
							</>
						)}
					</View>
				)}
			</Pressable>
		</View>
	);
});

ImageGridCell.displayName = 'ImageGridCell';

const imageStylesFull = { width: '100%' as const, height: '100%' as const };

export const ImageGridUi = observer(({
	images,
	maxWidth: maxWidthProp,
	maxHeight: maxHeightProp,
	minWidth = BUBBLE_MIN_WIDTH,
	spacing: spacingProp,
	paddingHorizontal = 0,
	gapMode = 'none',
	onImagePress,
	onCancelUpload,
}: ImageGridUiProps) => {
	const { t } = useTranslation();
	const { width: screenWidth } = useWindowDimensions();

	const bubbleMaxWidth = screenWidth * 0.75;
	const bubbleMaxHeight = screenWidth * 0.6;
	const maxWidth = maxWidthProp ?? bubbleMaxWidth;
	const maxHeight = maxHeightProp ?? bubbleMaxHeight;

	const spacing = spacingProp ?? (gapMode === 'full' ? FULL_GAP_SIZE : 0);
	const useFullGap = gapMode === 'full';

	const availableWidth = maxWidth - (paddingHorizontal * 2);

	const { layout, layoutRows, containerWidth, containerHeight, scale, offsetX, isSingleImage, effectiveMaxWidth, imagesLength, scaledGap } = useMemo((): LayoutResult => {
		const layout = calculateUniversalLayout(images, availableWidth, maxHeight, minWidth, spacing, bubbleMaxWidth);
		if (layout.length === 0) {
			return {
				layout: [],
				layoutRows: [],
				containerWidth: 0,
				containerHeight: 0,
				scale: 1,
				offsetX: 0,
				isSingleImage: false,
				effectiveMaxWidth: availableWidth,
				imagesLength: images.length,
				scaledGap: 0,
			};
		}
		const isSingleImage = images.length === 1;
		const effectiveMaxWidth = isSingleImage ? Math.min(SINGLE_IMAGE_MAX_WIDTH, availableWidth, bubbleMaxWidth) : availableWidth;
		const totalLayoutWidth = Math.max(...layout.map(l => l.cellX + l.cellWidth));
		const totalLayoutHeight = Math.max(...layout.map(l => l.cellY + l.cellHeight));
		let scale = 1;
		let offsetX = 0;
		if (totalLayoutWidth > effectiveMaxWidth) {
			scale = effectiveMaxWidth / totalLayoutWidth;
		} else if (totalLayoutWidth < effectiveMaxWidth && !isSingleImage) {
			offsetX = (effectiveMaxWidth - totalLayoutWidth) / 2;
		}
		const containerWidth = isSingleImage ? Math.min(totalLayoutWidth, effectiveMaxWidth) : effectiveMaxWidth;
		const containerHeight = totalLayoutHeight * scale;
		const scaledGap = Math.round(spacing * scale);

		const byRow = new Map<number, LayoutItem[]>();
		for (const item of layout) {
			const row = byRow.get(item.cellY) ?? [];
			row.push(item);
			byRow.set(item.cellY, row);
		}
		const layoutRows: LayoutRow[] = Array.from(byRow.entries())
			.sort((a, b) => a[0] - b[0])
			.map(([cellY, cells]) => ({ cellY, cellHeight: cells[0].cellHeight, cells }));

		return { layout, layoutRows, containerWidth, containerHeight, scale, offsetX, isSingleImage, effectiveMaxWidth, imagesLength: images.length, scaledGap };
	}, [images, availableWidth, maxHeight, minWidth, spacing, bubbleMaxWidth]);

	if (layout.length === 0) return null;

	const containerStyle = useMemo(() => [
		styles.container,
		{ width: containerWidth, height: containerHeight },
		useFullGap && {
			borderWidth: FULL_GAP_SIZE,
			borderColor: 'rgba(0, 0, 0, 0.12)',
		},
	].filter(Boolean), [containerWidth, containerHeight, useFullGap]);

	const columnInnerStyle = useMemo(
		() => (offsetX > 0 ? [styles.columnInner, { paddingHorizontal: offsetX }] : [styles.columnInner]),
		[offsetX]
	);

	const useRowLayout = !isSingleImage && spacing > 0 && layoutRows.length > 0;

	if (useRowLayout) {
		let layoutIndex = 0;
		return (
			<View style={[containerStyle, styles.column]}>
				<View style={columnInnerStyle}>
					{layoutRows.map((row: LayoutRow, rowIndex: number) => (
						<View
							key={row.cellY}
							style={[
								styles.row,
								{
									height: Math.round(row.cellHeight * scale),
									gap: scaledGap,
									marginTop: rowIndex > 0 ? scaledGap : 0,
								},
							]}
						>
							{row.cells.map((item: LayoutItem) => {
								const cellIndex = layoutIndex++;
								return (
									<ImageGridCell
										key={`${item.uploadId ?? item.url ?? 'cell'}-${cellIndex}`}
										item={item}
										index={cellIndex}
										scale={scale}
										offsetX={0}
										isSingleImage={isSingleImage}
										imagesLength={imagesLength}
										useFlexLayout
										scaledGap={scaledGap}
										loadDelayMs={cellIndex * PRIORITY_LOAD_DELAY_MS}
										onImagePress={onImagePress}
										onCancelUpload={onCancelUpload}
										t={t}
									/>
								);
							})}
						</View>
					))}
				</View>
			</View>
		);
	}

	return (
		<View style={containerStyle}>
			{layout.map((item: LayoutItem, index: number) => (
				<ImageGridCell
					key={`${item.uploadId ?? item.url ?? 'cell'}-${index}`}
					item={item}
					index={index}
					scale={scale}
					offsetX={offsetX}
					isSingleImage={isSingleImage}
					imagesLength={imagesLength}
					loadDelayMs={index * PRIORITY_LOAD_DELAY_MS}
					onImagePress={onImagePress}
					onCancelUpload={onCancelUpload}
					t={t}
				/>
			))}
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		position: 'relative',
		overflow: 'hidden',
	},
	column: {
		flexDirection: 'column',
	},
	columnInner: {
		flexDirection: 'column',
		alignSelf: 'flex-start',
	},
	row: {
		flexDirection: 'row',
		flexWrap: 'nowrap',
	},
	imagePlaceholder: {
		backgroundColor: 'rgba(30,30,30,0.5)',
	},
	cellWrapper: {
		overflow: 'hidden',
	},
	cellFlex: {
		flex: 0,
		position: 'relative' as const,
		zIndex: -1,
	},
	imageContainer: {
		overflow: 'hidden',
	},
	blurOverlay: {
		position: 'absolute',
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
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	playIcon: {
		width: 0,
		height: 0,
		borderLeftWidth: 16,
		borderTopWidth: 10,
		borderBottomWidth: 10,
		borderLeftColor: 'white',
		borderTopColor: 'transparent',
		borderBottomColor: 'transparent',
		marginLeft: 4,
	},
	playButtonSmall: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	playIconSmall: {
		width: 0,
		height: 0,
		borderLeftWidth: 10,
		borderTopWidth: 6,
		borderBottomWidth: 6,
		borderLeftColor: 'white',
		borderTopColor: 'transparent',
		borderBottomColor: 'transparent',
		marginLeft: 3,
	},
	uploadLoaderOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
		zIndex: 10,
	},
	uploadOverlayPressable: {
		...StyleSheet.absoluteFillObject,
		justifyContent: 'center',
		alignItems: 'center',
	},
	uploadStatusTopLeft: {
		position: 'absolute',
		top: 8,
		left: 8,
		right: 8,
		maxHeight: 40,
		zIndex: 11,
	},
	uploadLoaderCenter: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	uploadCancelIcon: {
		position: 'absolute',
		justifyContent: 'center',
		alignItems: 'center',
	},
	uploadStatusText: {
		color: 'rgba(255, 255, 255, 0.95)',
		fontSize: 11,
		fontWeight: '600',
	},
	uploadProgressText: {
		color: 'rgba(255, 255, 255, 0.85)',
		fontSize: 11,
		marginTop: 2,
	},
});
