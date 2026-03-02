import { AsyncDataRender, Box, MediaGridItem, MediaGridUi, useParentScroll } from '@core/ui';
import { messageActionsStore } from '@modules/chat/stores/message';
import { MediaItemResponse } from '@modules/chat/stores/message/message-actions/types';
import { mediaFullscreenInteractionsStore } from '@stores/media';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

const convertMediaItemsToGridItems = (mediaItems: MediaItemResponse[]): MediaGridItem[] => {
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

export const ChatProfileMediaTab = observer(() => {
	const useParent = useParentScroll();
	const {
		mediaMessages: { data, status }
	} = messageActionsStore;

	const { t } = useTranslation();

	const { urls, mediaTypes, items } = useMemo(() => {
		if (!data?.media_items || data.media_items.length === 0) {
			return { urls: [], mediaTypes: [], items: [] };
		}

		const allUrls: (string | number)[] = [];
		const allMediaTypes: ('image' | 'video')[] = [];
		const itemsWithIndex: Array<{ item: MediaItemResponse; index: number; }> = [];

		data.media_items.forEach((item) => {
			const isVideo = (item.content_type || '').toLowerCase() === 'video' ||
				(item.media_info?.media_type || '').toLowerCase() === 'video' ||
				(item.media_info?.mime_type || '').toLowerCase().startsWith('video/');

			const urlForGaleria = item.media_info.file_url;
			const displayUrl = isVideo && item.media_info.thumbnail_url
				? item.media_info.thumbnail_url
				: item.media_info.file_url;

			if (urlForGaleria && displayUrl) {
				itemsWithIndex.push({ item, index: allUrls.length });
				allUrls.push(urlForGaleria);
				allMediaTypes.push(isVideo ? 'video' : 'image');
			}
		});

		const result = { urls: allUrls, mediaTypes: allMediaTypes, items: itemsWithIndex };
		return result;
	}, [data?.media_items]);

	const handleItemPress = useCallback((index: number) => {
		const mediaItems = convertMediaItemsToGridItems(data?.media_items || []);
		mediaFullscreenInteractionsStore.open(mediaItems, index, false);
	}, [data?.media_items]);

	const content = (
		<AsyncDataRender
			status={status}
			data={data?.media_items}
			isEmptyScrollView={!useParent}
			noDataText={t("no_media_text")}
			renderContent={() => {
				return (
					<Box
						style={{ flexGrow: 1, minHeight: useParent ? undefined : 400 }}
						width="100%"
					>
						<MediaGridUi
							items={items}
							onItemPress={handleItemPress}
							numColumns={3}
							scrollEnabled={false}
							style={{ width: "100%", height: "100%" }}
						/>
					</Box>
				);
			}}
		/>
	);

	if (useParent) {
		return <View style={{ flexGrow: 1 }}>{content}</View>;
	}

	return content;
});

const styles = StyleSheet.create({
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
});