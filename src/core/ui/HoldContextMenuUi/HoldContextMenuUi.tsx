import { defaultContextMenuActions } from '@core/config/ts';
import { MainText } from '@core/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	Dimensions,
	Pressable,
	StyleSheet,
	View,
	ViewStyle
} from 'react-native';
import { Portal } from 'react-native-paper';
import Animated, {
	Easing,
	Extrapolation,
	SharedValue,
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withSpring,
	withTiming
} from 'react-native-reanimated';
import { themeStore } from 'src/modules/theme/stores';

export interface HoldContextMenuAction {
	icon: string;
	title: string;
	onPress: () => void;
}

interface HoldContextMenuUiProps {
	itemLayout: { x: number; y: number; width: number; height: number; } | null;
	open?: boolean;
	onClose?: () => void;
	selectedItem?: any;
	setSelectedItem?: (item: any) => void;
	actions?: HoldContextMenuAction[];
	side?: "right" | "left";
	menuStyle?: ViewStyle;
	isBlurMenu?: boolean;
	messageAnimatedY?: SharedValue<number>;
	renderMessage?: React.ReactNode;
	messageRef?: React.RefObject<View | null>;
}

const MenuItem = memo(({
	item,
	isLast,
	onPress
}: {
	item: HoldContextMenuAction;
	isLast: boolean;
	onPress: () => void;
}) => {
	const currentTheme = themeStore.currentTheme;

	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [
				styles.menuItem,
				{
					borderBottomWidth: isLast ? 0 : 0.5,
					borderBottomColor: currentTheme.border_100,
					backgroundColor: pressed ? 'rgba(100, 100, 100, 0.15)' : 'transparent'
				}
			]}
		>
			<MainText color={item.icon === "delete" ? "red" : currentTheme.text_100}>
				{item.title}
			</MainText>
			<MaterialIcons
				name={item.icon as any}
				size={20}
				color={item.icon === "delete" ? "red" : currentTheme.text_100}
			/>
		</Pressable>
	);
});

const SPRING_CONFIG = {
	damping: 20,
	stiffness: 300,
	mass: 0.6,
	overshootClamping: false,
	restDisplacementThreshold: 0.01,
	restSpeedThreshold: 2,
};

