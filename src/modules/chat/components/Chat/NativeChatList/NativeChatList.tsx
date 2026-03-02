import { formatTimeDate, parseTimestamp } from '@lib/date';
import { showNativeContextMenu } from '@lib/native-modules/SaiContextMenu/SaiContextMenu';
import { gradientFromColor } from '@lib/theme';
import { FlashList } from "@shopify/flash-list";
import { Canvas, RoundedRect } from "@shopify/react-native-skia";
import React, { useMemo, useRef } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { themeStore } from 'src/modules/theme/stores';

export interface NativeChatMessage {
	id: string;
	content: string;
	senderId: string;
	senderName?: string;
	createdAt: number;
	isMyMessage: boolean;
	status?: 'pending' | 'sent' | 'read' | 'failed';
}

interface NativeChatListProps {
	messages: NativeChatMessage[];
	onMessagePress?: (id: string) => void;
	style?: any;
}

const { width } = Dimensions.get('window');
const BUBBLE_MAX_WIDTH = 280;

export const NativeChatList = ({ messages, style }: NativeChatListProps) => {
	const { currentTheme } = themeStore;

	const renderItem = ({ item }: { item: NativeChatMessage; }) => {
		return <SkiaMessageCell item={item} theme={currentTheme} />;
	};

	return (
		<View style={[{ flex: 1, backgroundColor: currentTheme.bg_100 }, style]}>
			<FlashList
				data={messages}
				renderItem={renderItem}
				estimatedItemSize={80}
				keyExtractor={(item) => item.id}
				inverted
				contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 10 }}
				removeClippedSubviews={true}
			/>
		</View>
	);
};

const SkiaMessageCell = ({ item, theme }: { item: NativeChatMessage, theme: any; }) => {
	const isMe = item.isMyMessage;
	const viewRef = useRef<View>(null);

	const formattedTime = useMemo(() => {
		try {
			return formatTimeDate(parseTimestamp(item.createdAt).toISOString());
		} catch (e) {
			return "";
		}
	}, [item.createdAt]);

	const isPressed = useSharedValue(1);
	const isHidden = useSharedValue(1);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: isPressed.value }],
		opacity: isHidden.value,
	}));

	const handleLongPress = () => {
		viewRef.current?.measureInWindow((x, y, width, height) => {
			isHidden.value = 0; // Hide the original message
			showNativeContextMenu({
				targetX: x,
				targetY: y,
				targetWidth: width,
				targetHeight: height,
				message: {
					content: item.content,
					isMe: item.isMyMessage,
					senderName: item.senderName,
				},
				items: [
					{ id: 'reply', label: 'Ответить', icon: 'reply' },
					{ id: 'copy', label: 'Копировать', icon: 'copy' },
					{ id: 'edit', label: 'Изменить', icon: 'edit' },
					{ id: 'pin', label: 'Закрепить', icon: 'pin' },
					{ id: 'forward', label: 'Переслать', icon: 'forward' },
					{ id: 'delete', label: 'Удалить', icon: 'delete', isDestructive: true },
				],
				horizontalPosition: item.isMyMessage ? 'right' : 'left',
				showReactions: true,
				menuWidth: 230,
			}).then(() => {
				isHidden.value = 1; // Restore when menu closed
				isPressed.value = 1;
			});
		});
	};

	const longPressGesture = Gesture.Tap()
		.maxDuration(10000)
		.onBegin(() => {
			isPressed.value = withTiming(0.94, { duration: 400 });
		})
		.onTouchesMove((_event, state) => {
			// If moved too much, cancel
		})
		.onFinalize(() => {
			if (isHidden.value === 1) { // Only restore if menu didn't open
				isPressed.value = withSpring(1);
			}
		});

	const menuTriggerGesture = Gesture.LongPress()
		.minDuration(400)
		.onStart(() => {
			runOnJS(handleLongPress)();
		});

	const combinedGesture = Gesture.Simultaneous(longPressGesture, menuTriggerGesture);

	// Approximate height calculation for FlashList
	const textLength = item.content.length;
	const lines = Math.ceil((textLength * 8.5) / (BUBBLE_MAX_WIDTH - 24));
	const hasSenderName = !isMe && item.senderName;
	const bubbleHeight = Math.max(45, lines * 21 + 25 + (hasSenderName ? 18 : 0));
	const bubbleWidth = textLength < 25 && !hasSenderName ? Math.max(80, textLength * 9 + 45) : BUBBLE_MAX_WIDTH;

	const bubbleColor = isMe ? gradientFromColor(theme.primary_100) : theme.bg_200;

	return (
		<GestureDetector gesture={combinedGesture}>
			<Animated.View style={[{ width: '100%', minHeight: bubbleHeight + 4, alignItems: isMe ? 'flex-end' : 'flex-start', marginVertical: 1 }, animatedStyle]}>
				<View ref={viewRef} style={{ width: bubbleWidth, height: bubbleHeight, position: 'relative' }}>
					<Canvas style={StyleSheet.absoluteFill}>
						<RoundedRect
							x={0}
							y={0}
							width={bubbleWidth}
							height={bubbleHeight}
							r={20}
							color={bubbleColor}
						/>
					</Canvas>

					<View style={{ paddingHorizontal: 12, paddingVertical: 8, flex: 1 }}>
						{hasSenderName && (
							<Text style={{ color: theme.primary_100, fontSize: 13, fontWeight: '600', marginBottom: 2 }}>
								{item.senderName}
							</Text>
						)}
						<Text style={{ color: isMe ? '#FFFFFF' : theme.text_100, fontSize: 16, lineHeight: 21 }}>
							{item.content}
						</Text>

						<View style={{ alignSelf: 'flex-end', marginTop: 2 }}>
							<Text style={{ color: isMe ? 'rgba(255,255,255,0.7)' : theme.text_200, fontSize: 11 }}>
								{formattedTime}
							</Text>
						</View>
					</View>
				</View>
			</Animated.View>
		</GestureDetector>
	);
};
