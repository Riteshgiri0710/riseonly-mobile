import { Box, MainText, SecondaryText } from '@core/ui';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';

import Separator from './Separator';
import styles from './styles';

import { CONTEXT_MENU_STATE } from '../../constants';
import { useInternal } from '../../hooks';
import { MenuItemProps } from './types';

type MenuItemComponentProps = {
	item: MenuItemProps;
	isLast?: boolean;
};

const MenuItem = ({ item, isLast }: MenuItemComponentProps) => {
	const { state, menuProps } = useInternal();
	const currentTheme = themeStore.currentTheme;

	if (!item || !item.text) {
		return null;
	}

	const handleOnPress = useCallback(() => {
		if (!item.isTitle && !item.isLabel) {
			const params = menuProps.value.actionParams[item.text] || [];

			if (item.onPress) {
				const onPressHandler = item.onPress;
				onPressHandler(...params);
			}

			state.value = CONTEXT_MENU_STATE.END;
		}
	}, [state, item]);

	const iconColor = item.isDestructive ? currentTheme.primary_100 : currentTheme.text_100;
	const textColor = item.isDestructive ? currentTheme.primary_100 : currentTheme.text_100;

	const renderIcon = () => {
		if (!item.icon || item.isTitle || item.isLabel) return null;

		if (typeof item.icon === 'string') {
			return (
				<MaterialIcons
					name={item.icon as any}
					size={20}
					color={iconColor}
				/>
			);
		}

		if (typeof item.icon === 'function') {
			return item.icon();
		}

		return item.icon;
	};

	if (item.isLabel) {
		return (
			<>
				<Box
					style={[
						styles.menuItemLabel,
						{
							borderBottomWidth: isLast ? 0 : 0.5,
							borderBottomColor: currentTheme.border_100,
							...(item.style as object),
						},
					]}
				>
					<SecondaryText
						numberOfLines={1}
						style={styles.menuItemLabelText}
					>
						{String(item.text || '')}
					</SecondaryText>
				</Box>
				{item.withSeparator && <Separator />}
			</>
		);
	}

	return (
		<>
			<Pressable
				onPress={handleOnPress}
				style={({ pressed }) => [
					styles.menuItem,
					{
						borderBottomWidth: isLast && !item.isBottom ? 0 : 0.5,
						borderBottomColor: currentTheme.border_100,
						backgroundColor: pressed ? 'rgba(100, 100, 100, 0.15)' : 'transparent',
						...(item.style as object),
					},
					item.isBottom && {
						borderTopWidth: 0.5,
						borderTopColor: currentTheme.border_100,
						marginTop: 5,
					}
				]}
			>
				<Box
					height={"100%"}
					justify='center'
					flex={1}
				>
					<MainText
						color={textColor}
						numberOfLines={1}
					>
						{String(item.text || '')}
					</MainText>
				</Box>

				<Box
					height={"100%"}
					width={20}
					align='center'
					justify='center'
				>
					{renderIcon()}
				</Box>
			</Pressable>
			{item.withSeparator && <Separator />}
		</>
	);
};

export default MenuItem;

