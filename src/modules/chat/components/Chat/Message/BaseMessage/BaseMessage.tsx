import { CheckboxUi, PressableUi } from '@core/ui';
import { checker } from '@lib/helpers';
import { haptics } from '@utils/haptics';
import React, { memo, useCallback } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	runOnJS,
	useAnimatedReaction,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { messageInteractionsStore } from 'src/modules/chat/stores/message';
import { GetMessageMessage } from 'src/modules/chat/stores/message/message-actions/types';
import { isSelectingMessagesSharedValue } from 'src/modules/chat/stores/message/message-interactions/message-interactions';

const MessageCheckbox = ({ isChecked, onPress }: { isChecked: boolean; onPress: () => void; }) => (
	<View style={s.checkboxContainer}>
		<CheckboxUi
			isChecked={isChecked}
			onPress={onPress}
			size={25}
		/>
	</View>
);

interface BaseMessageProps {
	message?: GetMessageMessage | null;
	style?: StyleProp<ViewStyle>;
	onLongPress: () => void;
	onPressIn: (isSender: boolean) => void;
	onStickerTap?: () => void;
	isSender: boolean;
	children: React.ReactNode;
	wrapperStyle?: StyleProp<ViewStyle>;
	pressableStyle?: StyleProp<ViewStyle>;
	longPressScale?: number;
	opacity?: number;
	disableInteractions?: boolean;
	showCheckbox?: boolean;
	simple?: boolean;
	isSelected?: boolean;
	isSelectionMode?: boolean;
}


const SPRING_CONFIG = {
	damping: 25,
	stiffness: 400,
	mass: 0.5,
};

const BaseMessageComponent = ({
	message,
	style = {},
	onLongPress,
	onPressIn,
	onStickerTap,
	isSender,
	children,
	wrapperStyle,
	pressableStyle,
	longPressScale = 0.935,
	opacity = 1,
	disableInteractions = false,
	showCheckbox = false,
	simple = false,
	isSelected: isSelectedProp = false,
	isSelectionMode: isSelectionModeProp = false,
}: BaseMessageProps) => {
	const { toggleMessageSelection, replyMessageHandler } = messageInteractionsStore;

	const contentTranslateX = useSharedValue(0);

	const isSelectingMode = useDerivedValue(() => {
		'worklet';
		if (isSelectingMessagesSharedValue) {
			return isSelectingMessagesSharedValue.value;
		}
		return false;
	}, []);

	useAnimatedReaction(
		() => isSelectingMode.value,
		(isSelecting) => {
			contentTranslateX.value = withTiming(isSelecting ? 5 : 0, {
				duration: 200,
			});
		}
	);

	const contentAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: contentTranslateX.value }],
		};
	});

	const handleToggleSelection = useCallback(() => {
		if (message) {
			toggleMessageSelection(message.id);
		}
	}, [message, toggleMessageSelection]);

	const handlePressIn = useCallback(() => {
		if (!disableInteractions) {
			onPressIn(isSender);
		}
	}, [onPressIn, isSender, disableInteractions]);

	const handlePress = useCallback(() => {
		if (onStickerTap) {
			onStickerTap();
		} else {
			handlePressIn();
		}
	}, [onStickerTap, handlePressIn]);

	const translateX = useSharedValue(0);
	const swipeThreshold = 50;
	const maxSwipeDistance = 80;
	const startX = useSharedValue(0);
	const startY = useSharedValue(0);

	const maxProgress = useSharedValue(0);
	const hasTriggeredHaptic = useSharedValue(false);
	const reachedMaximum = useSharedValue(false);
	const returnedAfterMax = useSharedValue(false);

	const triggerHapticSuccess = useCallback(() => {
		if (!hasTriggeredHaptic.value) {
			hasTriggeredHaptic.value = true;
			haptics.success();
		}
	}, []);

	const handleReply = useCallback(() => {
		checker(message, "handleReply: message is not defined");
		replyMessageHandler(message);
	}, []);

	const swipeGesture = Gesture.Pan()
		.manualActivation(true)
		.onTouchesDown((event) => {
			'worklet';
			const touch = event.allTouches[0];
			if (touch) {
				startX.value = touch.x;
				startY.value = touch.y;
				maxProgress.value = 0;
				hasTriggeredHaptic.value = false;
				reachedMaximum.value = false;
				returnedAfterMax.value = false;
			}
		})
		.onTouchesMove((event, state) => {
			'worklet';
			const touch = event.allTouches[0];
			if (!touch) return;

			const deltaX = touch.x - startX.value;
			const deltaY = touch.y - startY.value;
			const absX = Math.abs(deltaX);
			const absY = Math.abs(deltaY);

			if (deltaX > 5) {
				state.fail();
				return;
			}

			if (absY > absX * 1.5 && absY > 20) {
				state.fail();
				return;
			}

			if (deltaX < -5 && absX > absY) {
				state.activate();
			}
		})
		.onUpdate((event) => {
			if (event.translationX < 0) {
				const clampedX = Math.max(event.translationX, -maxSwipeDistance);
				translateX.value = clampedX;

				const currentProgress = Math.abs(clampedX) / maxSwipeDistance;

				if (currentProgress > maxProgress.value) {
					maxProgress.value = currentProgress;
				}

				if (currentProgress >= 0.99) {
					reachedMaximum.value = true;
					if (!hasTriggeredHaptic.value) {
						runOnJS(triggerHapticSuccess)();
					}
				}

				if (reachedMaximum.value && currentProgress < 0.99) {
					returnedAfterMax.value = true;
				}
			}
		})
		.onEnd((event) => {
			const finalProgress = Math.abs(event.translationX) / maxSwipeDistance;
			const shouldShowReply = (event.translationX < -swipeThreshold || finalProgress >= 0.99) && !returnedAfterMax.value;

			if (shouldShowReply) {
				translateX.value = withTiming(0, { duration: 200 });
				runOnJS(handleReply)();
			} else {
				translateX.value = withSpring(0, SPRING_CONFIG);
				maxProgress.value = 0;
				hasTriggeredHaptic.value = false;
				reachedMaximum.value = false;
				returnedAfterMax.value = false;
			}
		});

	const swipeAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
	}));

	const checkboxAnimatedStyle = useAnimatedStyle(() => {
		const shouldShow = isSelectingMode.value;
		return {
			opacity: shouldShow ? 1 : 0,
			width: shouldShow ? 35 : 0,
		};
	});

	const SelectionOverlay = () => {
		if (!isSelectionModeProp) return null;
		return (
			<Pressable
				style={s.selectionOverlay}
				onPress={handleToggleSelection}
			/>
		);
	};

	const combinedOpacity = opacity * (isSelectionModeProp && isSelectedProp ? 0.5 : 1);

	if (simple) {
		return (
			<View style={[s.main, { opacity: combinedOpacity }, style]}>
				<View style={[s.wrapper, wrapperStyle]}>
					{children}
				</View>
			</View>
		);
	}

	return (
		<View style={[s.main, { opacity: combinedOpacity }, style]}>
			<View style={[s.wrapper, wrapperStyle]}>
				<Animated.View style={[s.checkboxWrapper, checkboxAnimatedStyle]}>
					<MessageCheckbox
						isChecked={isSelectedProp}
						onPress={handleToggleSelection}
					/>
				</Animated.View>

				{disableInteractions ? (
					<Animated.View style={[swipeAnimatedStyle, contentAnimatedStyle]}>
						<View style={pressableStyle}>
							<View
								collapsable={false}
								style={{ position: 'relative' }}
							>
								{children}
								<SelectionOverlay />
							</View>
						</View>
					</Animated.View>
				) : (
					<GestureDetector gesture={swipeGesture}>
						<Animated.View style={[swipeAnimatedStyle, contentAnimatedStyle]}>
							<PressableUi
								onPress={handlePress}
								onLongPress={onLongPress}
								style={pressableStyle}
								longPressDuration={500}
							>
								<View
									collapsable={false}
									style={{ position: 'relative' }}
									pointerEvents="box-none"
								>
									{children}
									<SelectionOverlay />
								</View>
							</PressableUi>
						</Animated.View>
					</GestureDetector>
				)}
			</View>
		</View>
	);
};

