import type { MutableRefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { haptics } from '@utils/haptics';
import { parseCellRefKey } from './utils';
import type { StickerInList } from './types';
import { stickerInteractionsStore } from '@modules/sticker/stores/sticker/sticker-interactions/sticker-interactions';

const HOLD_DURATION_MS = 800;

export type UseStickerPreviewGestureOptions = {
	closeWithAnimation?: () => void;
};

export function useStickerPreviewGesture(
	stickerByIdRef: MutableRefObject<Map<string, StickerInList>>,
	options: UseStickerPreviewGestureOptions = {},
) {
	const { selectedSticker: { setSelectedSticker } } = stickerInteractionsStore;

	const { closeWithAnimation } = options;
	const [previewSticker, setPreviewSticker] = useState<StickerInList | null>(null);
	const [previewContextMenuVisible, setPreviewContextMenuVisible] = useState(false);

	const cellRefsRef = useRef(new Map<string, View>());
	const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const previewStickerIdRef = useRef<string | null>(null);
	const isPreviewActiveRef = useRef(false);
	const contextMenuOpenedRef = useRef(false);

	useEffect(() => {
		previewStickerIdRef.current = previewSticker?.id ?? null;
	}, [previewSticker]);

	useEffect(() => {
		contextMenuOpenedRef.current = previewContextMenuVisible;
	}, [previewContextMenuVisible]);

	useEffect(() => () => {
		if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
	}, []);

	const onRegisterCellRef = useCallback((cellKey: string, view: View) => {
		cellRefsRef.current.set(cellKey, view);
	}, []);
	const onUnregisterCellRef = useCallback((cellKey: string) => {
		cellRefsRef.current.delete(cellKey);
	}, []);

	const getStickerAtPositionLive = useCallback(
		(touchX: number, touchY: number, callback: (sticker: StickerInList | null) => void) => {
			const refs = cellRefsRef.current;
			const byId = stickerByIdRef.current;
			const entries = Array.from(refs.entries());
			if (entries.length === 0) {
				callback(null);
				return;
			}
			let pending = entries.length;
			const results: { cellKey: string; b: { x: number; y: number; width: number; height: number; }; }[] = [];
			for (const [cellKey, view] of entries) {
				view.measureInWindow((bx, by, w, h) => {
					results.push({ cellKey, b: { x: bx, y: by, width: w, height: h } });
					pending--;
					if (pending === 0) {
						const matches = results.filter(
							(r) =>
								touchX >= r.b.x &&
								touchX <= r.b.x + r.b.width &&
								touchY >= r.b.y &&
								touchY <= r.b.y + r.b.height,
						);
						if (matches.length === 0) {
							callback(null);
							return;
						}
						const best = matches.reduce((a, b) => {
							const areaA = a.b.width * a.b.height;
							const areaB = b.b.width * b.b.height;
							if (areaA !== areaB) return areaA < areaB ? a : b;
							const cxA = a.b.x + a.b.width / 2;
							const cyA = a.b.y + a.b.height / 2;
							const cxB = b.b.x + b.b.width / 2;
							const cyB = b.b.y + b.b.height / 2;
							const distA = (cxA - touchX) ** 2 + (cyA - touchY) ** 2;
							const distB = (cxB - touchX) ** 2 + (cyB - touchY) ** 2;
							return distA <= distB ? a : b;
						});
						const parsed = parseCellRefKey(best.cellKey);
						const stickerId = parsed?.stickerId;
						callback(stickerId ? (byId.get(stickerId) ?? null) : null);
					}
				});
			}
		},
		[],
	);

	const showPreview = useCallback(
		(_relativeX: number, _relativeY: number, absoluteX: number, absoluteY: number) => {
			isPreviewActiveRef.current = true;
			setPreviewContextMenuVisible(false);
			if (holdTimerRef.current) {
				clearTimeout(holdTimerRef.current);
				holdTimerRef.current = null;
			}
			getStickerAtPositionLive(absoluteX, absoluteY, (sticker) => {
				if (sticker) {
					haptics.success();
					setSelectedSticker(sticker);
					holdTimerRef.current = setTimeout(() => {
						holdTimerRef.current = null;
						setPreviewContextMenuVisible(true);
						haptics.light();
					}, HOLD_DURATION_MS);
				}
				setPreviewSticker(sticker);
			});
		},
		[getStickerAtPositionLive],
	);

	const updatePreview = useCallback(
		(_relativeX: number, _relativeY: number, absoluteX: number, absoluteY: number) => {
			if (!isPreviewActiveRef.current) return;
			getStickerAtPositionLive(absoluteX, absoluteY, (sticker) => {
				const prevId = previewStickerIdRef.current;
				if (sticker != null && prevId != null && sticker.id !== prevId) {
					if (holdTimerRef.current) {
						clearTimeout(holdTimerRef.current);
						holdTimerRef.current = null;
					}
					setPreviewContextMenuVisible(false);
					holdTimerRef.current = setTimeout(() => {
						holdTimerRef.current = null;
						setPreviewContextMenuVisible(true);
						haptics.light();
					}, HOLD_DURATION_MS);
				}
				setPreviewSticker((prev) => {
					if (sticker?.id === prev?.id) return prev;
					if (sticker) {
						haptics.success();
						setSelectedSticker(sticker);
					}
					return sticker ?? prev ?? null;
				});
			});
		},
		[getStickerAtPositionLive],
	);

	const hidePreview = useCallback(() => {
		isPreviewActiveRef.current = false;
		contextMenuOpenedRef.current = false;
		if (holdTimerRef.current) {
			clearTimeout(holdTimerRef.current);
			holdTimerRef.current = null;
		}
		setSelectedSticker(null);
		setPreviewContextMenuVisible(false);
		setPreviewSticker(null);
	}, []);

	const maybeHidePreview = useCallback(() => {
		if (!contextMenuOpenedRef.current) {
			if (closeWithAnimation) closeWithAnimation();
			else hidePreview();
		}
	}, [hidePreview, closeWithAnimation]);

	const longPressGesture = useMemo(
		() =>
			Gesture.LongPress()
				.minDuration(500)
				.maxDistance(10000)
				.onStart((e) => {
					runOnJS(showPreview)(e.x, e.y, e.absoluteX, e.absoluteY);
				}),
		[showPreview],
	);

	const panGesture = useMemo(
		() =>
			Gesture.Pan()
				.onUpdate((e) => {
					runOnJS(updatePreview)(e.x, e.y, e.absoluteX, e.absoluteY);
				})
				.onEnd(() => {
					runOnJS(maybeHidePreview)();
				})
				.onFinalize(() => {
					runOnJS(maybeHidePreview)();
				}),
		[updatePreview, maybeHidePreview],
	);

	const composedGesture = useMemo(
		() => Gesture.Simultaneous(longPressGesture, panGesture),
		[longPressGesture, panGesture],
	);

	return {
		previewSticker,
		previewContextMenuVisible,
		hidePreview,
		composedGesture,
		onRegisterCellRef,
		onUnregisterCellRef,
	};
}
