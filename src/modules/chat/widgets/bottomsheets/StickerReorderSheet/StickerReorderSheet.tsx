import { showNotify } from '@core/config/const';
import { BottomSheetUi, Box, CleverImage, MainText } from '@core/ui';
import { themeStore } from '@modules/theme/stores';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { stickerActionsStore } from 'src/modules/sticker/stores/sticker/sticker-action/sticker-actions';
import { stickerServiceStore } from 'src/modules/sticker/stores/sticker/sticker-service/sticker-service';
import { profileStore } from 'src/modules/user/stores/profile';
import type { PackRecord, StickerRecord, StickerInList } from '@modules/chat/widgets/ChatStickerWidget/types';
import { getStickerDisplayUrl, isLottieSticker } from '@modules/chat/widgets/ChatStickerWidget/utils';

export interface StickerReorderSheetProps {
	visible: boolean;
	onClose: () => void;
	pack: PackRecord | null;
	stickers: StickerRecord[];
}

export const StickerReorderSheet = observer(({ visible, onClose, pack, stickers }: StickerReorderSheetProps) => {
	const { applyPackStickersOrder } = stickerServiceStore;

	const { t } = useTranslation();
	const { currentTheme } = themeStore;
	const [reorderOrder, setReorderOrder] = useState<string[]>(() => stickers.map((s) => s.id));

	useEffect(() => {
		if (visible && stickers.length > 0) {
			setReorderOrder(stickers.map((s) => s.id));
		}
	}, [visible, stickers]);

	const reorderStickersList = useMemo(
		() => reorderOrder.map((id) => stickers.find((s) => s.id === id)).filter(Boolean) as StickerRecord[],
		[reorderOrder, stickers]
	);

	const handleDragEnd = useCallback(({ data }: { data: StickerRecord[]; }) => {
		setReorderOrder(data.map((s) => s.id));
	}, []);

	const handleSave = useCallback(() => {
		if (!pack || reorderOrder.length === 0) return;
		applyPackStickersOrder(pack.id, reorderOrder);
		showNotify('system', { message: t('saved') || 'Сохранено', position: 'bottom' });
		onClose();
	}, [pack, reorderOrder, t, onClose]);

	const renderRow = useCallback(
		({ item, drag, isActive }: { item: StickerRecord; drag: () => void; isActive: boolean; }) => {
			const displayUrl = getStickerDisplayUrl(item as StickerInList);
			const isLottie = displayUrl ? isLottieSticker(displayUrl) : false;
			return (
				<Pressable
					onLongPress={drag}
					delayLongPress={200}
					style={[
						styles.reorderRow, isActive && styles.reorderRowActive,
						{ borderBottomWidth: 0.7, borderColor: currentTheme.border_100 }
					]}
				>
					<View style={styles.reorderThumb}>
						{displayUrl ? (
							isLottie ? (
								<LottieView source={{ uri: displayUrl }} autoPlay loop style={styles.reorderThumbImg} />
							) : (
								<CleverImage
									source={{ uri: displayUrl }}
									imageStyles={[styles.reorderThumbImg, styles.reorderThumbRound]}
									resizeMode="contain"
								/>
							)
						) : null}
					</View>
					<MaterialIcons name="drag-indicator" size={24} color={currentTheme.text_100} style={styles.reorderDragIcon} />
				</Pressable>
			);
		},
		[currentTheme.text_100]
	);

	if (!visible) return null;

	return (
		<BottomSheetUi
			isBottomSheet={visible}
			setIsBottomSheet={(v) => !v && onClose()}
			snap={['60%']}
			bottomSheetBgColor={currentTheme.bg_200}
		>
			<View style={styles.content}>
				<Box
					centered
					style={{ paddingVertical: 5 }}
				>
					<MainText px={17} numberOfLines={1}>
						{t('sticker_reorder')}
					</MainText>
				</Box>

				<DraggableFlatList<StickerRecord>
					data={reorderStickersList}
					keyExtractor={(item) => item.id}
					renderItem={renderRow}
					onDragEnd={handleDragEnd}
					contentContainerStyle={[styles.listContent, { paddingBottom: 80 }]}
				/>

				<Box
					style={styles.saveBtnContainer}
				>
					<Pressable
						style={[styles.saveBtn, { backgroundColor: currentTheme.primary_100 }]}
						onPress={handleSave}
					>
						<MainText style={styles.saveBtnText}>{t('save')}</MainText>
					</Pressable>
				</Box>
			</View>
		</BottomSheetUi>
	);
});

const styles = StyleSheet.create({
	content: {
		flex: 1,
		minHeight: 0,
	},
	listContent: {
		paddingBottom: 24,
	},
	reorderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: "space-between",
		paddingVertical: 5,
		paddingHorizontal: 10,
	},
	reorderRowActive: {
		opacity: 0.9,
	},
	reorderThumb: {
		width: 45,
		height: 45,
		borderRadius: 8,
		overflow: 'hidden',
	},
	reorderThumbImg: {
		width: "100%",
		height: "100%",
	},
	reorderThumbRound: {
		borderRadius: 8,
	},
	reorderDragIcon: {
		marginLeft: 12,
	},
	saveBtnContainer: {
		position: 'absolute',
		bottom: -15,
		left: 0,
		right: 0,
		paddingHorizontal: 15,
	},
	saveBtn: {
		alignSelf: 'center',
		paddingVertical: 14,
		borderRadius: 12,
		width: "100%",
		alignItems: 'center',
		justifyContent: 'center',
	},
	saveBtnText: {
		fontSize: 16,
		fontWeight: '600',
	},
});
