import type { SaiFile } from '@lib/mobx-toolbox/mobxSaiWs';
import { MediaPickerUi } from '@core/ui';
import type { MediaItem } from '@core/ui/MediaPickerUi/MediaPickerUi';
import { HoldItem } from '@core/ui/HoldMenu';
import type { MenuItemProps } from '@core/ui/HoldMenu/components/menu/types';
import { navigate } from '@lib/navigation';
import { showNotify } from '@core/config/const';
import { changeRgbA } from '@lib/theme';
import { BlurView } from 'expo-blur';
import * as DocumentPicker from 'expo-document-picker';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, InteractionManager, Pressable, Share, Text, useWindowDimensions, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { GestureDetector } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { stickerActionsStore } from 'src/modules/sticker/stores/sticker/sticker-action/sticker-actions';
import { stickerInteractionsStore } from 'src/modules/sticker/stores/sticker/sticker-interactions/sticker-interactions';
import { themeStore } from 'src/modules/theme/stores';
import { profileStore } from 'src/modules/user/stores/profile';
import { AddStickerContextMenu } from './AddStickerContextMenu';
import { SectionHeader } from './SectionHeader';
import { StickerEmojiPickerModal } from './StickerEmojiPickerModal';
import { StickerPreviewModal, type StickerPreviewModalHandle } from './StickerPreviewModal';
import { StickerRow } from './StickerRow';
import { mainStyles } from './styles';
import type { ChatStickerWidgetProps, ListItem, PackRecord, StickerInList } from './types';
import { FAVOURITES_PACK, FAVOURITES_PACK_ID, STICKER_PANEL_HEIGHT } from './types';
import { buildListData, getStickerCellSize } from './utils';
import { useStickerPreviewGesture } from './useStickerPreviewGesture';
import { stickerServiceStore } from '@modules/sticker/stores';
import { EditPackModal } from './EditPackModal';
export { STICKER_PANEL_HEIGHT } from './types';

