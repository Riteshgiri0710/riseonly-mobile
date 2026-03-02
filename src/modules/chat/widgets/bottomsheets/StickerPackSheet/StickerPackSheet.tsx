import { showNotify, STICKER_LINK_PATTERN } from '@core/config/const';
import { AsyncDataRender, BottomSheetUi, ButtonUi, ContextMenuUi, ContextMenuItem, CleverImage, RenderFormattedText, SecondaryText, MainText } from '@core/ui';
import { themeStore } from '@modules/theme/stores';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { GestureDetector } from 'react-native-gesture-handler';
import { FlashList } from '@shopify/flash-list';
import { stickerActionsStore } from 'src/modules/sticker/stores/sticker/sticker-action/sticker-actions';
import { profileStore } from 'src/modules/user/stores/profile';
import type { PackRecord, StickerRecord, StickerInList } from '@modules/chat/widgets/ChatStickerWidget/types';
import { STICKERS_PER_ROW } from '@modules/chat/widgets/ChatStickerWidget/types';
import { StickerRow } from '@modules/chat/widgets/ChatStickerWidget/StickerRow';
import { StickerPreviewModal, type StickerPreviewModalHandle } from '@modules/chat/widgets/ChatStickerWidget/StickerPreviewModal';
import { useStickerPreviewGesture } from '@modules/chat/widgets/ChatStickerWidget/useStickerPreviewGesture';
import { getStickerCellSize } from '@modules/chat/widgets/ChatStickerWidget/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { stickerInteractionsStore } from '@modules/sticker/stores/sticker/sticker-interactions/sticker-interactions';

export interface StickerPackSheetProps {
	onSendSticker?: () => void;
	onSaveSuccess?: () => void;
	onRemoveSuccess?: () => void;
}

type RowItem = { type: 'sticker_row'; pack: PackRecord; stickers: StickerRecord[]; showPlus?: boolean; };

function buildRows(pack: PackRecord | null, stickers: StickerRecord[]): RowItem[] {
	if (!pack || !stickers.length) return [];
	const rows: RowItem[] = [];
	for (let i = 0; i < stickers.length; i += STICKERS_PER_ROW) {
		rows.push({
			type: 'sticker_row',
			pack,
			stickers: stickers.slice(i, i + STICKERS_PER_ROW),
		});
	}
	return rows;
}

