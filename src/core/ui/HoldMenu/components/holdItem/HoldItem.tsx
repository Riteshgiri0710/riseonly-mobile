import React, { memo, useEffect, useMemo } from 'react';
import { ViewProps } from 'react-native';

//#region reanimated & gesture handler
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	measure,
	runOnJS,
	useAnimatedProps,
	useAnimatedReaction,
	useAnimatedRef,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSequence,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
//#endregion

//#region dependencies
import { Portal } from '@gorhom/portal';
import * as Haptics from 'expo-haptics';

//#endregion

//#region utils & types
import {
	CONTEXT_MENU_STATE,
	HOLD_ITEM_SCALE_DOWN_DURATION,
	HOLD_ITEM_SCALE_DOWN_VALUE,
	HOLD_ITEM_TRANSFORM_DURATION,
	SPRING_CONFIGURATION,
	WINDOW_HEIGHT,
	WINDOW_WIDTH,
} from '../../constants';
import { useDeviceOrientation } from '../../hooks';
import {
	TransformOriginAnchorPosition,
	calculateMenuHeight,
	getTransformOrigin,
} from '../../utils/calculations';
import styles from './styles';

import { generateSimpleUUID } from '@lib/string';
import { useInternal } from '../../hooks';
import type { HoldItemProps } from './types';
//#endregion

const DEBUG_HOLD_ITEM = __DEV__;
const DEBUG_HOLD_LAZY = __DEV__;

const logTiming = (key: string, step: string, data?: Record<string, unknown>) => {
	if (!DEBUG_HOLD_ITEM) return;
	const shortKey = key.slice(-8);
	console.log(`[HoldItem:${shortKey}] ${step} t=${Date.now()}`, data ?? '');
};

function logLazy(itemId: string, step: string, payload: Record<string, unknown>) {
	if (!DEBUG_HOLD_LAZY) return;
	console.log(`[HoldLazy] ${step} itemId=${itemId}`, payload);
}

type Context = { didMeasureLayout: boolean; };

