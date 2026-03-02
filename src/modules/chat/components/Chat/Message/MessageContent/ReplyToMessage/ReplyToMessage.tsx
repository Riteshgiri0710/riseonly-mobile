import { RootStackParamList } from '@app/router';
import { Box, MainText } from '@core/ui';
import { changeRgbA, darkenRGBA, getColorInChat } from '@lib/theme';
import { limitToLines, stripFormatting } from '@lib/text';
import { ChatTypeEnum } from '@modules/chat/stores/chats';
import { GetMessageMessage } from '@modules/chat/stores/message';
import { themeStore } from '@modules/theme/stores';
import { profileStore } from '@modules/user/stores/profile';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { ChatTitle } from '../../../ChatTitle/ChatTitle';

interface ReplyToMessageProps {
	message: GetMessageMessage,
	chatId?: string,
	params: RootStackParamList['Chat'];
}

export const ReplyToMessage = observer(({
	message,
	chatId,
	params
}: ReplyToMessageProps) => {
	const { currentTheme } = themeStore;
	const { profile } = profileStore;

	const replyContentPlain = useMemo(() => limitToLines(stripFormatting(message?.reply_to?.content ?? ''), 3), [message?.reply_to?.content]);

	const finalColor = useMemo(() => {
		if (params.selectedChat?.type === ChatTypeEnum.CHANNEL) return getColorInChat(chatId);
		if (message?.sender?.id === profile?.id) {
			if (message?.reply_to?.sender?.id === profile?.id) return currentTheme.text_100;
			return currentTheme.text_100;
		}
		return getColorInChat(chatId, message?.sender?.id);
	}, [profile?.id, message?.sender?.id, message?.reply_to?.sender?.id, params.selectedChat?.type, chatId, currentTheme.text_100]);

	const finalBgColor = useMemo(() => {
		if (params.selectedChat?.type === ChatTypeEnum.CHANNEL) return changeRgbA(getColorInChat(chatId), 0.15);
		if (message?.sender?.id === profile?.id) {
			if (message?.reply_to?.sender?.id === profile?.id) return darkenRGBA(currentTheme.primary_100, -0.5);
		}
		return changeRgbA(getColorInChat(chatId, message?.reply_to?.sender?.id), 0.15);
	}, [profile?.id, message?.sender?.id, message?.reply_to?.sender?.id, params.selectedChat?.type, chatId, currentTheme.primary_100]);

	if (!message || !chatId || !message?.reply_to) return null;

	return (
		<Box
			style={{
				paddingHorizontal: 2,
				paddingTop: 7,
			}}
			width={'100%'}
		>
			<Box
				style={[
					{
						borderLeftWidth: 3.5,
						borderLeftColor: finalColor,
						paddingHorizontal: 7,
						paddingVertical: 2,
					},
				]}
				bRad={5}
				bgColor={finalBgColor}
				width={'100%'}
			>
				<Box>
					{params.selectedChat?.type === ChatTypeEnum.CHANNEL ? (
						<ChatTitle
							chat={params.selectedChat}
							fontWeight="normal"
							iconSize={13}
							color={finalColor}
							iconColor={finalColor}
						/>
					) : (
						<MainText
							color={finalColor}
							numberOfLines={1}
							px={15}
						>
							{message?.reply_to?.sender?.name}
						</MainText>
					)}

					<MainText
						style={{ fontSize: 14 }}
						numberOfLines={3}
					>
						{replyContentPlain || ' '}
					</MainText>
				</Box>
			</Box>
		</Box>
	);
});
