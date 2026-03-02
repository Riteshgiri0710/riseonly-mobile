import { useCallback, useRef } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import {
	CONTEXT_MENU_STATE,
	WINDOW_HEIGHT,
	WINDOW_WIDTH,
} from '../constants';
import { useInternal } from './useInternal';
import { calculateMenuHeight } from '../utils/calculations';
import type { TransformOriginAnchorPosition } from '../utils/calculations';
import type { MenuItemProps } from '../components/menu/types';

export type OpenContextMenuOptions = {
	items: MenuItemProps[];
	onClose?: () => void;
	itemX?: number;
	itemY?: number;
	itemWidth?: number;
	itemHeight?: number;
	anchorPosition?: TransformOriginAnchorPosition;
	menuWidth?: number;
	transformValue?: number;
};

const DEFAULT_ANCHOR = {
	itemX: WINDOW_WIDTH - 220,
	itemY: Math.min(200, WINDOW_HEIGHT * 0.3),
	itemWidth: 200,
	itemHeight: 44,
	anchorPosition: 'top-right' as const,
	transformValue: 0,
};

/**
 * Opens HoldMenu context menu programmatically (without HoldItem). Used for message list without HoldItem: long press sets
 * selectedMessageForContextMenu, затем вызывается openMenu — одно меню на экран, без лагов.
 */
export function useOpenContextMenu() {
	const { state, menuProps } = useInternal();
	const onCloseRef = useRef<(() => void) | null>(null);

	const invokeOnCloseAndClearRef = useCallback(() => {
		const cb = onCloseRef.current;
		if (cb) {
			onCloseRef.current = null;
			cb();
		}
	}, []);

	useAnimatedReaction(
		() => state.value,
		(current, previous) => {
			'worklet';
			if (previous === CONTEXT_MENU_STATE.ACTIVE && current === CONTEXT_MENU_STATE.END) {
				runOnJS(invokeOnCloseAndClearRef)();
			}
		},
		[invokeOnCloseAndClearRef]
	);

	const openMenu = useCallback((options: OpenContextMenuOptions) => {
		const {
			items,
			onClose,
			itemX = DEFAULT_ANCHOR.itemX,
			itemY = DEFAULT_ANCHOR.itemY,
			itemWidth = DEFAULT_ANCHOR.itemWidth,
			itemHeight = DEFAULT_ANCHOR.itemHeight,
			anchorPosition = DEFAULT_ANCHOR.anchorPosition,
			menuWidth,
			transformValue = DEFAULT_ANCHOR.transformValue,
		} = options;

		const separatorCount = items.filter((i) => i.withSeparator).length;
		const labelCount = items.filter((i) => i.isLabel).length;
		const menuHeight = calculateMenuHeight(items.length, separatorCount, labelCount);

		menuProps.value = {
			items,
			itemHeight,
			itemWidth,
			itemY,
			itemX,
			anchorPosition,
			menuHeight,
			transformValue,
			actionParams: {},
			...(menuWidth != null && { menuWidth }),
		};

		onCloseRef.current = onClose ?? null;
		state.value = CONTEXT_MENU_STATE.ACTIVE;
	}, [menuProps, state]);

	const closeMenu = useCallback(() => {
		state.value = CONTEXT_MENU_STATE.END;
	}, [state]);

	return { openMenu, closeMenu };
}
