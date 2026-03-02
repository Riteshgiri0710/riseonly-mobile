import { ArrowDownIcon } from '@icons/Ui/ArrowDownIcon';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

interface ScrollToBottomButtonProps {
	visible: boolean;
	onPress: () => void;
	bottomOffset?: number;
	unreadCount?: number;
	bgColor?: string;
	borderColor?: string;
	primaryColor?: string;
}

const ScrollToBottomButtonComponent = ({
	visible,
	onPress,
	bottomOffset = 80,
	unreadCount = 0,
	bgColor = '#ffffff',
	borderColor = '#e0e0e0',
	primaryColor = '#007AFF',
}: ScrollToBottomButtonProps) => {
	const visibilityProgress = useSharedValue(visible ? 1 : 0);
	const prevVisibleRef = useRef(visible);

	useEffect(() => {
		if (prevVisibleRef.current !== visible) {
			prevVisibleRef.current = visible;
			visibilityProgress.value = withTiming(visible ? 1 : 0, {
				duration: 80,
			});
		}
	}, [visible, visibilityProgress]);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			opacity: visibilityProgress.value,
		};
	}, []);

	const containerStyle = useMemo(() => [
		styles.container,
		{
			backgroundColor: bgColor,
			bottom: bottomOffset,
			borderColor: borderColor,
			borderWidth: 1,
		},
	], [bgColor, borderColor, bottomOffset]);

	const badgeStyle = useMemo(() => [
		styles.badge,
		{ backgroundColor: primaryColor }
	], [primaryColor]);

	const badgeText = useMemo(() => unreadCount > 99 ? '99+' : unreadCount, [unreadCount]);

	const handlePress = useCallback(() => {
		if (visible) {
			onPress();
		}
	}, [onPress, visible]);

	return (
		<Animated.View style={[containerStyle, animatedStyle]} pointerEvents={visible ? 'auto' : 'none'}>
			<TouchableOpacity
				onPress={handlePress}
				style={styles.button}
				activeOpacity={0.7}
				disabled={!visible}
			>
				<ArrowDownIcon width={10} height={20} />
				{unreadCount > 0 && (
					<View style={badgeStyle}>
						<Text style={styles.badgeText}>{badgeText}</Text>
					</View>
				)}
			</TouchableOpacity>
		</Animated.View>
	);
};

const arePropsEqual = (prevProps: ScrollToBottomButtonProps, nextProps: ScrollToBottomButtonProps) => {
	return (
		prevProps.visible === nextProps.visible &&
		prevProps.bottomOffset === nextProps.bottomOffset &&
		prevProps.unreadCount === nextProps.unreadCount &&
		prevProps.onPress === nextProps.onPress &&
		prevProps.bgColor === nextProps.bgColor &&
		prevProps.borderColor === nextProps.borderColor &&
		prevProps.primaryColor === nextProps.primaryColor
	);
};

export const ScrollToBottomButton = memo(ScrollToBottomButtonComponent, arePropsEqual);

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		right: 10,
		width: 40,
		height: 40,
		borderRadius: 1000,
		justifyContent: 'center',
		alignItems: 'center',
		shadowOffset: {
			width: 0,
			height: 2,
		},
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
	},
	badgeText: {
		color: 'white',
		fontSize: 10,
		fontWeight: 'bold',
	},
});
