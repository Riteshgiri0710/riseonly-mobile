import { CleverImage, ModalUi, MainText, SimpleButtonUi } from '@core/ui';
import { BlurView } from 'expo-blur';
import { changeRgbA } from '@lib/theme';
import React, { useMemo, useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { themeStore } from 'src/modules/theme/stores';
import { getStickerDisplayUrl, isLottieSticker } from './utils';
import type { StickerInList } from './types';
import { MESSAGE_HOLD_CONTEXT_MENU_WIDTH } from '@modules/chat/shared/config/const';
import { stickerActionsStore } from 'src/modules/sticker/stores/sticker/sticker-action/sticker-actions';
import { stickerInteractionsStore } from 'src/modules/sticker/stores/sticker/sticker-interactions/sticker-interactions';
import { StickerPreviewContextMenu } from './StickerPreviewContextMenu';

const PREVIEW_SIZE = 200;
const EMOJI_SIZE = 32;
const MENU_GAP_BELOW_STICKER = 10;
const EXIT_DURATION_MS = 180;

interface StickerPreviewModalProps {
	visible: boolean;
	sticker?: StickerInList | null;
	contextMenuVisible?: boolean;
	onClose: () => void;
	onSendSticker?: (sticker?: StickerInList) => void;
	onViewPack?: () => void;
	favouriteIds?: Set<string>;
	isPackAdmin?: boolean;
	onRemoveFromPack?: () => void;
	onReorderPack?: () => void;
}

export type StickerPreviewModalHandle = { animateAndClose: () => void; };
export type { StickerPreviewModalProps };

const StickerPreviewModalInner = forwardRef<StickerPreviewModalHandle, StickerPreviewModalProps>(function StickerPreviewModal(props, ref) {
	const { currentTheme } = themeStore;
	const {
		addStickerFavouriteAction,
		removeStickerFavouriteAction
	} = stickerActionsStore;
	const {
		selectedSticker: { setSelectedSticker }
	} = stickerInteractionsStore;
	const {
		visible,
		sticker: stickerProp,
		contextMenuVisible = false,
		onClose,
		onSendSticker,
		onViewPack,
		favouriteIds = new Set(),
		isPackAdmin = false,
		onRemoveFromPack,
		onReorderPack,
	} = props;

	const sticker = stickerInteractionsStore.selectedSticker.selectedSticker ?? stickerProp ?? null;

	const { t } = useTranslation();

	const [removeConfirmVisible, setRemoveConfirmVisible] = useState(false);
	const isClosingRef = useRef(false);
	const opacity = useSharedValue(0);
	const scale = useSharedValue(0.88);
	const menuOpacity = useSharedValue(0);
	const menuScale = useSharedValue(0.3);

	const { height: windowHeight, width: windowWidth } = Dimensions.get('window');

	const boxContentHeight = EMOJI_SIZE + 8 + PREVIEW_SIZE;
	const menuTop = windowHeight / 2 + boxContentHeight / 2 + MENU_GAP_BELOW_STICKER;
	const menuLeft = (windowWidth - MESSAGE_HOLD_CONTEXT_MENU_WIDTH) / 2;

	useEffect(() => {
		if (visible && sticker) {
			opacity.value = withTiming(1, { duration: 220 });
			scale.value = withSpring(1, { damping: 18, stiffness: 160 });
		} else {
			opacity.value = withTiming(0, { duration: 180 });
			scale.value = withTiming(0.88, { duration: 180 });
		}
	}, [visible, sticker, opacity, scale]);

	useEffect(() => {
		if (contextMenuVisible) {
			menuOpacity.value = withTiming(1, { duration: 150 });
			menuScale.value = withSpring(1, { damping: 33, mass: 1.03, stiffness: 500 });
		} else {
			menuOpacity.value = withTiming(0, { duration: 150 });
			menuScale.value = withTiming(0.3, { duration: 150 });
		}
	}, [contextMenuVisible, menuOpacity, menuScale]);

	const finishClose = useCallback(() => {
		isClosingRef.current = false;
		setSelectedSticker(null);
		onClose();
	}, [onClose]);

	const animateAndClose = useCallback(() => {
		if (isClosingRef.current) return;
		isClosingRef.current = true;
		opacity.value = withTiming(
			0,
			{ duration: EXIT_DURATION_MS },
			(finished) => {
				if (finished) runOnJS(finishClose)();
			},
		);
		scale.value = withTiming(0.88, { duration: EXIT_DURATION_MS });
	}, [opacity, scale, finishClose]);

	useImperativeHandle(ref, () => ({ animateAndClose }), [animateAndClose]);

	const overlayStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	const boxStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ scale: scale.value }],
	}));

	const menuStyle = useAnimatedStyle(() => ({
		opacity: menuOpacity.value,
		transform: [{ scale: menuScale.value }],
	}));

	const handleSend = React.useCallback(() => {
		if (sticker && onSendSticker) {
			onSendSticker();
		}
		animateAndClose();
	}, [sticker, onSendSticker, animateAndClose]);

	const handleViewPack = React.useCallback(() => {
		if (sticker && onViewPack) onViewPack();
		animateAndClose();
	}, [sticker, onViewPack, animateAndClose]);

	const handleAddToFavourites = React.useCallback(() => {
		addStickerFavouriteAction();
		animateAndClose();
	}, [addStickerFavouriteAction, animateAndClose]);

	const handleRemoveFromFavourites = React.useCallback(() => {
		const s = stickerInteractionsStore.selectedSticker.selectedSticker;
		if (!s) return;
		removeStickerFavouriteAction(s.id);
		animateAndClose();
	}, [removeStickerFavouriteAction, animateAndClose]);

	const handleRemoveFromPackPress = useCallback(() => {
		setRemoveConfirmVisible(true);
	}, []);

	const handleRemoveFromPackConfirm = useCallback(() => {
		if (sticker && onRemoveFromPack) {
			onRemoveFromPack();
		}
		setRemoveConfirmVisible(false);
		animateAndClose();
	}, [sticker, onRemoveFromPack, animateAndClose]);

	const isFavourite = sticker ? favouriteIds.has(sticker.id) : false;
	const showRemoveFromPack = isPackAdmin && !!onRemoveFromPack;
	const showReorderPack = isPackAdmin && !!onReorderPack;
	const handleReorderPackPress = useCallback(() => {
		if (sticker && onReorderPack) onReorderPack();
		animateAndClose();
	}, [sticker, onReorderPack, animateAndClose]);

	const menuItems = useMemo(
		() => [
			{
				text: 'Отправить',
				icon: 'send' as const,
				onPress: handleSend,
				disabled: !onSendSticker,
			},
			{
				text: 'Посмотреть набор',
				icon: 'collections' as const,
				onPress: handleViewPack,
				disabled: !onViewPack,
			},
			isFavourite
				? {
					text: 'Удалить из избранных',
					icon: 'star' as const,
					onPress: handleRemoveFromFavourites,
					disabled: false,
				}
				: {
					text: 'Добавить в избранное',
					icon: 'star-outline' as const,
					onPress: handleAddToFavourites,
					disabled: false,
				},
			...(showRemoveFromPack
				? [
					{
						text: t('sticker_remove_from_pack'),
						icon: 'delete-outline' as const,
						onPress: handleRemoveFromPackPress,
						disabled: false,
					},
				]
				: []),
			...(showReorderPack
				? [
					{
						text: t('sticker_reorder') || 'Изменить порядок',
						icon: 'reorder' as const,
						onPress: handleReorderPackPress,
						disabled: false,
					},
				]
				: []),
		],
		[handleSend, handleViewPack, handleAddToFavourites, handleRemoveFromFavourites, onSendSticker, onViewPack, isFavourite, showRemoveFromPack, handleRemoveFromPackPress, showReorderPack, handleReorderPackPress, t]
	);

	if (!visible) return null;

	const displayUrl = sticker ? getStickerDisplayUrl(sticker) : '';
	const isLottie = displayUrl ? isLottieSticker(displayUrl) : false;
	const firstEmoji = sticker?.associated_emojis?.[0] ?? '';
	const overlayBg = changeRgbA(currentTheme.bg_100 ?? '#000', 0.5);

	return (
		<>
			{!removeConfirmVisible && (
				<Modal visible transparent animationType="none" statusBarTranslucent>
					<View style={styles.backdrop} pointerEvents="box-none">
						<Pressable
							style={StyleSheet.absoluteFill}
							onPress={animateAndClose}
							pointerEvents={visible ? 'auto' : 'none'}
						>
							<Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="none">
								<BlurView
									intensity={60}
									tint="dark"
									style={[StyleSheet.absoluteFill, { backgroundColor: overlayBg }]}
								/>
							</Animated.View>
						</Pressable>
						<View style={styles.centeredWrap} pointerEvents="box-none">
							<Animated.View style={[styles.box, boxStyle]} pointerEvents="none">
								{firstEmoji ? (
									<Text style={styles.emoji} numberOfLines={1}>
										{firstEmoji}
									</Text>
								) : null}
								<View style={styles.stickerWrap} key={sticker?.id}>
									{displayUrl ? (
										isLottie ? (
											<LottieView
												source={{ uri: displayUrl }}
												autoPlay
												loop
												style={styles.sticker}
											/>
										) : (
											<CleverImage
												source={{ uri: displayUrl }}
												imageStyles={[styles.sticker, styles.stickerRound]}
												resizeMode="contain"
											/>
										)
									) : null}
								</View>
							</Animated.View>
						</View>
						{contextMenuVisible && sticker && (
							<View style={styles.menuWrap} pointerEvents="box-none">
								<StickerPreviewContextMenu
									visible
									containerStyle={[
										styles.menuPosition,
										{ top: menuTop, left: menuLeft },
										menuStyle,
									]}
									width={MESSAGE_HOLD_CONTEXT_MENU_WIDTH}
									items={menuItems}
								/>
							</View>
						)}
					</View>
				</Modal>
			)}

			<ModalUi
				visible={removeConfirmVisible}
				onClose={() => setRemoveConfirmVisible(false)}
				title={t('sticker_remove_from_pack_confirm_title')}
			>
				<View style={styles.confirmModalContent}>
					<MainText style={styles.confirmModalMessage}>
						{t('sticker_remove_from_pack_confirm_message')}
					</MainText>
					<View style={styles.confirmModalButtons}>
						<SimpleButtonUi
							style={[styles.confirmModalBtn, { backgroundColor: currentTheme.bg_300 }]}
							onPress={() => setRemoveConfirmVisible(false)}
						>
							<MainText>{t('cancel_text')}</MainText>
						</SimpleButtonUi>
						<SimpleButtonUi
							style={[styles.confirmModalBtn, { backgroundColor: currentTheme.primary_100 }]}
							onPress={handleRemoveFromPackConfirm}
						>
							<MainText>{t('delete_text')}</MainText>
						</SimpleButtonUi>
					</View>
				</View>
			</ModalUi>
		</>
	);
});

export const StickerPreviewModal = StickerPreviewModalInner;

const styles = StyleSheet.create({
	backdrop: {
		...StyleSheet.absoluteFillObject,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	centeredWrap: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		overflow: 'hidden',
	},
	box: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	emoji: {
		fontSize: EMOJI_SIZE,
		marginBottom: 8,
	},
	stickerWrap: {
		width: PREVIEW_SIZE,
		height: PREVIEW_SIZE,
		alignItems: 'center',
		justifyContent: 'center',
	},
	sticker: {
		width: PREVIEW_SIZE,
		height: PREVIEW_SIZE,
	},
	stickerRound: {
		borderRadius: 12,
	},
	menuWrap: {
		...StyleSheet.absoluteFillObject,
		zIndex: 10000,
		elevation: 10000,
	},
	menuPosition: {
		position: 'absolute',
		zIndex: 10001,
		elevation: 10001,
	},
	confirmModalContent: {
		gap: 16,
		width: '100%',
	},
	confirmModalMessage: {
		textAlign: 'center',
		paddingHorizontal: 8,
	},
	confirmModalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
		width: '100%',
	},
	confirmModalBtn: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 8,
		alignItems: 'center',
	},
});