const HoldItemComponent = ({
	items,
	bottom,
	containerStyles,
	disableMove,
	menuAnchorPosition,
	activateOn,
	hapticFeedback,
	actionParams,
	closeOnTap,
	longPressMinDurationMs = 150,
	text = false,
	menuStyle,
	menuWidth,
	onLongPress,
	menuOffset = { x: 0, y: 0 },
	scaleDownValue: scaleDownValueProp,
	activeHoldMessageIdShared,
	itemId,
	children,
}: HoldItemProps) => {
	const scaleDownValue = scaleDownValueProp ?? HOLD_ITEM_SCALE_DOWN_VALUE;
	const { state, menuProps, safeAreaInsets } = useInternal();
	const deviceOrientation = useDeviceOrientation();

	const itemIdValue = useSharedValue(itemId ?? '');
	React.useLayoutEffect(() => {
		itemIdValue.value = itemId ?? '';
	}, [itemId, itemIdValue]);

	const isActive = useSharedValue(false);
	const isAnimationStarted = useSharedValue(false);
	const isActivating = useSharedValue(false);

	const itemRectY = useSharedValue<number>(0);
	const itemRectX = useSharedValue<number>(0);
	const itemRectWidth = useSharedValue<number>(0);
	const itemRectHeight = useSharedValue<number>(0);
	const itemScale = useSharedValue<number>(1);
	const transformValue = useSharedValue<number>(0);

	const transformOrigin = useSharedValue<TransformOriginAnchorPosition>(
		menuAnchorPosition || 'top-right'
	);

	const deviceOrientationValue = useSharedValue<'portrait' | 'landscape'>(deviceOrientation);
	const menuHeightValue = useSharedValue<number>(0);
	const itemsValue = useSharedValue<any[]>(items);
	const itemsLengthValue = useSharedValue<number>(items.length);
	const actionParamsValue = useSharedValue<any>(actionParams || {});
	const bottomValue = useSharedValue<boolean>(bottom || false);
	const disableMoveValue = useSharedValue<boolean>(disableMove || false);
	const menuAnchorPositionValue = useSharedValue<TransformOriginAnchorPosition | undefined>(menuAnchorPosition);
	const safeAreaInsetsValue = useSharedValue<{ top: number; bottom: number; left: number; right: number; }>({
		top: safeAreaInsets?.top || 0,
		bottom: safeAreaInsets?.bottom || 0,
		left: safeAreaInsets?.left || 0,
		right: safeAreaInsets?.right || 0,
	});
	const activateOnValue = useSharedValue<'tap' | 'double-tap' | 'hold' | undefined>(activateOn);
	const hapticFeedbackValue = useSharedValue<string | undefined>(hapticFeedback);
	const closeOnTapValue = useSharedValue<boolean>(closeOnTap || false);
	const menuOffsetValue = useSharedValue<{ x: number; y: number; }>({
		x: menuOffset?.x || 0,
		y: menuOffset?.y || 0,
	});
	const scaleDownValueRef = useSharedValue<number>(scaleDownValue);

	const key = useMemo(() => `hold-item-${generateSimpleUUID()}`, []);
	const menuHeight = useMemo(() => {
		const itemsWithSeparator = items.filter(item => item.withSeparator);
		const labelCount = items.filter(item => item.isLabel).length;
		return calculateMenuHeight(items.length, itemsWithSeparator.length, labelCount);
	}, [items]);

	const isHold = !activateOn || activateOn === 'hold';

	useEffect(() => {
		deviceOrientationValue.value = deviceOrientation;
		menuHeightValue.value = menuHeight;
		itemsValue.value = items;
		itemsLengthValue.value = items.length;
		actionParamsValue.value = actionParams || {};
		bottomValue.value = bottom || false;
		disableMoveValue.value = disableMove || false;
		menuAnchorPositionValue.value = menuAnchorPosition;
		safeAreaInsetsValue.value = {
			top: safeAreaInsets?.top || 0,
			bottom: safeAreaInsets?.bottom || 0,
			left: safeAreaInsets?.left || 0,
			right: safeAreaInsets?.right || 0,
		};
		activateOnValue.value = activateOn;
		hapticFeedbackValue.value = hapticFeedback;
		closeOnTapValue.value = closeOnTap || false;
		menuOffsetValue.value = {
			x: menuOffset?.x || 0,
			y: menuOffset?.y || 0,
		};
		scaleDownValueRef.value = scaleDownValue;
	}, [
		deviceOrientation,
		menuHeight,
		items,
		actionParams,
		bottom,
		disableMove,
		menuAnchorPosition,
		safeAreaInsets,
		activateOn,
		hapticFeedback,
		closeOnTap,
		menuOffset,
		scaleDownValue,
	]);

	const containerRef = useAnimatedRef<Animated.View>();

	const hapticResponse = (hapticFeedbackVal: string | undefined) => {
		const style = !hapticFeedbackVal ? 'Medium' : hapticFeedbackVal;
		switch (style) {
			case `Selection`:
				Haptics.selectionAsync();
				break;
			case `Light`:
			case `Medium`:
			case `Heavy`:
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle[style]);
				break;
			case `Success`:
			case `Warning`:
			case `Error`:
				Haptics.notificationAsync(Haptics.NotificationFeedbackType[style]);
				break;
			default:
		}
	};

	const activateAnimation = (ctx: any) => {
		'worklet';
		if (!ctx.didMeasureLayout) {
			const measured = measure(containerRef);

			if (!measured || measured.width === 0 || measured.height === 0) {
				return false;
			}

			itemRectY.value = measured.pageY;
			itemRectX.value = measured.pageX;
			itemRectHeight.value = measured.height;
			itemRectWidth.value = measured.width;

			if (!menuAnchorPositionValue.value) {
				const position = getTransformOrigin(
					measured.pageX,
					itemRectWidth.value,
					deviceOrientationValue.value === 'portrait' ? WINDOW_WIDTH : WINDOW_HEIGHT,
					bottomValue.value
				);
				transformOrigin.value = position;
			}

			return true;
		}
		return true;
	};

	const calculateTransformValue = () => {
		'worklet';

		const height =
			deviceOrientationValue.value === 'portrait' ? WINDOW_HEIGHT : WINDOW_WIDTH;

		const transformOriginVal = transformOrigin.value;
		const isAnchorPointTop = transformOriginVal === 'top-right' ||
			transformOriginVal === 'top-left' ||
			transformOriginVal === 'top-center';

		let tY = 0;
		if (!disableMoveValue.value) {
			const spacing = 10;
			if (isAnchorPointTop) {
				const topTransform =
					itemRectY.value +
					itemRectHeight.value +
					menuHeightValue.value +
					spacing +
					safeAreaInsetsValue.value.bottom;

				tY = topTransform > height ? height - topTransform : 0;
			} else {
				const bottomTransform =
					itemRectY.value - menuHeightValue.value - safeAreaInsetsValue.value.top;
				tY =
					bottomTransform < 0 ? -bottomTransform + spacing * 2 : 0;
			}
		}

		return tY;
	};

	const setMenuProps = () => {
		'worklet';

		const props = {
			itemHeight: itemRectHeight.value,
			itemWidth: itemRectWidth.value,
			itemY: itemRectY.value,
			itemX: itemRectX.value,
			anchorPosition: transformOrigin.value,
			menuHeight: menuHeightValue.value,
			items: itemsValue.value,
			transformValue: transformValue.value,
			actionParams: actionParamsValue.value,
			menuStyle: menuStyle,
			menuWidth: menuWidth,
			menuOffset: {
				x: menuOffsetValue.value.x,
				y: menuOffsetValue.value.y,
			},
		};

		menuProps.value = props;
		runOnJS(logTiming)(key, 'setMenuProps:done', {});
	};

	const scaleBack = () => {
		'worklet';
		itemScale.value = withTiming(1, {
			duration: HOLD_ITEM_TRANSFORM_DURATION / 2,
		});
	};

	const onCompletion = (isFinised?: boolean) => {
		'worklet';
		const isListValid = itemsLengthValue.value > 0;

		if (isFinised && isListValid) {
			runOnJS(logTiming)(key, 'stateACTIVE', { isFinised, isListValid });
			state.value = CONTEXT_MENU_STATE.ACTIVE;
			isActive.value = true;
			scaleBack();
			const hapticFeedbackVal = hapticFeedbackValue.value;
			if (hapticFeedbackVal && hapticFeedbackVal !== 'None') {
				runOnJS(hapticResponse)(hapticFeedbackVal);
			}
		}

		isAnimationStarted.value = false;

		// TODO: Warn user if item list is empty or not given
	};

	const scaleHold = () => {
		'worklet';
		itemScale.value = withTiming(
			scaleDownValueRef.value,
			{ duration: HOLD_ITEM_SCALE_DOWN_DURATION },
			onCompletion
		);
	};

	const scaleTap = () => {
		'worklet';
		isAnimationStarted.value = true;

		itemScale.value = withSequence(
			withTiming(scaleDownValueRef.value, {
				duration: HOLD_ITEM_SCALE_DOWN_DURATION,
			}),
			withTiming(
				1,
				{
					duration: HOLD_ITEM_TRANSFORM_DURATION / 2,
				},
				onCompletion
			)
		);
	};

	/**
	 * When use tap activation ("tap") and trying to tap multiple times,
	 * scale animation is called again despite it is started. This causes a bug.
	 * To prevent this, it is better to check is animation already started.
	 */
	const canCallActivateFunctions = () => {
		'worklet';
		const activateOnVal = activateOnValue.value;
		const willActivateWithTap =
			activateOnVal === 'double-tap' || activateOnVal === 'tap';

		return (
			(willActivateWithTap && !isAnimationStarted.value) || !willActivateWithTap
		);
	};

	const context = useSharedValue<Context>({ didMeasureLayout: false });

	const handleGestureActive = () => {
		'worklet';
		if (activeHoldMessageIdShared && itemIdValue.value !== activeHoldMessageIdShared.value) {
			if (DEBUG_HOLD_LAZY) {
				runOnJS(logLazy)(itemIdValue.value, 'handleGestureActive:SKIP', { activeVal: activeHoldMessageIdShared.value });
			}
			return;
		}
		if (DEBUG_HOLD_LAZY && activeHoldMessageIdShared) {
			runOnJS(logLazy)(itemIdValue.value, 'handleGestureActive:OK', {});
		}
		runOnJS(logTiming)(key, 'handleGestureActive:start', { state: state.value, isActive: isActive.value });
		if (state.value === CONTEXT_MENU_STATE.ACTIVE && !isActive.value) {
			return;
		}

		isActivating.value = true;

		if (canCallActivateFunctions()) {
			if (state.value === CONTEXT_MENU_STATE.ACTIVE && !isActive.value) {
				isActivating.value = false;
				return;
			}

			if (!context.value.didMeasureLayout) {
				if (onLongPress) runOnJS(onLongPress)();
				const measured = activateAnimation(context.value);
				runOnJS(logTiming)(key, 'afterMeasure', { measured: !!measured });
				if (!measured) {
					isActivating.value = false;
					return;
				}
				transformValue.value = calculateTransformValue();
				setMenuProps();
				runOnJS(logTiming)(key, 'afterSetMenuProps', {});
				runOnJS(logTiming)(key, 'afterApplyOverlay', {});
				context.value.didMeasureLayout = true;
			}

			if (state.value === CONTEXT_MENU_STATE.ACTIVE && !isActive.value) {
				isActivating.value = false;
				return;
			}

			if (!isActive.value) {
				if (longPressMinDurationMs <= 30) {
					state.value = CONTEXT_MENU_STATE.ACTIVE;
					isActive.value = true;
				}

				const activateOnVal = activateOnValue.value;
				const isHoldVal = !activateOnVal || activateOnVal === 'hold';
				if (isHoldVal) {
					scaleHold();
				} else {
					scaleTap();
				}
			}
		}
	};

	const handleGestureEnd = () => {
		'worklet';
		if (activeHoldMessageIdShared) {
			if (DEBUG_HOLD_LAZY) {
				runOnJS(logLazy)(itemIdValue.value, 'handleGestureEnd', { clearActive: true });
			}
			activeHoldMessageIdShared.value = null;
		}
		context.value.didMeasureLayout = false;
		isActivating.value = false;
		const activateOnVal = activateOnValue.value;
		const isHoldVal = !activateOnVal || activateOnVal === 'hold';
		if (isHoldVal) {
			scaleBack();
		}
	};

	const handleOverlayTap = () => {
		'worklet';
		if (closeOnTapValue.value) state.value = CONTEXT_MENU_STATE.END;
	};

	const longPressGesture = Gesture.LongPress()
		.minDuration(longPressMinDurationMs)
		.shouldCancelWhenOutside(false)
		.maxDistance(10)
		.onTouchesDown((event: any, gestureState: any) => {
			'worklet';
			const touch = event.allTouches[0];
			if (touch) {
				const myId = itemIdValue.value;
				if (activeHoldMessageIdShared) {
					activeHoldMessageIdShared.value = myId;
					runOnJS(logLazy)(myId, 'onTouchesDown', { activeSet: myId });
				}
				const isChild = longPressMinDurationMs <= 30;
				const currentState = state.value;
				const currentIsActive = isActive.value;

				if (currentState === CONTEXT_MENU_STATE.ACTIVE && !currentIsActive) {
					gestureState.fail();
					return;
				}

				if (isChild && !currentIsActive) {
					state.value = CONTEXT_MENU_STATE.ACTIVE;
					isActive.value = true;
				}
			}
		})
		.onTouchesMove((event: any, gestureState: any) => {
			'worklet';
			const touch = event.allTouches[0];
			if (touch) {
				if (activeHoldMessageIdShared && itemIdValue.value !== activeHoldMessageIdShared.value) {
					gestureState.fail();
					return;
				}
				const currentState = state.value;
				const currentIsActive = isActive.value;
				const willFail = currentState === CONTEXT_MENU_STATE.ACTIVE && !currentIsActive;
				if (willFail) {
					gestureState.fail();
				}
			}
		})
		.onBegin(() => {
			'worklet';
			const myId = itemIdValue.value;
			if (activeHoldMessageIdShared) {
				activeHoldMessageIdShared.value = myId;
				runOnJS(logLazy)(myId, 'onBegin', { activeSet: myId });
			}
			const isChild = longPressMinDurationMs <= 30;

			if (state.value === CONTEXT_MENU_STATE.ACTIVE && !isActive.value) {
				return;
			}

			if (isChild && !isActive.value) {
				state.value = CONTEXT_MENU_STATE.ACTIVE;
				isActive.value = true;
			}
		})
		.onStart(() => {
			'worklet';
			const myId = itemIdValue.value;
			const activeVal = activeHoldMessageIdShared ? activeHoldMessageIdShared.value : null;
			const pass = !activeHoldMessageIdShared || myId === activeVal;
			if (activeHoldMessageIdShared && !pass) {
				runOnJS(logLazy)(myId, 'onStart:SKIP', { activeVal, reason: 'idMismatch' });
				return;
			}
			if (DEBUG_HOLD_LAZY && activeHoldMessageIdShared) {
				runOnJS(logLazy)(myId, 'onStart:OK', { activeVal });
			}
			const currentState = state.value;
			const currentIsActive = isActive.value;
			runOnJS(logTiming)(key, 'onStart', { state: currentState, isActive: currentIsActive });

			if (currentState === CONTEXT_MENU_STATE.ACTIVE && !currentIsActive) {
				return;
			}

			const stateBeforeCall = state.value;
			if (stateBeforeCall === CONTEXT_MENU_STATE.ACTIVE && !isActive.value) {
				return;
			}

			handleGestureActive();
		})
		.onEnd(() => {
			'worklet';
			handleGestureEnd();
		});

	const tapGesture = Gesture.Tap()
		.numberOfTaps(activateOn === 'double-tap' ? 2 : 1)
		.onTouchesDown((event: any, gestureState: any) => {
			'worklet';
			if (state.value === CONTEXT_MENU_STATE.ACTIVE && !isActive.value) {
				gestureState.fail();
				return;
			}
		})
		.onTouchesMove((event: any, gestureState: any) => {
			'worklet';
			if (state.value === CONTEXT_MENU_STATE.ACTIVE && !isActive.value) {
				gestureState.fail();
			}
		})
		.onStart(() => {
			'worklet';
			if (state.value === CONTEXT_MENU_STATE.ACTIVE && !isActive.value) {
				return;
			}
			handleGestureActive();
		})
		.onEnd(() => {
			'worklet';
			handleGestureEnd();
		});

	const overlayTapGesture = Gesture.Tap()
		.onStart(() => {
			'worklet';
			handleOverlayTap();
		});

	const mainGesture = isHold ? longPressGesture : tapGesture;

	const animatedContainerStyle = useAnimatedStyle(() => {
		const animateOpacity = () =>
			withDelay(HOLD_ITEM_TRANSFORM_DURATION, withTiming(1, { duration: 0 }));

		return {
			opacity: isActive.value ? 0 : animateOpacity(),
			transform: [
				{
					scale: isActive.value
						? withTiming(1, { duration: HOLD_ITEM_TRANSFORM_DURATION })
						: itemScale.value,
				},
			],
		};
	});
	const containerStyle = React.useMemo(
		() => [containerStyles, animatedContainerStyle],
		[containerStyles, animatedContainerStyle]
	);

	const animatedPortalStyle = useAnimatedStyle(() => {
		const animateOpacity = () =>
			withDelay(HOLD_ITEM_TRANSFORM_DURATION, withTiming(0, { duration: 0 }));

		let tY = calculateTransformValue();
		const transformAnimation = () =>
			disableMoveValue.value
				? 0
				: isActive.value
					? withSpring(tY, SPRING_CONFIGURATION)
					: withTiming(-0.1, { duration: HOLD_ITEM_TRANSFORM_DURATION });

		return {
			zIndex: 10000,
			elevation: 10000,
			position: 'absolute',
			top: itemRectY.value,
			left: itemRectX.value,
			width: itemRectWidth.value,
			height: itemRectHeight.value,
			opacity: isActive.value ? 1 : animateOpacity(),
			transform: [
				{
					translateY: transformAnimation(),
				},
				{
					scale: isActive.value
						? withTiming(1, { duration: HOLD_ITEM_TRANSFORM_DURATION })
						: itemScale.value,
				},
			],
		};
	});
	const portalContainerStyle = useMemo(
		() => [styles.holdItem, animatedPortalStyle],
		[animatedPortalStyle]
	);

	const animatedPortalProps = useAnimatedProps<ViewProps>(() => ({
		pointerEvents: isActive.value ? 'auto' : 'none',
	}));

	useAnimatedReaction(
		() => ({ state: state.value, isActive: isActive.value }),
		({ state: _state, isActive: _isActive }) => {
			if (_state === CONTEXT_MENU_STATE.END && _isActive) {
				runOnJS(logTiming)(key, 'stateEND', {});
				isActive.value = false;
			}
		}
	);

	const PortalOverlay = useMemo(() => {
		return () => (
			<GestureDetector gesture={overlayTapGesture}>
				<Animated.View style={styles.portalOverlay} />
			</GestureDetector>
		);
	}, [overlayTapGesture]);

	const Component = text ? Animated.Text : Animated.View;

	return (
		<>
			<GestureDetector gesture={mainGesture}>
				<Component ref={containerRef} style={containerStyle}>
					{children}
				</Component>
			</GestureDetector>

			<Portal key={key} name={key}>
				<Animated.View
					key={key}
					style={portalContainerStyle}
					animatedProps={animatedPortalProps}
				>
					<PortalOverlay />
					{children}
				</Animated.View>
			</Portal>
		</>
	);
};

const HoldItem = memo(HoldItemComponent);

export default HoldItem;

