import { Box, ImageGridUi, MediaGridItem } from '@core/ui';
import { cancelUpload } from '@lib/mobx-toolbox/mobxSaiWs';
import { MESSAGE_MEDIA_MAX_WIDTH } from '@modules/chat/shared/config/const';
import { GetMessageMessage, messageActionsStore } from '@modules/chat/stores/message';
import { mediaFullscreenInteractionsStore } from '@stores/media';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';

interface MediaImagesProps {
	message: GetMessageMessage;
}

const VIDEO_UPLOAD_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp'];

function hasVideoExtension(media: any): boolean {
	const uri = media?.url || media?.file_url || media?.file?.uri || media?.file?.file?.uri || '';
	const s = String(uri).split('#')[0].split('?')[0].toLowerCase();
	return VIDEO_EXTENSIONS.some(ext => s.endsWith(ext));
}

const convertMediaItemsToGridItems = (mediaItems: any[]): MediaGridItem[] => {
	if (!mediaItems || mediaItems.length === 0) {
		return [];
	}

	return mediaItems
		.filter((item) => {
			const isVideo = (item.content_type || '').toLowerCase() === 'video' ||
				(item.media_info?.media_type || '').toLowerCase() === 'video' ||
				(item.media_info?.mime_type || '').toLowerCase().startsWith('video/');
			return item.media_info?.file_url && (isVideo ? item.media_info.thumbnail_url || item.media_info.file_url : item.media_info.file_url);
		})
		.map((item) => {
			const isVideo = (item.content_type || '').toLowerCase() === 'video' ||
				(item.media_info?.media_type || '').toLowerCase() === 'video' ||
				(item.media_info?.mime_type || '').toLowerCase().startsWith('video/');

			return {
				id: item.id || `${item.message_id}-${item.media_index}`,
				content_type: isVideo ? 'video' : 'image',
				media_info: {
					file_url: item.media_info.file_url!,
					thumbnail_url: item.media_info.thumbnail_url || undefined,
					media_type: isVideo ? 'video' : item.media_info.media_type || 'image',
					mime_type: item.media_info.mime_type || undefined,
					duration: item.media_info.duration || null,
				},
			};
		});
};

