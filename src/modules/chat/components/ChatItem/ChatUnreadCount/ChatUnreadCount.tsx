import { Box, MainText } from '@core/ui';
import { checker } from '@lib/helpers';
import { formatCommentCount } from '@lib/numbers';
import { formatNumber } from '@lib/text';
import { ChatInfo } from '@modules/chat/stores/chats';
import { themeStore } from '@modules/theme/stores';
import { Pressable, StyleProp, ViewStyle } from 'react-native';

interface ChatUnreadCountProps {
	item?: ChatInfo | null;
	styles?: StyleProp<ViewStyle>;
	icon?: React.ReactNode;
	bgColor?: string;
	count?: number;
	textColor?: string;
	size?: number;
	onPress?: () => void;
}

export const ChatUnreadCount = ({
	item,
	styles,
	icon,
	count,
	bgColor,
	textColor,
	size = 22,
	onPress,
}: ChatUnreadCountProps) => {
	const { currentTheme } = themeStore;

	checker(item, "item");

	const displayValue = count !== undefined && count !== null ? count : (item?.unread_count ?? 0);
	if (displayValue === 0 || !item) return null;

	const content = (
		<Box
			style={[
				styles,
				{ paddingHorizontal: 4 }
			]}
			bgColor={bgColor || currentTheme.btn_bg_100}
			centered
			bRad={15}
			height={size}
			minWidth={size}
		>
			{icon ? icon : (
				<MainText
					primary={!textColor}
					color={textColor}
					px={12}
					fontWeight='bold'
					numberOfLines={1}
				>
					{formatCommentCount(displayValue, null, false)}
				</MainText>
			)}
		</Box>
	);

	if (onPress) {
		return <Pressable onPress={onPress}>{content}</Pressable>;
	}
	return content;
};