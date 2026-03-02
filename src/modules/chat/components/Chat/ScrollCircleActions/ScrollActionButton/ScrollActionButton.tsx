import { chatSizes } from '@core/config/sizes';
import { observer } from 'mobx-react-lite';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { themeStore } from 'src/modules/theme/stores';
import { ScrollToBottomButton } from '../ScrollToBottomButton/ScrollToBottomButton';
import { ScrollToReactionButton } from '../ScrollToReactionButton/ScrollToReactionButton';

interface ScrollActionButtonProps {
	scrollToBottomVisible: boolean;
	scrollToMentionVisible: boolean;
	scrollToReactionVisible: boolean;
	onScrollToBottom: () => void;
	onScrollToMention: () => void;
	onScrollToReaction: () => void;
	bottomOffset?: number;
	unreadCount?: number;
	mentionCount?: number;
	reactionCount?: number;
}

const ScrollToMentionButton = ({
	visible,
	onPress,
	bottomOffset,
	mentionCount,
	scrollToBottomVisible,
	bgColor,
	borderColor,
	primaryColor,
	textColor,
}: {
	visible: boolean;
	onPress: () => void;
	bottomOffset: number;
	mentionCount: number;
	scrollToBottomVisible: boolean;
	bgColor: string;
	borderColor: string;
	primaryColor: string;
	textColor: string;
}) => {
	const visibilityProgress = useSharedValue(visible ? 1 : 0);
	const positionProgress = useSharedValue(scrollToBottomVisible ? 1 : 0);
	const prevVisibleRef = useRef(visible);
	const prevScrollToBottomVisibleRef = useRef(scrollToBottomVisible);

	useEffect(() => {
		if (prevVisibleRef.current !== visible) {
			prevVisibleRef.current = visible;
			visibilityProgress.value = withTiming(visible ? 1 : 0, {
				duration: 50,
			});
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
			backgroundColor: bgColor,
			borderColor: borderColor,
			borderWidth: 1,
			bottom: bottomOffset,
		},
	], [bgColor, borderColor, bottomOffset]);

	const badgeStyle = useMemo(() => [
		styles.badge,
		{ backgroundColor: primaryColor }
	], [primaryColor]);

	const badgeText = useMemo(() => mentionCount > 99 ? '99+' : mentionCount, [mentionCount]);

	const handlePress = useCallback(() => {
		if (visible) {
			onPress();
		}
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
				<Icon name="alternate-email" size={24} color={textColor} />
				{mentionCount > 0 && (
					<View style={badgeStyle}>
						<Text style={styles.badgeText}>{badgeText}</Text>
					</View>
				)}
			</TouchableOpacity>
		</Animated.View>
	);
};

const ScrollToMentionButtonMemo = memo(ScrollToMentionButton, (prevProps, nextProps) => {
	return (
		prevProps.visible === nextProps.visible &&
		prevProps.bottomOffset === nextProps.bottomOffset &&
		prevProps.mentionCount === nextProps.mentionCount &&
		prevProps.scrollToBottomVisible === nextProps.scrollToBottomVisible &&
		prevProps.onPress === nextProps.onPress &&
		prevProps.bgColor === nextProps.bgColor &&
		prevProps.borderColor === nextProps.borderColor &&
		prevProps.primaryColor === nextProps.primaryColor &&
		prevProps.textColor === nextProps.textColor
	);
});

export const ScrollActionButton = observer(({
	scrollToBottomVisible,
	scrollToMentionVisible,
	scrollToReactionVisible,
	onScrollToBottom,
	onScrollToMention,
	onScrollToReaction,
	bottomOffset = 80,
	unreadCount = 0,
	mentionCount = 0,
	reactionCount = 0,
}: ScrollActionButtonProps) => {
	const { currentTheme } = themeStore;

	return (
		<>
			<ScrollToBottomButton
				visible={scrollToBottomVisible}
				onPress={onScrollToBottom}
				bottomOffset={bottomOffset}
				unreadCount={unreadCount}
				bgColor={currentTheme.bg_200}
				borderColor={currentTheme.border_100}
				primaryColor={currentTheme.primary_100}
			/>
			<ScrollToMentionButtonMemo
				visible={scrollToMentionVisible && mentionCount > 0}
				onPress={onScrollToMention}
				bottomOffset={bottomOffset}
				mentionCount={mentionCount}
				scrollToBottomVisible={scrollToBottomVisible}
				bgColor={currentTheme.bg_200}
				borderColor={currentTheme.border_100}
				primaryColor={currentTheme.primary_100}
				textColor={currentTheme.text_100}
			/>
			<ScrollToReactionButton
				visible={scrollToReactionVisible && reactionCount > 0}
				onPress={onScrollToReaction}
				bottomOffset={bottomOffset + 45}
				reactionCount={reactionCount}
				scrollToBottomVisible={scrollToBottomVisible}
			/>
		</>
	);
});

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		right: 10,
		width: chatSizes.btn,
		height: chatSizes.btn,
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
		overflow: 'visible',
		zIndex: 1001,
	},
	badgeText: {
		color: 'white',
		fontSize: 10,
		fontWeight: 'bold',
	},
});