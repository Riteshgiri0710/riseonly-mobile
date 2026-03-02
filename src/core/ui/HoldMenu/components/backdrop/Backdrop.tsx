import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import { BlurView } from 'expo-blur';

// Utils
import {
	CONTEXT_MENU_STATE,
	HOLD_ITEM_TRANSFORM_DURATION,
} from '../../constants';
import { useInternal } from '../../hooks';
import { styles } from './styles';

const BackdropComponent = () => {
	const { state } = useInternal();
	const backdropOpacity = useSharedValue(0);

	useAnimatedReaction(
		() => state.value,
		(s) => {
			'worklet';
			backdropOpacity.value = withTiming(
				s === CONTEXT_MENU_STATE.ACTIVE ? 1 : 0,
				{ duration: HOLD_ITEM_TRANSFORM_DURATION }
			);
		},
		[]
	);

	const closeMenu = () => {
		setTimeout(() => {
			state.value = CONTEXT_MENU_STATE.END;
		}, 50);
	};

	const tapGesture = useMemo(
		() =>
			Gesture.Tap().onEnd(() => {
				'worklet';
				if (state.value === CONTEXT_MENU_STATE.ACTIVE) {
					state.value = CONTEXT_MENU_STATE.END;
				}
			}),
		[]
	);

	const backdropStyle = useAnimatedStyle(() => {
		'worklet';
		return { opacity: backdropOpacity.value };
	});

	const containerStyle = useAnimatedStyle(() => {
		'worklet';
		return {
			pointerEvents: state.value === CONTEXT_MENU_STATE.ACTIVE ? 'auto' : 'none',
		};
	});

	if (Platform.OS === 'android') {
		return (
			<GestureDetector gesture={tapGesture}>
				<Animated.View style={[styles.container, backdropStyle, containerStyle]}>
					<Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
						<Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
					</Animated.View>
				</Animated.View>
			</GestureDetector>
		);
	}

	return (
		<GestureDetector gesture={tapGesture}>
			<Animated.View style={[styles.container, backdropStyle, containerStyle]}>
				<BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill}>
					<Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
				</BlurView>
			</Animated.View>
		</GestureDetector>
	);
};

const Backdrop = React.memo(BackdropComponent);

export default Backdrop;

