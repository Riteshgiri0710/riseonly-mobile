import { CleverImage } from '@core/ui';
import { GetMessageMessage, MessageMediaItems } from '@modules/chat/stores/message';
import { stickerInteractionsStore } from '@modules/sticker/stores/sticker/sticker-interactions/sticker-interactions';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { isLottieSticker } from '@modules/chat/widgets/ChatStickerWidget/utils';

const STICKER_SIZE = 160;

interface StickerMessageProps {
	message: GetMessageMessage;
}

type StickerMediaItem = MessageMediaItems & {
	media_info?: { file_url?: string; pack_id?: string; };
	packId?: string;
	sticker_id?: string;
	associated_emojis?: string[];
};

function mediaItemToStickerRecord(item: StickerMediaItem, fileUrl: string, packId: string): { id: string; pack_id: string; file_url: string; width: number; height: number; position: number; created_at_ms: number; associated_emojis: string[]; } {
	return {
		id: item.sticker_id ?? (item as any).stickerId ?? fileUrl,
		pack_id: packId,
		file_url: fileUrl,
		width: item.width ?? 0,
		height: item.height ?? 0,
		position: 0,
		created_at_ms: 0,
		associated_emojis: item.associated_emojis ?? (item as any).associatedEmojis ?? [],
	};
}

export function StickerMessage({ message }: StickerMessageProps) {
	const { selectedSticker: { setSelectedSticker }, openStickerPackByPackId } = stickerInteractionsStore;

	const mediaItems = message?.media_items ?? [];
	const stickerItem = mediaItems.find((m) => m.media_type === 'sticker') ?? mediaItems[0] as StickerMediaItem | undefined;
	if (!stickerItem) return null;

	const item = stickerItem as StickerMediaItem;
	const fileUrl = item.file_url ?? item.media_info?.file_url ?? '';
	if (!fileUrl) return null;

	const packId = item.pack_id ?? item.packId ?? item.media_info?.pack_id ?? '';
	const isLottie = isLottieSticker(fileUrl);
	const handlePress = packId
		? () => {
			setSelectedSticker(mediaItemToStickerRecord(item, fileUrl, packId));
			openStickerPackByPackId(packId);
		}
		: undefined;

	return (
		<View style={styles.wrap}>
			<Pressable
				onPress={handlePress}
				style={({ pressed }) => [styles.pressable, pressed && styles.pressablePressed]}
			>
				<View style={[styles.stickerWrap, { width: STICKER_SIZE, height: STICKER_SIZE }]} pointerEvents="none">
					{isLottie ? (
						<LottieView
							source={{ uri: fileUrl }}
							autoPlay
							loop
							style={[styles.sticker, { width: STICKER_SIZE, height: STICKER_SIZE }]}
						/>
					) : (
						<CleverImage
							source={{ uri: fileUrl }}
							imageStyles={[styles.sticker, styles.stickerRound, { width: STICKER_SIZE, height: STICKER_SIZE }]}
							resizeMode="contain"
						/>
					)}
				</View>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 4,
	},
	pressable: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	pressablePressed: {
		opacity: 0.85,
	},
	stickerWrap: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	sticker: {},
	stickerRound: {
		borderRadius: 12,
	},
});