export const ChatStickerWidget = observer(({ animatedStyle, open, onSendSticker }: ChatStickerWidgetProps) => {
	const { currentTheme } = themeStore;
	const {
		getDefaultPacks,
		getSavedPacks,
		createStickerAction,
		getPackStickersAction,
		getDefaultPacksAction,
		getSavedPacksAction,
		getFavouritesAction,
		deletePackAction,
		removeStickerFromPackAction,
		getFavouritesRequest,
	} = stickerActionsStore;
	const { getPackStickersData } = stickerServiceStore;
	const {
		stickerPackSheetOpen: { stickerPackSheetOpen },
		openStickerPackByPack
	} = stickerInteractionsStore;

	const { t } = useTranslation();
	const { width } = useWindowDimensions();
	const cellSize = getStickerCellSize(width);

	const defaultPacks = getDefaultPacks.data?.packs ?? [];
	const savedPacks = getSavedPacks.data?.packs ?? [];

	const hasSavedPacks = savedPacks.length > 0;
	const savedPackIds = useMemo(() => new Set(savedPacks.map((p) => p.id)), [savedPacks]);
	const packs = hasSavedPacks
		? [...savedPacks, ...defaultPacks.filter((p) => !savedPackIds.has(p.id))]
		: defaultPacks;

	const isLoading = getDefaultPacks.isPending;

	const getPackStickers = useCallback((packId: string) => getPackStickersData(packId), []);

	const handleOpenReorder = useCallback((pack: PackRecord) => {
		const stickers = getPackStickersData(pack.id) ?? [];
		stickerInteractionsStore.openReorderSheet(pack, stickers);
	}, [getPackStickersData]);

	const [mediaPickerVisible, setMediaPickerVisible] = useState(false);
	const [addStickerPackId, setAddStickerPackId] = useState<string | null>(null);
	const [contextMenuVisible, setContextMenuVisible] = useState(false);
	const [contextMenuPack, setContextMenuPack] = useState<PackRecord | null>(null);
	const [uploadingPackId, setUploadingPackId] = useState<string | null>(null);
	const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
	const [pendingSticker, setPendingSticker] = useState<{ packId: string; file: SaiFile; } | null>(null);
	const jsonPickInProgressRef = useRef(false);
	const stickerByIdRef = useRef(new Map<string, StickerInList>());
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

	useEffect(() => {
		if (!open) return;
		getDefaultPacksAction(0, 50);
		getSavedPacksAction(undefined, 100);
		getFavouritesAction();
	}, [open]);

	useEffect(() => {
		if (!open) return;
		if (stickerPackSheetOpen) return;
		packs.forEach((pack) => getPackStickersAction(pack.id));
	}, [packs, stickerPackSheetOpen, open]);

	const favourites = getFavouritesRequest?.data?.stickers ?? [];
	const listData = buildListData(packs, getPackStickers, favourites);
	const favouriteIds = useMemo(() => new Set(favourites.map((s) => s.id)), [favourites]);

	const listRef = useRef<FlatList<ListItem>>(null);
	const sectionIndexByPackId = useMemo(() => {
		const map: Record<string, number> = {};
		listData.forEach((item, index) => {
			if (item.type === 'section') map[item.pack.id] = index;
		});
		return map;
	}, [listData]);

	const scrollToSection = useCallback((packId: string) => {
		const index = sectionIndexByPackId[packId];
		if (index !== undefined) {
			listRef.current?.scrollToIndex({ index, viewPosition: 0 });
		}
	}, [sectionIndexByPackId]);

	const getTabMenuItems = useCallback(
		(pack: PackRecord): MenuItemProps[] => {
			const isFavourites = pack.id === FAVOURITES_PACK_ID;
			const sharePayload = isFavourites
				? { message: pack.title || '', title: pack.title }
				: { message: pack.link || pack.title || '', title: pack.title || '' };
			const items: MenuItemProps[] = [
				{
					text: t('share'),
					icon: 'share',
					onPress: () => {
						Share.share(sharePayload).catch(() => { });
					},
				},
				...(pack.link
					? [
						{
							text: t('contextMenu_copy_link'),
							icon: 'link',
							onPress: () => {
								Clipboard.setString(pack.link!);
								showNotify('system', { message: t('link_copied_to_clipboard'), position: 'bottom' });
							},
						} as MenuItemProps,
					]
					: []),
			];
			if (pack.is_admin && !isFavourites) {
				items.push({
					text: t('delete'),
					icon: 'delete',
					isDestructive: true,
					onPress: () => {
						Alert.alert(
							t('sticker_pack_delete_title'),
							t('sticker_pack_delete_message'),
							[
								{ text: t('cancel'), style: 'cancel' },
								{
									text: t('delete'),
									style: 'destructive',
									onPress: () => deletePackAction(pack.id),
								},
							]
						);
					},
				});
			}
			return items;
		},
		[t]
	);

	useEffect(() => {
		const map = new Map<string, StickerInList>();
		for (const item of listData) {
			if (item.type === 'sticker_row') {
				for (const s of item.stickers) map.set(s.id, s as StickerInList);
			}
		}
		stickerByIdRef.current = map;
	}, [listData]);

	const handleViewPack = useCallback(
		() => {
			const s = stickerInteractionsStore.selectedSticker.selectedSticker;
			if (!s?.pack_id || s.pack_id === FAVOURITES_PACK_ID) {
				hidePreview();
				return;
			}
			const pack = packs.find((p) => p.id === s.pack_id) ?? null;
			if (!pack) {
				hidePreview();
				return;
			}
			getPackStickersAction(s.pack_id);
			const stickers = stickerActionsStore.packStickersByPackId?.data?.stickers ?? [];
			openStickerPackByPack(pack, stickers);
			hidePreview();
		},
		[packs, hidePreview]
	);

	const isPackAdminForPreview = useMemo(() => {
		const s = stickerInteractionsStore.selectedSticker.selectedSticker;
		if (!s || s.pack_id === FAVOURITES_PACK_ID) return false;
		const pack = packs.find((p) => p.id === s.pack_id);
		return pack?.is_admin ?? false;
	}, [packs]);

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

	const handleReorderFromPreview = useCallback(
		() => {
			const s = stickerInteractionsStore.selectedSticker.selectedSticker;
			if (!s || s.pack_id === FAVOURITES_PACK_ID) return;
			const pack = packs.find((p) => p.id === s.pack_id);
			if (pack) handleOpenReorder(pack);
			hidePreview();
		},
		[packs, handleOpenReorder, hidePreview]
	);

	const openMediaPickerForPack = useCallback((packId: string) => {
		setAddStickerPackId(packId);
		setContextMenuVisible(false);
		setContextMenuPack(null);
		setMediaPickerVisible(true);
	}, []);

	const pickJsonAndUpload = useCallback((packId: string) => {
		if (jsonPickInProgressRef.current) return;
		jsonPickInProgressRef.current = true;
		setContextMenuVisible(false);
		setContextMenuPack(null);
		InteractionManager.runAfterInteractions(() => {
			setTimeout(async () => {
				try {
					const result = await DocumentPicker.getDocumentAsync({
						type: 'application/json',
						copyToCacheDirectory: true,
					});
					if (result.canceled) {
						jsonPickInProgressRef.current = false;
						return;
					}
					const asset = result.assets[0];
					const file: SaiFile = { uri: asset.uri, type: 'application/json', name: asset.name ?? 'sticker.json' };
					setPendingSticker({ packId, file });
					setEmojiPickerVisible(true);
				} catch (e) {
					console.warn('Sticker JSON pick failed', e);
				} finally {
					jsonPickInProgressRef.current = false;
				}
			}, 500);
		});
	}, []);

	const onPlusPress = useCallback((pack: PackRecord) => {
		setContextMenuPack(pack);
		setContextMenuVisible(true);
	}, []);

	const onMediaPickerFinish = useCallback(
		async (selectedMedia: MediaItem[]) => {
			const photos = selectedMedia.filter((m) => m.mediaType === 'photo');
			if (photos.length === 0 || !addStickerPackId) {
				setMediaPickerVisible(false);
				setAddStickerPackId(null);
				return;
			}
			const first = photos[0];
			const file = first?.file ?? (first as any)?.file;
			if (!file?.uri) {
				setMediaPickerVisible(false);
				setAddStickerPackId(null);
				return;
			}
			setMediaPickerVisible(false);
			const packId = addStickerPackId;
			setAddStickerPackId(null);
			const saiFile: SaiFile = {
				uri: file.uri,
				type: file.type || 'image/jpeg',
				name: file.name || 'sticker.jpg',
			};
			setPendingSticker({ packId, file: saiFile });
			setEmojiPickerVisible(true);
		},
		[addStickerPackId],
	);

	const onEmojiPickerDone = useCallback((emojis: string[]) => {
		const pending = pendingSticker;
		setPendingSticker(null);
		setEmojiPickerVisible(false);
		if (!pending || emojis.length === 0 || emojis.length > 20) return;
		setUploadingPackId(pending.packId);
		createStickerAction(pending.packId, pending.file, emojis);
		setTimeout(() => {
			getPackStickersAction(pending.packId);
			setUploadingPackId(null);
		}, 800);
	}, [pendingSticker]);

	const renderItem = useCallback(
		({ item }: { item: ListItem; }) => {
			if (item.type === 'section') {
				const pack = item.pack;
				const canEdit = pack.id !== FAVOURITES_PACK_ID && pack.is_admin;
				return (
					<SectionHeader
						pack={pack}
						textColor={currentTheme.text_100}
						isAdmin={pack.is_admin}
						onEditPress={canEdit ? () => stickerInteractionsStore.openEditPackModal(pack) : undefined}
					/>
				);
			}
			return (
				<StickerRow
					item={item}
					cellSize={cellSize}
					uploadingPackId={uploadingPackId}
					onPlusPress={onPlusPress}
					plusCellBackgroundColor={changeRgbA(currentTheme.bg_100, 0.8)}
					textColor={currentTheme.text_100}
					onRegisterCellRef={onRegisterCellRef}
					onUnregisterCellRef={onUnregisterCellRef}
					onSendSticker={onSendSticker}
				/>
			);
		},
		[cellSize, currentTheme, uploadingPackId, onPlusPress, onRegisterCellRef, onUnregisterCellRef, onSendSticker],
	);

	const keyExtractor = useCallback((item: ListItem, index: number) => {
		if (item.type === 'section') return `section-${item.pack.id}`;
		return `row-${item.pack.id}-${index}`;
	}, []);

	if (!open) return null;

	return (
		<Animated.View
			style={[mainStyles.container, { height: STICKER_PANEL_HEIGHT }, animatedStyle]}
			pointerEvents="box-none"
		>
			<View style={mainStyles.blurWrapper} pointerEvents="none">
				<BlurView
					intensity={28}
					style={[
						mainStyles.blur,
						{
							borderColor: currentTheme.border_100,
							backgroundColor: changeRgbA(currentTheme.bg_100, 0.5),
						},
					]}
				/>
			</View>

			<View style={mainStyles.content} pointerEvents="auto">
				<View style={mainStyles.tabsRow}>
					<FlatList
						horizontal
						data={[FAVOURITES_PACK, ...packs]}
						keyExtractor={(p) => p.id}
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={mainStyles.tabsContent}
						renderItem={({ item: pack }) => {
							const isFavourites = pack.id === FAVOURITES_PACK_ID;
							const tabContent = (
								<Pressable
									onPress={() => scrollToSection(pack.id)}
									style={({ pressed }) => [
										mainStyles.tabLetter,
										{
											backgroundColor: changeRgbA(currentTheme.bg_200 ?? currentTheme.bg_100, 0.9),
											opacity: pressed ? 0.8 : 1,
										},
									]}
								>
									{isFavourites ? (
										<MaterialIcons name="star" size={20} color={currentTheme.text_100} />
									) : (
										<Text style={[mainStyles.tabLetterText, { color: currentTheme.text_100 }]}>
											{(pack.title || '?').charAt(0).toUpperCase()}
										</Text>
									)}
								</Pressable>
							);
							if (isFavourites) return tabContent;
							return (
								<HoldItem
									items={getTabMenuItems(pack)}
									menuAnchorPosition="top-center"
									disableMove
									longPressMinDurationMs={200}
								>
									{tabContent}
								</HoldItem>
							);
						}}
					/>
				</View>

				{isLoading ? (
					<View style={mainStyles.loader}>
						<ActivityIndicator color={currentTheme.text_100} size="small" />
					</View>
				) : (
					<GestureDetector gesture={composedGesture}>
						<View style={mainStyles.listWrap} collapsable={false}>
							<FlatList
								ref={listRef}
								data={listData}
								renderItem={renderItem}
								keyExtractor={keyExtractor}
								contentContainerStyle={mainStyles.listContent}
								initialNumToRender={16}
								onScrollToIndexFailed={(info) => {
									setTimeout(() => {
										listRef.current?.scrollToIndex({
											index: info.index,
											viewPosition: 0,
										});
									}, 100);
								}}
							/>
						</View>
					</GestureDetector>
				)}
			</View>

			<Pressable
				onPress={() => navigate('StickerSettings')}
				style={({ pressed }) => [mainStyles.settingsButton, { opacity: pressed ? 0.8 : 1 }]}
				pointerEvents="auto"
			>
				<BlurView
					intensity={15}
					style={[mainStyles.settingsBlur, { backgroundColor: changeRgbA(currentTheme.bg_100, 0.8) }]}
				>
					<MaterialIcons name="settings" size={22} color={currentTheme.text_100} />
				</BlurView>
			</Pressable>

			<MediaPickerUi
				isVisible={mediaPickerVisible}
				onClose={() => {
					setMediaPickerVisible(false);
					setAddStickerPackId(null);
				}}
				onFinish={onMediaPickerFinish}
				multiple={false}
				maxSelections={1}
				needAutoReset
			/>

			<AddStickerContextMenu
				visible={contextMenuVisible}
				pack={contextMenuPack}
				textColor={currentTheme.text_100}
				backgroundColor={currentTheme.bg_200 ?? currentTheme.bg_100}
				onClose={() => {
					setContextMenuVisible(false);
					setContextMenuPack(null);
				}}
				onPickPhoto={() => contextMenuPack && openMediaPickerForPack(contextMenuPack.id)}
				onPickJson={() => contextMenuPack && pickJsonAndUpload(contextMenuPack.id)}
				onReorderPack={handleOpenReorder}
			/>

			<StickerEmojiPickerModal
				visible={emojiPickerVisible}
				onClose={() => {
					setEmojiPickerVisible(false);
					setPendingSticker(null);
				}}
				onDone={onEmojiPickerDone}
			/>

			<StickerPreviewModal
				ref={previewModalRef}
				visible={!!previewSticker}
				sticker={previewSticker}
				contextMenuVisible={previewContextMenuVisible}
				onClose={hidePreview}
				onSendSticker={onSendSticker}
				onViewPack={handleViewPack}
				favouriteIds={favouriteIds}
				isPackAdmin={isPackAdminForPreview}
				onRemoveFromPack={handleRemoveFromPack}
				onReorderPack={handleReorderFromPreview}
			/>

			<EditPackModal />
		</Animated.View>
	);
});