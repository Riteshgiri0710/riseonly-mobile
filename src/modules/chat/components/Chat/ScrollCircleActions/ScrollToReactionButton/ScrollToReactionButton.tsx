import { ReactIcon } from '@animations/components/ReactIcon';
import { HeartIcon } from '@icons/MainPage/Posts/HeartIcon';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { themeStore } from 'src/modules/theme/stores';

interface ScrollToReactionButtonProps {
	visible: boolean;
	onPress: () => void;
	bottomOffset?: number;
	reactionCount?: number;
	scrollToBottomVisible?: boolean;
}

const ScrollToReactionButtonComponent = ({
	visible,
	onPress,
	bottomOffset = 170,
	reactionCount = 0,
	scrollToBottomVisible = false,
}: ScrollToReactionButtonProps) => {
	const { currentTheme } = themeStore;
	const visibilityProgress = useSharedValue(visible ? 1 : 0);
	const positionProgress = useSharedValue(scrollToBottomVisible ? 1 : 0);
	const prevVisibleRef = useRef(visible);
	const prevScrollToBottomVisibleRef = useRef(scrollToBottomVisible);

	useEffect(() => {
		if (prevVisibleRef.current !== visible) {
			prevVisibleRef.current = visible;
			visibilityProgress.value = withTiming(visible ? 1 : 0, { duration: 50 });
		}
	}, [visible, visibilityProgress]);

	useEffect(() => {
		if (prevScrollToBottomVisibleRef.current !== scrollToBottomVisible) {
			prevScrollToBottomVisibleRef.current = scrollToBottomVisible;
			positionProgress.value = scrollToBottomVisible ? 1 : 0;
		}
	}, [scrollToBottomVisible, positionProgress]);

	const animatedStyle = useAnimatedStyle(() => {
		const positionTranslateY = positionProgress.value * -50;
		return {
			opacity: visibilityProgress.value,
			transform: [{ translateY: positionTranslateY }],
		};
	}, []);

	const containerStyle = useMemo(() => [
		styles.container,
		{
			backgroundColor: currentTheme.bg_200,
			borderColor: currentTheme.border_100,
			borderWidth: 1,
			bottom: bottomOffset,
		},
	], [currentTheme.bg_200, currentTheme.border_100, bottomOffset]);

	const badgeStyle = useMemo(() => [
		styles.badge,
		{ backgroundColor: currentTheme.primary_100 },
	], [currentTheme.primary_100]);

	const badgeText = useMemo(() => reactionCount > 99 ? '99+' : reactionCount, [reactionCount]);

	const handlePress = useCallback(() => {
		if (visible) onPress();
	}, [onPress, visible]);

	return (
		<Animated.View
			style={[containerStyle, animatedStyle]}
			pointerEvents={visible ? 'auto' : 'none'}
		>
			<TouchableOpacity
				onPress={handlePress}
				style={styles.button}
				activeOpacity={0.7}
				disabled={!visible}
			>
				<HeartIcon
					size={18}
					color={'#FF3131'}
					filled={true}
				/>

				{reactionCount > 0 && (
					<View style={badgeStyle}>
						<Text style={styles.badgeText}>{badgeText}</Text>
					</View>
				)}
			</TouchableOpacity>
		</Animated.View>
	);
};

export const ScrollToReactionButton = observer(ScrollToReactionButtonComponent);

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		right: 10,
		width: 40,
		height: 40,
		borderRadius: 1000,
		justifyContent: 'center',
		alignItems: 'center',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
		zIndex: 1000,
	},
	button: {
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	badge: {
		position: 'absolute',
		top: -5,
		right: -5,
		minWidth: 18,
		height: 18,
		borderRadius: 9,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 4,
		overflow: 'visible',
		zIndex: 1001,
	},
	badgeText: {
		color: 'white',
		fontSize: 10,
		fontWeight: 'bold',
	},
});
