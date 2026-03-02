import { Box, CleverImage, MainText } from '@core/ui';
import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { themeStore } from 'src/modules/theme/stores';
import { defaultNotifierImage } from './NotifierContext';
import { NotificationWithId } from './types';
import { darkenRGBA } from '@lib/theme';

const FADE_IN_MS = 220;
const FADE_OUT_MS = 200;

interface BottomNotificationItemProps {
	notification: NotificationWithId;
	onHide: () => void;
}

export function BottomNotificationItem({ notification, onHide }: BottomNotificationItemProps) {
	const { currentTheme } = themeStore;
	const insets = useSafeAreaInsets();
	const opacity = useRef(new Animated.Value(0)).current;
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const hideWithAnimation = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		Animated.timing(opacity, {
			toValue: 0,
			duration: FADE_OUT_MS,
			useNativeDriver: true,
		}).start(({ finished }) => {
			if (finished) onHide();
		});
	}, [onHide, opacity]);

	useEffect(() => {
		Animated.timing(opacity, {
			toValue: 1,
			duration: FADE_IN_MS,
			useNativeDriver: true,
		}).start();

		const duration = notification.duration ?? 3500;
		if (duration > 0) {
			timeoutRef.current = setTimeout(hideWithAnimation, duration);
		}
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, [hideWithAnimation, notification.duration, opacity]);

	const handlePress = useCallback(() => {
		if (notification.onPress) notification.onPress();
		if (notification.hideOnPress !== false) hideWithAnimation();
	}, [notification.onPress, notification.hideOnPress, hideWithAnimation]);

	const imageSource = notification.componentProps?.imageSource ?? defaultNotifierImage;

	return (
		<Animated.View
			style={[s.container, { paddingBottom: insets.bottom + 12, opacity }]}
		>
			<Pressable onPress={handlePress} style={s.pressable}>
				<Box
					style={[
						s.box,
						{
							backgroundColor: darkenRGBA(currentTheme.bg_300 as string, 0.2),
							shadowColor: currentTheme.border_100,
						},
					]}
				>
					<View style={s.content}>
						{imageSource && (
							<CleverImage
								source={imageSource}
								style={[
									s.avatar,
									{
										width: 34,
										height: 34,
									}
								]}
							/>
						)}
						<View style={s.textWrap}>
							{notification.description && (
								<MainText
									px={14}
									numberOfLines={2}
								>
									{notification.description}
								</MainText>
							)}
						</View>
					</View>
				</Box>
			</Pressable>
		</Animated.View>
	);
}

const s = StyleSheet.create({
	container: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		alignItems: 'center',
	},
	pressable: {
		width: '100%',
		maxWidth: "88%",
		alignSelf: 'center',
		alignItems: 'center',
	},
	box: {
		borderRadius: 20,
		paddingVertical: 7,
		paddingHorizontal: 10,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.14,
		shadowRadius: 10,
		elevation: 8,
		width: '100%',
	},
	content: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 7,
	},
	avatar: {
		borderRadius: 9999,
	},
	textWrap: {
		flex: 1,
		minWidth: 0,
	},
});
