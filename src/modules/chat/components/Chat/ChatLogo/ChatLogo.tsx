import { Box, MainText, UserLogo } from '@core/ui';
import { ChatFavouritesLogoIcon } from '@icons/Ui/ChatFavouritesLogoIcon';
import { getUserColorInChat } from '@lib/theme';
import { ChatInfo, ChatType } from 'src/modules/chat/stores/chats/chats-actions/types';
import { StyleProp, ViewStyle } from 'react-native';

export const ChatLogo = ({
	style,
	size = 32.5,
	iconSize = 18,
	type,
	logo,
	privateLogo,
	chat,
	isOnline
}: ChatLogoProps) => {
	return (
		<>
			{type === "FAVOURITES" ? (
				<ChatFavouritesLogoIcon
					size={size}
					iconSize={iconSize}
				/>
			) : type === "CHANNEL" || type === "GROUP" ? (
				<Box
					bgColor={getUserColorInChat(type, chat?.id)}
					width={size}
					height={size}
					bRad={1000}
					centered
					overflow="hidden"
					style={style}
				>
					<MainText
						px={size / 2}
						fontWeight="bold"
						numberOfLines={1}
					>
						{chat?.title?.slice(0, 1).toUpperCase()}
					</MainText>
				</Box>
			) : (
				<UserLogo
					source={type == "PRIVATE" ? (privateLogo || logo) : logo}
					size={size}
					style={style}
					isOnline={isOnline}
				/>
			)}
		</>
	);
};

interface ChatLogoProps {
	style?: StyleProp<ViewStyle>;
	size?: number;
	iconSize?: number;
	type?: ChatType;
	logo?: string;
	privateLogo?: string;
	isOnline?: boolean;
	chat?: ChatInfo;
}