export const StickerPackSheet = observer(({ onSendSticker, onSaveSuccess, onRemoveSuccess }: StickerPackSheetProps) => {
	const { currentTheme } = themeStore;
	const {
		removeSavedPackAction,
		removeStickerFromPackAction,
		savePackAction,
		getPackStickersAction,
		packStickersByPackId,
		stickersByPackLink,
		currentStickersByPackLinkKey,
		getStickersByPackLinkAction,
	} = stickerActionsStore;
	const {
		isStickerPackLinkSheetOpen,
		stickerPackLinkSheetPackLink,
		stickerPackSheetOpen,
		stickerPackSheetPack,
		stickerPackSheetStickers,
		stickerPackSheetPackId,
		closeStickerPackLinkSheet,
		closeStickerPackSheet,
	} = stickerInteractionsStore;

	const { width } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const cellSize = getStickerCellSize(width);
	const { t } = useTranslation();

	const isLinkSheet = isStickerPackLinkSheetOpen.isStickerPackLinkSheetOpen;
	const linkPackLink = stickerPackLinkSheetPackLink.stickerPackLinkSheetPackLink;
	const mainOpen = stickerPackSheetOpen.stickerPackSheetOpen;
	const visible = mainOpen || isLinkSheet;

	const linkRequest = isLinkSheet && linkPackLink && currentStickersByPackLinkKey === linkPackLink ? stickersByPackLink : null;
	const linkLoadStatus = linkRequest?.status ?? 'idle';
	const linkNotFoundMessage = linkRequest?.status === 'rejected' ? (t('sticker_pack_not_found') || 'Sticker pack not found') : undefined;

	const pack = isLinkSheet ? (linkRequest?.data?.pack ?? null) : stickerPackSheetPack.stickerPackSheetPack;
	const stickers = isLinkSheet ? (linkRequest?.data?.stickers ?? []) : stickerPackSheetStickers.stickerPackSheetStickers;
	const packId = isLinkSheet ? null : stickerPackSheetPackId.stickerPackSheetPackId;
	const onClose = isLinkSheet ? closeStickerPackLinkSheet : closeStickerPackSheet;

	const isFromLink = isLinkSheet;
	const fullData = packStickersByPackId?.data;
	const effectivePack = pack ?? fullData?.pack ?? null;
	const effectiveStickers = stickers.length > 0 ? stickers : (fullData?.stickers ?? []);

	const openByPackId = Boolean(packId && !pack);
	const showLinkPlaceholder = isFromLink && !pack;

	useEffect(() => {
		if (visible && packId) getPackStickersAction(packId);
	}, [visible, packId]);

	useEffect(() => {
		if (visible && isLinkSheet && linkPackLink) getStickersByPackLinkAction(linkPackLink);
	}, [visible, isLinkSheet, linkPackLink, getStickersByPackLinkAction]);

	const [contextMenuVisible, setContextMenuVisible] = useState(false);
	const [closeSignal, setCloseSignal] = useState(false);
	const menuButtonRef = useRef<View>(null);
	const stickerByIdRef = useRef(new Map<string, StickerInList>());

	useEffect(() => {
		if (!visible) setCloseSignal(false);
	}, [visible]);

	useEffect(() => {
		const map = new Map<string, StickerInList>();
		effectiveStickers.forEach((s) => map.set(s.id, s as StickerInList));
		stickerByIdRef.current = map;
	}, [effectiveStickers]);

	const previewModalRef = useRef<StickerPreviewModalHandle | null>(null);
	const closePreviewWithAnimation = useCallback(() => {
		previewModalRef.current?.animateAndClose?.();
	}, []);
	const {
		previewSticker,
		previewContextMenuVisible,
		hidePreview,
		composedGesture,
		onRegisterCellRef,
		onUnregisterCellRef,
	} = useStickerPreviewGesture(stickerByIdRef, { closeWithAnimation: closePreviewWithAnimation });

	const favourites = stickerActionsStore.getFavouritesRequest?.data?.stickers ?? [];
	const favouriteIds = useMemo(() => new Set(favourites.map((s) => s.id)), [favourites]);

	const handleRemoveFromPack = useCallback(
		() => {
			const s = stickerInteractionsStore.selectedSticker.selectedSticker;
			if (s) {
				removeStickerFromPackAction(s.pack_id, s.id);
				hidePreview();
			}
		},
		[hidePreview, removeStickerFromPackAction]
	);

	const packLink = effectivePack?.link ? (effectivePack.link.startsWith('http') ? effectivePack.link : `${STICKER_LINK_PATTERN}${effectivePack.link}`) : '';
	const packLinkSlug = effectivePack?.link?.startsWith('http') ? effectivePack.link.replace(STICKER_LINK_PATTERN, '').split(/[/?#]/)[0] : effectivePack?.link ?? '';

	const handleSavePack = useCallback(() => {
		if (!effectivePack?.id) return;
		savePackAction(effectivePack, {
			onSuccess: () => {
				onSaveSuccess?.();
				setCloseSignal(true);
			},
		});
	}, [effectivePack, packLinkSlug, onSaveSuccess]);

	const handleRemoveSavedPack = useCallback(() => {
		if (!effectivePack?.id) return;
		removeSavedPackAction(effectivePack, {
			onSuccess: () => {
				onRemoveSuccess?.();
				setCloseSignal(true);
			},
			packLink: packLinkSlug,
		});
	}, [effectivePack?.id, packLinkSlug, onRemoveSuccess]);

	const copyLink = useCallback(() => {
		if (packLink) {
			Clipboard.setString(packLink);
			showNotify('system', { message: t('link_copied_to_clipboard'), position: 'bottom' });
		}
		setContextMenuVisible(false);
	}, [packLink, t]);

	const openReorderSheet = useCallback(() => {
		setContextMenuVisible(false);
		if (effectivePack && effectiveStickers.length > 0) stickerInteractionsStore.openReorderSheet(effectivePack, effectiveStickers);
	}, [effectivePack, effectiveStickers]);

	const menuItems: ContextMenuItem[] = useMemo(
		() => [
			{ id: 0, label: t('share'), callback: () => setContextMenuVisible(false), textColor: currentTheme.text_100 },
			{ id: 1, label: t('contextMenu_copy_link'), callback: copyLink, textColor: currentTheme.text_100 },
			...(effectivePack?.is_admin
				? [{ id: 2, label: t('sticker_reorder') || 'Изменить порядок', callback: openReorderSheet, textColor: currentTheme.text_100 }]
				: []),
		],
		[t, copyLink, currentTheme.text_100, effectivePack?.is_admin, openReorderSheet]
	);

	const rowData = useMemo(() => buildRows(effectivePack, effectiveStickers), [effectivePack, effectiveStickers]);

	const renderRow = useCallback(
		({ item }: { item: RowItem; }) => (
			<StickerRow
				item={item}
				cellSize={cellSize}
				uploadingPackId={null}
				onPlusPress={() => { }}
				plusCellBackgroundColor={currentTheme.bg_300 ?? currentTheme.bg_200}
				textColor={currentTheme.text_100}
				onRegisterCellRef={onRegisterCellRef}
				onUnregisterCellRef={onUnregisterCellRef}
			/>
		),
		[cellSize, currentTheme.bg_300, currentTheme.bg_200, currentTheme.text_100, onRegisterCellRef, onUnregisterCellRef]
	);

	const keyExtractor = useCallback((item: RowItem, index: number) => `row-${index}`, []);

	const estimatedItemSize = cellSize + 4;

	const content = useMemo(() => {
		if (openByPackId && !fullData) {
			return (
				<View style={styles.sheetContent}>
					<View style={[styles.listWrap, styles.linkPlaceholderWrap]}>
						<AsyncDataRender
							data={null}
							status="pending"
							loadingComponentStyle={{ paddingVertical: 24 }}
							renderContent={() => null}
						/>
					</View>
				</View>
			);
		}
		if (showLinkPlaceholder) {
			const notFound = linkLoadStatus === 'fulfilled' && linkNotFoundMessage;
			return (
				<View style={styles.sheetContent}>
					<View style={[styles.listWrap, styles.linkPlaceholderWrap]}>
						{notFound ? (
							<SecondaryText style={styles.linkPlaceholderText} tac="center">{linkNotFoundMessage}</SecondaryText>
						) : (
							<AsyncDataRender
								data={null}
								status={linkLoadStatus ?? 'idle'}
								loadingComponentStyle={{ paddingVertical: 24 }}
								renderContent={() => null}
								errorComponent={<SecondaryText style={styles.linkPlaceholderText} tac="center">{linkNotFoundMessage ?? t('sticker_pack_not_found')}</SecondaryText>}
							/>
						)}
					</View>
				</View>
			);
		}
		return (
			<View style={styles.sheetContent}>
				{effectivePack && (
					<View style={styles.headerRow}>
						<View style={styles.titleWrap}>
							<RenderFormattedText text={effectivePack.title} formatOnlyTags textStyle={styles.titleText} />
						</View>
						<View ref={menuButtonRef} collapsable={false} style={styles.menuBtnWrap}>
							<Pressable
								onPress={() => setContextMenuVisible(true)}
								style={({ pressed }) => [styles.menuBtn, { backgroundColor: currentTheme.bg_300 }, pressed && styles.menuBtnPressed]}
							>
								<MaterialIcons name="more-vert" size={22} color={currentTheme.text_100} />
							</Pressable>
						</View>
					</View>
				)}
				<View style={styles.listWrap}>
					<GestureDetector gesture={composedGesture}>
						<View style={styles.gestureWrap}>
							<FlashList<RowItem>
								data={rowData}
								renderItem={renderRow}
								keyExtractor={keyExtractor}
								estimatedItemSize={estimatedItemSize}
								numColumns={1}
								contentContainerStyle={isFromLink ? { ...styles.listContent, ...styles.listContentLinkBottom } : styles.listContent}
							/>
						</View>
					</GestureDetector>
				</View>
			</View>
		);
	}, [openByPackId, fullData, showLinkPlaceholder, linkLoadStatus, linkNotFoundMessage, effectivePack, rowData, renderRow, keyExtractor, currentTheme.bg_300, currentTheme.text_100, composedGesture, t, isFromLink]);

	if (!visible) return null;

	const snapPoints = showLinkPlaceholder ? ['30%'] : ['50%', '85%'];

	const showLinkSaveButton = isFromLink && effectivePack && !showLinkPlaceholder;

	return (
		<>
			<BottomSheetUi
				isBottomSheet={visible}
				setIsBottomSheet={(v) => !v && onClose()}
				onCloseSignal={closeSignal}
				setOnCloseSignal={setCloseSignal}
				title=""
				snap={snapPoints}
				bottomSheetBgColor={currentTheme.bg_200}
				footer={(
					<View
						style={[
							styles.linkSaveButtonWrap,
							{ bottom: insets.bottom - 10 }
						]}
					>
						{effectivePack?.is_saved ? (
							<ButtonUi onPress={handleRemoveSavedPack} backgroundColor={currentTheme.error_100}>
								<MainText fontWeight='bold'>
									{t('delete')}
								</MainText>
							</ButtonUi>
						) : (
							<ButtonUi onPress={handleSavePack}>
								<MainText fontWeight='bold'>
									{t('save')}
								</MainText>
							</ButtonUi>
						)}
					</View>
				)}
				footerStyle={{ backgroundColor: "transparent", borderTopWidth: 0 }}
			>
				<View style={styles.sheetWrapper}>
					{content}
					{/* {showLinkSaveButton && (
						<View style={[styles.linkSaveButtonWrap, { backgroundColor: currentTheme.bg_200 }]}>
							{pack.is_saved ? (
								<ButtonUi onPress={handleRemoveSavedPack} backgroundColor={currentTheme.bg_300}>
									{t('sticker_remove_saved') || 'Удалить'}
								</ButtonUi>
							) : (
								<ButtonUi onPress={handleSavePack}>
									{t('sticker_save') || 'Сохранить'}
								</ButtonUi>
							)}
						</View>
					)} */}
				</View>
			</BottomSheetUi>
			<ContextMenuUi
				items={menuItems}
				isVisible={contextMenuVisible}
				onClose={() => setContextMenuVisible(false)}
				anchorRef={menuButtonRef}
				width={200}
				offset={{ x: -160, y: 8 }}
				position="bottom"
			/>

			<StickerPreviewModal
				ref={previewModalRef}
				visible={!!previewSticker}
				sticker={previewSticker}
				contextMenuVisible={previewContextMenuVisible}
				onClose={hidePreview}
				onSendSticker={onSendSticker}
				favouriteIds={favouriteIds}
				isPackAdmin={effectivePack?.is_admin ?? false}
				onRemoveFromPack={handleRemoveFromPack}
				onReorderPack={effectivePack && effectiveStickers.length > 0 ? () => stickerInteractionsStore.openReorderSheet(effectivePack, effectiveStickers) : undefined}
			/>
		</>
	);
});

const TITLE_FONT_SIZE = 18;

const styles = StyleSheet.create({
	sheetWrapper: {
		flex: 1,
		minHeight: 0,
	},
	sheetContent: {
		flex: 1,
		flexDirection: 'column',
		minHeight: 0,
	},
	linkSaveButtonWrap: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		paddingHorizontal: 20,
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 12,
		paddingVertical: 8,
		minHeight: 44,
	},
	titleWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 8,
	},
	titleText: {
		fontSize: TITLE_FONT_SIZE,
		textAlign: 'center',
	},
	menuBtnWrap: {
		position: 'absolute',
		right: 12,
		top: 8,
		bottom: 8,
		justifyContent: 'center',
	},
	menuBtn: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
	},
	menuBtnPressed: {
		opacity: 0.8,
	},
	listWrap: {
		flex: 1,
		minHeight: 0,
	},
	gestureWrap: {
		flex: 1,
		minHeight: 0,
	},
	listContent: {
		paddingHorizontal: 12,
		paddingBottom: 24,
	},
	listContentLinkBottom: {
		paddingBottom: 72,
	},
	linkPlaceholderWrap: {
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	linkPlaceholderText: {
		textAlign: 'center',
	},
});
