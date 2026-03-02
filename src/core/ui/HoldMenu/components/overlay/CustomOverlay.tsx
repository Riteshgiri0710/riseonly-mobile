import React, { useContext } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';

import {
	CONTEXT_MENU_STATE,
	HOLD_ITEM_TRANSFORM_DURATION,
	SPRING_CONFIGURATION,
	WINDOW_HEIGHT,
	WINDOW_WIDTH,
} from '../../constants';
import { MenuTopContentContext } from '../../context/menuTopContent';
import { useInternal } from '../../hooks';

const OVERLAY_SPACING = 7;

const CustomOverlayComponent = () => {
	const { state, menuProps } = useInternal();
	const { menuTopContent } = useContext(MenuTopContentContext);

	const overlayTranslateY = useSharedValue(0);
	const overlayOpacity = useSharedValue(0);

	useAnimatedReaction(
		() => ({ s: state.value, t: menuProps.value.transformValue ?? 0 }),
		({ s, t }) => {
			'worklet';
			const active = s === CONTEXT_MENU_STATE.ACTIVE;
			overlayTranslateY.value = withSpring(active ? t : 0, SPRING_CONFIGURATION);
			overlayOpacity.value = withTiming(active ? 1 : 0, {
				duration: HOLD_ITEM_TRANSFORM_DURATION,
			});
		},
		[]
	);

	const overlayStyle = useAnimatedStyle(() => {
		'worklet';
		const itemY = menuProps.value.itemY ?? 0;
		const menuOffset = menuProps.value.menuOffset ?? { x: 0, y: 0 };
		const baseBottom = WINDOW_HEIGHT - itemY + OVERLAY_SPACING + (menuOffset.y ?? 0);
		const bottom = baseBottom - overlayTranslateY.value;

		return {
			position: 'absolute',
			left: 0,
			right: 0,
			width: WINDOW_WIDTH,
			bottom,
			zIndex: 10001,
			elevation: 10001,
			opacity: overlayOpacity.value,
			pointerEvents: state.value === CONTEXT_MENU_STATE.ACTIVE ? 'auto' : 'none',
		};
	});

	if (!menuTopContent) return null;

	return (
		<Animated.View style={[styles.overlay, overlayStyle]}>
			{menuTopContent}
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	overlay: {
		width: '100%',
		alignItems: 'stretch',
		justifyContent: 'flex-end',
	},
});

export default React.memo(CustomOverlayComponent);
