import { Box, MainText, SecondaryText } from '@core/ui';
import { CleverImage } from '@core/ui/CleverImage/CleverImage';
import { changeRgbA, darkenRGBA, getColorInChat } from '@lib/theme';
import { ChatTypeEnum } from '@modules/chat/stores/chats';
import { GetMessageMessage } from '@modules/chat/stores/message';
import { themeStore } from '@modules/theme/stores';
import { profileStore } from '@modules/user/stores/profile';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { RootStackParamList } from '@app/router';

interface LinkPreviewProps {
	message: GetMessageMessage;
	chatId?: string;
	params: RootStackParamList['Chat'];
}

export const LinkPreview = observer(({
	message,
	chatId,
	params
}: LinkPreviewProps) => {
	const { currentTheme } = themeStore;
	const { profile } = profileStore;

	const linkPreview = message?.link_preview;
	if (!linkPreview || !chatId) return null;

	const finalColor = useMemo(() => {
		if (params.selectedChat?.type === ChatTypeEnum.CHANNEL) return getColorInChat(chatId);
		if (message?.sender?.id === profile?.id) return currentTheme.text_100;
		return getColorInChat(chatId, message?.sender?.id);
	}, [profile?.id, message?.sender?.id, params.selectedChat?.type, chatId, currentTheme.text_100]);

	const finalBgColor = useMemo(() => {
		if (params.selectedChat?.type === ChatTypeEnum.CHANNEL) return changeRgbA(getColorInChat(chatId), 0.15);
		if (message?.sender?.id === profile?.id) return darkenRGBA(currentTheme.primary_100, -0.5);
		return changeRgbA(getColorInChat(chatId, message?.sender?.id), 0.15);
	}, [profile?.id, message?.sender?.id, params.selectedChat?.type, chatId, currentTheme.primary_100]);

	const isSmall = (linkPreview.link_preview_type || 'SMALL') === 'SMALL';
	const title = linkPreview.title || '';
	const description = linkPreview.description || '';
	const imageUrl = linkPreview.image_url || '';

	const boxStyle = {
		borderLeftWidth: 3.5,
		borderLeftColor: finalColor,
		paddingHorizontal: 7,
		paddingVertical: 5,
	};

	return (
		<Box
			style={{ paddingHorizontal: 2, paddingTop: 7 }}
			width={'100%'}
		>
			<Box
				style={[boxStyle]}
				bRad={5}
				bgColor={finalBgColor}
				width={'100%'}
				fD={isSmall ? 'row' : 'column'}
			>
				{isSmall ? (
					<>
						<Box flex={1} style={{ minWidth: 0 }} gap={2}>
							{title ? (
								<MainText color={finalColor} numberOfLines={1} style={{ fontSize: 14 }}>
									{title}
								</MainText>
							) : null}
							{description ? (
								<SecondaryText numberOfLines={2} style={{ fontSize: 12 }}>
									{description}
								</SecondaryText>
							) : null}
						</Box>
						{imageUrl ? (
							<Box style={{ width: 56, height: 56, marginLeft: 8, borderRadius: 5, overflow: 'hidden' }}>
								<CleverImage
									source={{ uri: imageUrl }}
									style={{ width: 56, height: 56 }}
									resizeMode="cover"
								/>
							</Box>
						) : null}
					</>
				) : (
					<>
						{title ? (
							<MainText color={finalColor} numberOfLines={1} style={{ fontSize: 14 }}>
								{title}
							</MainText>
						) : null}
						{description ? (
							<SecondaryText numberOfLines={2} style={{ fontSize: 12, marginTop: 2 }}>
								{description}
							</SecondaryText>
						) : null}
						{imageUrl ? (
							<Box style={{ marginTop: 6, borderRadius: 5, overflow: 'hidden', maxHeight: 180 }}>
								<CleverImage
									source={{ uri: imageUrl }}
									style={{ width: '100%', aspectRatio: 1.91 }}
									resizeMode="cover"
								/>
							</Box>
						) : null}
					</>
				)}
			</Box>
		</Box>
	);
});
