import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Box, MainText } from '@core/ui';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { changeRgbA } from '@lib/theme';
import { themeStore } from 'src/modules/theme/stores';
import holdMenuMenuStyles from '@core/ui/HoldMenu/components/menu/styles';
import { observer } from 'mobx-react-lite';

export type StickerPreviewContextMenuItem = {
	text: string;
	icon: string;
	onPress: () => void;
	disabled?: boolean;
};

type StickerPreviewContextMenuProps = {
	visible: boolean;
	containerStyle: StyleProp<ViewStyle>;
	width: number;
	items: StickerPreviewContextMenuItem[];
};

export const StickerPreviewContextMenu = observer(({
	visible,
	containerStyle,
	width,
	items,
}: StickerPreviewContextMenuProps) => {
	const { currentTheme, getContextMenuBg, contextMenuBlurIntensity } = themeStore;

	if (!visible || items.length === 0) return null;

	const containerStyleWithWidth = [
		holdMenuMenuStyles.menuContainer,
		{ width },
		containerStyle,
	];

	return (
		<Animated.View style={containerStyleWithWidth} pointerEvents="auto">
			<BlurView
				intensity={contextMenuBlurIntensity}
				style={{ backgroundColor: getContextMenuBg(), overflow: 'hidden' as const }}
			>
				{items.map((item, index) => {
					const isLast = index === items.length - 1;
					const color = item.disabled ? changeRgbA(currentTheme.text_100, 0.5) : currentTheme.text_100;
					return (
						<Pressable
							key={`${item.text}-${index}`}
							onPress={item.onPress}
							disabled={item.disabled}
							style={({ pressed }) => [
								holdMenuMenuStyles.menuItem,
								{
									borderBottomWidth: isLast ? 0 : 0.5,
									borderBottomColor: currentTheme.border_100,
									backgroundColor: pressed ? 'rgba(100, 100, 100, 0.15)' : 'transparent',
								},
							]}
						>
							<Box height="100%" justify="center" flex={1}>
								<MainText color={color} numberOfLines={1}>
									{item.text}
								</MainText>
							</Box>
							<Box height="100%" width={20} align="center" justify="center">
								<MaterialIcons name={item.icon as any} size={20} color={color} />
							</Box>
						</Pressable>
					);
				})}
			</BlurView>
		</Animated.View>
	);
});
