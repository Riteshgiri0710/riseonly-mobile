import React, { useCallback, useState } from 'react';
import { Text } from 'react-native';
import Animated, {
	runOnJS,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import MenuItems from './MenuItems';
import {
	CONTEXT_MENU_STATE,
	HOLD_ITEM_TRANSFORM_DURATION,
	MENU_WIDTH,
	SPRING_CONFIGURATION,
	WINDOW_WIDTH
} from '../../constants';
import { useInternal } from '../../hooks';
import { themeStore } from 'src/modules/theme/stores';
import styles from './styles';
import { MenuItemProps } from './types';
import { BlurView } from 'expo-blur';

const MenuListComponent = () => {
	const { contextMenuBlurIntensity, getContextMenuBg } = themeStore;

	const { state, menuProps } = useInternal();

	const [items, setItems] = useState<MenuItemProps[]>([]);
	const [customMenuStyle, setCustomMenuStyle] = useState<any>(null);

	const menuOpacity = useSharedValue(0);
	const menuScale = useSharedValue(0.3);

	useAnimatedReaction(
		() => state.value,
		(s) => {
			'worklet';
			const isActive = s === CONTEXT_MENU_STATE.ACTIVE;
			menuOpacity.value = withTiming(isActive ? 1 : 0, {
				duration: HOLD_ITEM_TRANSFORM_DURATION,
			});
			menuScale.value = withSpring(isActive ? 1 : 0.3, SPRING_CONFIGURATION);
		},
		[]
	);

	const flushItems = useCallback((newItems: MenuItemProps[]) => {
		requestAnimationFrame(() => setItems(newItems));
	}, []);

	useAnimatedReaction(
		() => menuProps.value.items,
		(newItems, previousItems) => {
			'worklet';
			const newLength = newItems ? newItems.length : 0;
			const prevLength = previousItems ? previousItems.length : 0;

			if (newLength !== prevLength || (newItems && newLength > 0)) {
				runOnJS(flushItems)(newItems || []);
			}
		},
		[]
	);

	const menuStyle = useAnimatedStyle(() => {
		'worklet';
		const menuHeight = menuProps.value.menuHeight || 100;

		const itemX = menuProps.value.itemX || 0;
		const itemY = menuProps.value.itemY || 0;
		const itemHeight = menuProps.value.itemHeight || 0;
		const transformValue = menuProps.value.transformValue || 0;
		const anchorPosition = menuProps.value.anchorPosition || 'top-right';
		const customMenuWidth = menuProps.value.menuWidth || MENU_WIDTH;
		const menuOffset = menuProps.value.menuOffset || { x: 0, y: 0 };

		const top = itemY + itemHeight + transformValue + 7 + (menuOffset.y || 0);

		const isRight = anchorPosition === 'top-right' || anchorPosition === 'bottom-right';
		const EDGE_MARGIN = 5;
		const LIST_PADDING = 35;

		const baseLeft = isRight
			? WINDOW_WIDTH - customMenuWidth - EDGE_MARGIN
			: EDGE_MARGIN + LIST_PADDING;
		const left = baseLeft + (menuOffset.x || 0);

		return {
			position: 'absolute',
			left,
			top,
			width: customMenuWidth,
			height: menuHeight,
			zIndex: 10001,
			elevation: 10001,
			opacity: menuOpacity.value,
			transform: [{ scale: menuScale.value }],
			pointerEvents: state.value === CONTEXT_MENU_STATE.ACTIVE ? 'auto' : 'none',
		};
	});

	useAnimatedReaction(
		() => menuProps.value.menuStyle,
		(newStyle) => {
			'worklet';
			runOnJS(setCustomMenuStyle)(newStyle);
		},
		[]
	);

	const containerStyle = {
		backgroundColor: getContextMenuBg(),
		overflow: "hidden",
		...(customMenuStyle || {}),
	};

	const [debugMenuPropsItems, setDebugMenuPropsItems] = useState(0);

	useAnimatedReaction(
		() => menuProps.value.items?.length || 0,
		(length) => {
			'worklet';
			runOnJS(setDebugMenuPropsItems)(length);
		},
		[]
	);

	return (
		<Animated.View
			style={[styles.menuContainer, menuStyle]}
		>
			<BlurView
				intensity={contextMenuBlurIntensity}
				style={containerStyle}
			>
				{items.length > 0 ? (
					<MenuItems items={items} />
				) : (
					<Text style={{ color: 'red', padding: 10 }}>
						No items! State items: {items.length}, MenuProps items: {debugMenuPropsItems}
					</Text>
				)}
			</BlurView>
		</Animated.View>
	);
};

export default MenuListComponent;