export const BaseMessage = memo(BaseMessageComponent, (prevProps, nextProps) => {
	return (
		prevProps.message?.id === nextProps.message?.id &&
		prevProps.message?.content === nextProps.message?.content &&
		prevProps.isSender === nextProps.isSender &&
		prevProps.showCheckbox === nextProps.showCheckbox &&
		prevProps.disableInteractions === nextProps.disableInteractions &&
		prevProps.opacity === nextProps.opacity &&
		prevProps.message?.has_reactions === nextProps.message?.has_reactions &&
		prevProps.message?.reactions === nextProps.message?.reactions &&
		prevProps.message?.reacted_by === nextProps.message?.reacted_by &&
		prevProps.simple === nextProps.simple &&
		prevProps.onStickerTap === nextProps.onStickerTap &&
		prevProps.isSelected === nextProps.isSelected &&
		prevProps.isSelectionMode === nextProps.isSelectionMode
	);
});

const s = StyleSheet.create({
	main: {
		overflow: "visible",
		position: "relative",
	},
	wrapper: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 5,
		position: "relative",
		overflow: "visible",
		paddingLeft: 0,
	},
	checkboxContainer: {
		width: 35,
		height: 35,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
	},
	checkboxWrapper: {
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden',
	},
	selectionOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 10,
	},
	filesContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 8,
	},
	fileItem: {
		width: 100,
		height: 100,
		borderRadius: 8,
		overflow: 'hidden',
	},
	fileImage: {
		width: '100%',
		height: '100%',
	},
	fileUploading: {
		width: '100%',
		height: '100%',
		backgroundColor: '#f0f0f0',
		justifyContent: 'center',
		alignItems: 'center',
	},
	fileImagePlaceholder: {
		width: '100%',
		height: '100%',
		backgroundColor: '#e0e0e0',
		justifyContent: 'center',
		alignItems: 'center',
	},
	fileProgressText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#666',
	},
	progressBarContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: 4,
		backgroundColor: 'rgba(0,0,0,0.1)',
	},
	progressBar: {
		height: '100%',
		backgroundColor: '#007AFF',
	},
	fileError: {
		width: '100%',
		height: '100%',
		backgroundColor: '#ffebee',
		justifyContent: 'center',
		alignItems: 'center',
	},
	fileErrorText: {
		fontSize: 24,
	},
	fileErrorMessage: {
		position: 'absolute',
		bottom: 4,
		fontSize: 10,
		color: '#d32f2f',
		textAlign: 'center',
		paddingHorizontal: 4,
	},
	tempBadge: {
		position: 'absolute',
		top: -8,
		right: -8,
		backgroundColor: '#FFA500',
		borderRadius: 12,
		width: 24,
		height: 24,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	tempBadgeText: {
		fontSize: 14,
	},
});
