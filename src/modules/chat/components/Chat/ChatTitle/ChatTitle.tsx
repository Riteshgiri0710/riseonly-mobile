import { Box, MainText, UserNameAndBadgeUi } from '@core/ui';
import { ChannelIcon } from '@icons/MainPage/Chats/ChannelIcon';
import { GroupIcon } from '@icons/MainPage/Chats/GroupIcon';
import { FavIcon } from '@icons/MainPage/Posts/FavIcon';
import { ChatInfo } from '@modules/chat/stores/chats';
import { useTranslation } from 'react-i18next';

export const ChatTitle = ({
	chat,
	previewUser,
	favPx = 17,
	titlePx,
	usernamePx,
	numberOfLines = 1,
	title,
	fontWeight = "bold",
	iconSize = 15,
	color,
	iconColor
}: ChatTitleProps) => {
	const { t } = useTranslation();

	const chatIcon = {
		"GROUP": <GroupIcon size={iconSize} color={iconColor} />,
		"CHANNEL": <ChannelIcon size={iconSize} color={iconColor} />,
		"FAVOURITES": <FavIcon size={iconSize} color={iconColor} />,
		"PRIVATE": null,
	};

	return (
		<Box
			fD='row'
			align='center'
			gap={6}
		>
			<Box
				flexShrink={1}
				minWidth={0}
			>
				{chat?.type === "FAVOURITES" ? (
					<MainText
						px={favPx}
						numberOfLines={numberOfLines}
						fontWeight={fontWeight}
						color={color}
					>
						{t("chats_favourites")}
					</MainText>
				) : chat?.type === "PRIVATE" && !previewUser ? (
					<MainText
						px={titlePx}
						numberOfLines={numberOfLines}
						color={color}
					>
						{chat?.participant?.name || ''}
					</MainText>
				) : (chat?.type === "GROUP" || chat?.type === "CHANNEL") ? (
					<MainText
						px={titlePx}
						numberOfLines={numberOfLines}
						color={color}
					>
						{title || chat?.title || ''}
					</MainText>
				) : (
					<UserNameAndBadgeUi
						user={previewUser || chat?.participant}
						px={usernamePx}
					/>
				)}
			</Box>

			{chatIcon[chat?.type || "PRIVATE"]}
		</Box>
	);
};

interface ChatTitleProps {
	chat?: ChatInfo | null;
	title?: string;
	previewUser?: any;
	favPx?: number;
	titlePx?: number;
	usernamePx?: number;
	fontWeight?: string;
	iconSize?: number;
	numberOfLines?: number;
	color?: string;
	iconColor?: string;
}