const TIMING_CONFIG = {
	duration: 200,
	easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

export const HoldContextMenuUi = memo(({
	itemLayout,
	open,
	onClose,
	selectedItem,
	setSelectedItem,
	actions = defaultContextMenuActions,
	side = "right",
	menuStyle = {},
	messageAnimatedY,
	renderMessage,
	messageRef
}: HoldContextMenuUiProps) => {
	const currentTheme = themeStore.currentTheme;
	const screenHeight = Dimensions.get('window').height;
	const screenWidth = Dimensions.get('window').width;

	const isOpen = useSharedValue(0); // 0 = closed, 1 = open
	const containerTranslateY = useSharedValue(0);
	const menuOriginOffsetX = useSharedValue(0);
	const menuOriginOffsetY = useSharedValue(0);

	const [menuLayout, setMenuLayout] = useState<{ width: number; height: number; } | null>(null);

	const menuRef = useRef<View>(null);
	const isClosingRef = useRef(false);

	const MENU_MARGIN = 10;
	const SAFE_BOTTOM = 40;
	const MENU_WIDTH = 200;
	const EDGE_MARGIN = 5;
	const LIST_PADDING = 35;

	const handleMenuLayout = useCallback((event: any) => {
		const { width, height } = event.nativeEvent.layout;
		setMenuLayout({ width, height });
	}, []);

	const handleCloseComplete = useCallback(() => {
		if (onClose) onClose();
		if (setSelectedItem) setSelectedItem(null);
		setMenuLayout(null);
		isClosingRef.current = false;
	}, [onClose, setSelectedItem]);

	const closeMenu = useCallback(() => {
		if (isClosingRef.current) return;
		isClosingRef.current = true;

		isOpen.value = withTiming(0, TIMING_CONFIG, (finished) => {
			if (finished) {
				runOnJS(handleCloseComplete)();
			}
		});
	}, [isOpen, handleCloseComplete]);

	const handleMenuItemPress = useCallback((action: HoldContextMenuAction) => {
		if (action?.onPress) {
			action.onPress();
		}
		closeMenu();
	}, [closeMenu]);

	const backdropOpacityDerived = useDerivedValue(() => isOpen.value, []);
	const messageOpacityDerived = useDerivedValue(() => isOpen.value, []);
	const menuOpacityDerived = useDerivedValue(() => {
		return interpolate(
			isOpen.value,
			[0, 0.3, 1],
			[0, 0, 1],
			Extrapolation.CLAMP
		);
	}, []);
	const menuScaleXDerived = useDerivedValue(() => {
		return interpolate(
			isOpen.value,
			[0, 1],
			[0.3, 1],
			Extrapolation.CLAMP
		);
	}, []);
	const menuScaleYDerived = useDerivedValue(() => {
		return interpolate(
			isOpen.value,
			[0, 1],
			[0.3, 1],
			Extrapolation.CLAMP
		);
	}, []);

	const calculateTransformValue = useMemo(() => {
		if (!itemLayout || !menuLayout) {
			return 0;
		}

		const spacing = 8;
		const isAnchorPointTop = true;

		let tY = 0;
		if (isAnchorPointTop) {
			const menuBottom =
				itemLayout.y +
				itemLayout.height +
				menuLayout.height +
				spacing +
				SAFE_BOTTOM;

			if (menuBottom > screenHeight) {
				tY = screenHeight - menuBottom;
			} else {
				tY = 0;
			}
		}
		return tY;
	}, [itemLayout, menuLayout, screenHeight]);

	const calculatedShift = useMemo(() => {
		if (!itemLayout || !menuLayout) {
			return 0;
		}

		const menuTop = itemLayout.y + itemLayout.height + MENU_MARGIN;
		const menuBottom = menuTop + menuLayout.height;

		if (menuBottom > screenHeight - SAFE_BOTTOM) {
			const overflow = menuBottom - (screenHeight - SAFE_BOTTOM);
			return -overflow;
		}

		return 0;
	}, [itemLayout, menuLayout, screenHeight]);

	const backdropStyle = useAnimatedStyle(() => ({
		opacity: backdropOpacityDerived.value
	}), []);

	const menuAnimStyle = useAnimatedStyle(() => {
		const scaleX = menuScaleXDerived.value;
		const scaleY = menuScaleYDerived.value;
		const offsetX = menuOriginOffsetX.value * (1 - scaleX);
		const offsetY = menuOriginOffsetY.value * (1 - scaleY);

		return {
			opacity: menuOpacityDerived.value,
			transform: [
				{ scaleX },
				{ scaleY },
				{ translateX: offsetX },
				{ translateY: offsetY + containerTranslateY.value }
			]
		};
	}, []);

	useEffect(() => {
		if (!selectedItem && !open) {
			isOpen.value = 0;
			containerTranslateY.value = 0;
			if (messageAnimatedY) {
				messageAnimatedY.value = withTiming(0, TIMING_CONFIG);
			}
			isClosingRef.current = false;
			setMenuLayout(null);
			return;
		}

		isClosingRef.current = false;
		containerTranslateY.value = 0;

		if (messageAnimatedY && menuLayout) {
			const transformValue = calculateTransformValue;
			console.log('[HoldContextMenuUi] Setting messageAnimatedY to:', transformValue);
			messageAnimatedY.value = withSpring(transformValue, SPRING_CONFIG);
		} else if (messageAnimatedY) {
			messageAnimatedY.value = 0;
		}

		isOpen.value = withSpring(1, SPRING_CONFIG);
	}, [selectedItem, open, isOpen, containerTranslateY, messageAnimatedY, calculateTransformValue, menuLayout]);

	useEffect(() => {
		if (!itemLayout || !menuLayout || !open || !selectedItem) return;

		menuOriginOffsetX.value = 0;
		menuOriginOffsetY.value = 0;

		if (calculatedShift !== 0) {
			containerTranslateY.value = withSpring(calculatedShift, {
				damping: 25,
				stiffness: 300,
				mass: 0.5,
			});
		}

		if (messageAnimatedY) {
			const transformValue = calculateTransformValue;
			console.log('[HoldContextMenuUi] Updating messageAnimatedY after menu layout:', transformValue);
			messageAnimatedY.value = withSpring(transformValue, SPRING_CONFIG);
		}
	}, [calculatedShift, itemLayout, menuLayout, open, selectedItem, side, containerTranslateY, menuOriginOffsetX, menuOriginOffsetY, messageAnimatedY, calculateTransformValue]);

	if (!selectedItem && !open && !isClosingRef.current) {
		return null;
	}

	const messagePortalOpacity = useDerivedValue(() => isOpen.value, []);

	const messagePortalStyle = useAnimatedStyle(() => {
		if (!itemLayout || !messageAnimatedY) {
			return {
				opacity: 0,
				pointerEvents: 'none' as const,
			};
		}

		const opacity = messagePortalOpacity.value;

		return {
			opacity,
			position: 'absolute' as const,
			top: itemLayout.y,
			left: itemLayout.x,
			width: itemLayout.width,
			height: itemLayout.height,
			zIndex: 10000,
			transform: [
				{
					translateY: messageAnimatedY.value,
				},
			],
			pointerEvents: opacity > 0 ? 'auto' as const : 'none' as const,
		};
	}, [itemLayout, messageAnimatedY, messagePortalOpacity]);

	return (
		<Portal>
			<Animated.View
				style={[styles.backdrop, backdropStyle]}
				pointerEvents={open || selectedItem ? 'auto' : 'none'}
			>
				<BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
					<Pressable
						style={StyleSheet.absoluteFill}
						onPress={closeMenu}
					/>
				</BlurView>
			</Animated.View>

			{/* Teleported original message above backdrop */}
			{itemLayout && renderMessage && (
				<Animated.View
					style={messagePortalStyle}
					renderToHardwareTextureAndroid={true}
					shouldRasterizeIOS={true}
					needsOffscreenAlphaCompositing={true}
				>
					{renderMessage}
				</Animated.View>
			)}

			{itemLayout && (
				<Animated.View
					ref={menuRef}
					onLayout={handleMenuLayout}
					style={[
						styles.contextMenu,
						{
							position: 'absolute',
							top: itemLayout.y + itemLayout.height + MENU_MARGIN,
							left: (() => {
								const menuWidth = menuLayout?.width || MENU_WIDTH;

								if (side === "right") {
									return screenWidth - menuWidth - EDGE_MARGIN;
								} else {
									return EDGE_MARGIN + LIST_PADDING;
								}
							})(),
							backgroundColor: currentTheme.bg_200,
							zIndex: 10001
						},
						menuAnimStyle,
						menuStyle
					]}
					renderToHardwareTextureAndroid={true}
					shouldRasterizeIOS={true}
					needsOffscreenAlphaCompositing={true}
				>
					{actions.map((item, index) => (
						<MenuItem
							key={index}
							item={item}
							isLast={index === actions.length - 1}
							onPress={() => handleMenuItemPress(item)}
						/>
					))}
				</Animated.View>
			)}
		</Portal>
	);
});
const styles = StyleSheet.create({
	backdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'transparent',
		zIndex: 9998
	},
	contextMenu: {
		borderRadius: 12,
		paddingVertical: 3,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
		width: 200
	},
	menuItem: {
		paddingHorizontal: 17.5,
		width: 200,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		height: 40,
		gap: 10
	}
});