export const MediaImages = observer(({
	message,
}: MediaImagesProps) => {
	const { mediaMessages } = messageActionsStore;

	const isImage = message?.content_type === "image";
	const isVideo = message?.content_type === "video";

	const hasMediaItems = message?.media_items && message.media_items.length > 0;
	const hasFileStates = hasMediaItems && message.media_items!.some((item: any) => item.status);

	const filteredMedia = useMemo(
		() => (message?.media_items ?? []).filter((m: any) => !m.cancelled),
		[message?.media_items]
	);

	const progressSignature = filteredMedia
		.map((m: any) =>
			`${m.uploadProgress ?? 0}-${m.compressionProgress ?? 0}-${m.uploadedBytes ?? 0}-${m.totalBytes ?? 0}-${m.isUploading}-${m.isCompressing}-${m.currentStage ?? ""}-${(m as any).thumbnailGenerated ? 1 : 0}`
		)
		.join("|");

	const images = useMemo(() => filteredMedia.map((media: any) => {
		if (media.upload_id || media.isTemp) {
			const isVideo = media.media_type === 'video' || media.mime_type?.startsWith('video/') || hasVideoExtension(media);
			const uploadingOrCompressing = (media.isUploading || media.isCompressing) && isVideo;
			const fileUrl = media.file_url || '';
			const thumbnailUrl = media.thumbnail_url || '';
			const hasLocalThumb = !!(media.thumbnailGenerated &&
				thumbnailUrl &&
				String(thumbnailUrl).startsWith('file://') &&
				thumbnailUrl !== fileUrl &&
				!thumbnailUrl.includes('#'));
			const isVideoPlaceholder = isVideo && uploadingOrCompressing && !hasLocalThumb && !fileUrl;

			let file_url = media.file_url;
			if (isVideo && file_url && typeof file_url === 'string' && file_url.startsWith('file://')) {
				const cleaned = file_url.split('#')[0].split('?')[0];
				if (cleaned !== file_url) file_url = cleaned;
			}

			const url = uploadingOrCompressing
				? (hasLocalThumb ? media.thumbnail_url : (fileUrl || VIDEO_UPLOAD_PLACEHOLDER))
				: (media.url ?? '');
			const thumbnail_url = uploadingOrCompressing
				? (hasLocalThumb ? media.thumbnail_url : (fileUrl || VIDEO_UPLOAD_PLACEHOLDER))
				: (media.thumbnail_url ?? media.url ?? '');
			const media_type = isVideo ? 'video' : (uploadingOrCompressing ? 'image' : (media.media_type || 'image'));

			return {
				id: media.id || media.upload_id,
				url,
				width: media.width || (isVideo ? 16 : 0),
				height: media.height || (isVideo ? 9 : 0),
				media_type,
				file_url,
				thumbnail_url,
				server_thumbnail_url: (media as any).server_thumbnail_url || undefined,
				duration: media.duration,
				isUploading: media.isUploading,
				isCompressing: media.isCompressing,
				uploadProgress: media.uploadProgress ?? 0,
				uploadedBytes: media.uploadedBytes,
				totalBytes: media.totalBytes,
				currentStage: media.currentStage,
				compressionProgress: media.compressionProgress,
				uploadId: media.upload_id,
				isVideoPlaceholder,
			};
		}

		const isVideo = media.media_type === 'video' || media.mime_type?.startsWith('video/');
		// Если сервер не прислал thumbnail для видео, используем сам video url, чтобы RN мог отрисовать превью
		const videoUrl = media.file_url || media.url;
		const displayUrl = isVideo
			? (media.thumbnail_url || (media as any).server_thumbnail_url || videoUrl || VIDEO_UPLOAD_PLACEHOLDER)
			: media.file_url;

		return {
			id: media.id,
			url: displayUrl,
			width: media.width || 0,
			height: media.height || 0,
			media_type: isVideo ? 'video' : 'image',
			file_url: media.file_url || videoUrl,
			thumbnail_url: media.thumbnail_url || (media as any).server_thumbnail_url || displayUrl,
			duration: media.duration,
			isUploading: false,
			uploadProgress: 100,
		};
	}), [filteredMedia, progressSignature]);

	const mediaItems: MediaGridItem[] = useMemo(() => filteredMedia.map((media, index) => {
		const isVideoByType = media.media_type === 'video' || (media.media_type as string) === 'animation';
		const isVideoByMime = media.mime_type?.startsWith('video/') || false;
		const isVideo = isVideoByType || isVideoByMime;

		return {
			id: media.file_id || `media-${message.id}-${index}`,
			content_type: isVideo ? 'video' : 'image',
			media_info: {
				file_url: media.file_url!,
				thumbnail_url: media.thumbnail_url || undefined,
				media_type: isVideo ? 'video' : media.media_type || 'image',
				mime_type: media.mime_type || undefined,
				duration: media.duration || null,
			},
		};
	}), [filteredMedia, message.id]);

	const waitForMediaMessagesData = useCallback((): Promise<void> => {
		return new Promise((resolve) => {
			const check = () => {
				const items = messageActionsStore.mediaMessages.data?.media_items;
				return !!(items && items.length > 0);
			};
			if (check()) {
				resolve();
				return;
			}
			let settled = false;
			const done = () => {
				if (settled) return;
				settled = true;
				clearInterval(interval);
				clearTimeout(timeout);
				resolve();
			};
			const interval = setInterval(() => {
				if (check()) done();
			}, 50);
			const timeout = setTimeout(done, 3000);
		});
	}, []);

	const handleImagePress = useCallback(async (index: number) => {
		const { getMediaMessagesAction } = messageActionsStore;

		if (!mediaMessages.data?.media_items || mediaMessages.data.media_items.length === 0) {
			await getMediaMessagesAction();
			await waitForMediaMessagesData();
		}

		const selectedMedia = filteredMedia[index];
		if (!selectedMedia) {
			mediaFullscreenInteractionsStore.open(mediaItems, index, true);
			return;
		}

		const dataMediaItems = messageActionsStore.mediaMessages.data?.media_items;
		const currentMediaItems: MediaGridItem[] = dataMediaItems
			? convertMediaItemsToGridItems(dataMediaItems)
			: [];

		if (currentMediaItems.length > 0 && dataMediaItems) {
			let filteredIndex = 0;
			for (const item of dataMediaItems) {
				const isVideo = (item.content_type || '').toLowerCase() === 'video' ||
					(item.media_info?.media_type || '').toLowerCase() === 'video' ||
					(item.media_info?.mime_type || '').toLowerCase().startsWith('video/');
				const hasValidUrl = item.media_info?.file_url &&
					(isVideo ? item.media_info.thumbnail_url || item.media_info.file_url : item.media_info.file_url);

				if (hasValidUrl) {
					if (item.message_id === message.id &&
						item.media_info?.file_url === selectedMedia.file_url) {
						mediaFullscreenInteractionsStore.open(currentMediaItems, filteredIndex, true);
						return;
					}
					filteredIndex++;
				}
			}
		}

		mediaFullscreenInteractionsStore.open(mediaItems, index, true);
	}, [message, filteredMedia, mediaItems, mediaMessages.data?.media_items]);

	const onCancelUploadPress = useCallback((uploadId: string) => {
		cancelUpload(uploadId);
	}, []);

	if ((!isImage && !isVideo) && !hasFileStates) {
		return null;
	}
	if (!hasMediaItems) {
		return null;
	}

	return (
		<Box
			style={s.container}
		>
			<ImageGridUi
				images={images}
				maxWidth={MESSAGE_MEDIA_MAX_WIDTH}
				onImagePress={handleImagePress}
				onCancelUpload={onCancelUploadPress}
				gapMode="none"
				spacing={1}
			/>
		</Box>
	);
});

const s = StyleSheet.create({
	container: {
		overflow: 'hidden',
		width: "100%",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
	},
	imageGridWrapper: {
		position: 'relative',
		width: '100%',
	},
	loaderOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
		pointerEvents: 'none',
	},
	loaderContainer: {
		position: 'absolute',
		top: '50%',
		left: '50%',
		transform: [{ translateX: -25 }, { translateY: -25 }],
	},
});