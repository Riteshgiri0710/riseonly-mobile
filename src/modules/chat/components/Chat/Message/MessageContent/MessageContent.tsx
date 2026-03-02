import { Box, RenderFormattedText, SecondaryText, UserNameAndBadgeUi } from '@core/ui';
import { ReadedIcon } from '@icons/MainPage/Chats/ReadedIcon';
import { UnreadedIcon } from '@icons/MainPage/Chats/UnreadedIcon';
import { WatchIcon } from '@icons/MainPage/Chats/WatchIcon';
import { formatTimeDate, parseTimestamp } from '@lib/date';
import { changeRgbA, getUserColorInChat, gradientFromColor } from '@lib/theme';
import { ChatType, chatsInteractionsStore } from '@modules/chat/stores/chats';
import { GetMessageMessage } from '@modules/chat/stores/message';
import { themeStore } from '@modules/theme/stores';
import { profileStore } from '@modules/user/stores/profile';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ReplyToMessage } from './ReplyToMessage/ReplyToMessage';
import { LinkPreview } from './LinkPreview/LinkPreview';
import { MediaImages } from './MediaImages/MediaImages';
import { StickerMessage } from './StickerMessage/StickerMessage';
import { RootStackParamList } from '@app/router';
import { MessageReactions } from './MessageReactions/MessageReactions';
import { MessageListConfig } from '@core/config/const';
import { BlurView } from 'expo-blur';

interface MessageContentProps {
	message: GetMessageMessage;
	chatType: ChatType;
	skipWrapper?: boolean;
	hideUsername?: boolean;
	params: RootStackParamList['Chat'];
	chatEnterKey?: number;
	messageListConfig?: MessageListConfig;
}

export const MessageContent = observer(({
	message,
	chatType,
	skipWrapper = false,
	hideUsername = false,
	params,
	chatEnterKey,
	messageListConfig: config,
}: MessageContentProps) => {
	const { t } = useTranslation();
	const { currentTheme } = themeStore;
	const { profile } = profileStore;
	const { selectedChat } = chatsInteractionsStore;

	const formattedTime = useMemo(() =>
		formatTimeDate(parseTimestamp(message.created_at).toISOString()),
		[message.created_at]
	);

	const editDate = (message as { edit_date?: number; }).edit_date;
	const isEdited = editDate != null && editDate > 0;

	const isYou = (chatType === "CHANNEL") ? false : (message?.sender?.id === profile?.id);
	const paddingHorizontal = 10;
	const paddingVertical = 6;

	const showUsernameUi = !hideUsername && (config?.showUsername ?? true);
	const showReplyToUi = (config?.showReplyTo ?? true) && message.reply_to;
	const showLinkPreviewUi = (config?.showReplyTo ?? true) && message.link_preview;
	const showMediaUi = config?.showMedia ?? true;
	const showStickerUi = message.content_type === 'sticker';
	const showReactionsUi = (config?.showReactions ?? true) && message.has_reactions;
	const showTimeUi = config?.showTime ?? true;
	const showReadStatusUi = (config?.showReadStatus ?? true) && isYou;

	const MessageInfoComponent = showStickerUi ? BlurView : Box;

	const content = (
		<>
			<Box
				style={s.msgContainer}
			>
				{showUsernameUi && !showStickerUi && (
					<Box
						style={{
							paddingHorizontal,
							paddingTop: paddingVertical,
						}}
					>
						<UserNameAndBadgeUi
							user={message.sender}
							userNameColor={getUserColorInChat(chatType, message.chat_id, message?.sender?.id)}
							size={16}
							onlyUserName={chatType === "CHANNEL"}
							customName={chatType === "CHANNEL" ? selectedChat?.title : undefined}
							contentType={message.content_type}
						/>
					</Box>
				)}

				{showReplyToUi && (
					<Box
						width={"100%"}
						style={{
							paddingHorizontal,
							paddingBottom: paddingVertical - 1
						}}
					>
						<ReplyToMessage
							message={message}
							chatId={message.chat_id}
							params={params}
						/>
					</Box>
				)}

				{showMediaUi && showStickerUi && (
					<Box style={s.imageContainer}>
						<StickerMessage message={message} />
					</Box>
				)}

				{showMediaUi && !showStickerUi && (
					<Box
						style={s.imageContainer}
					>
						<MediaImages
							message={message}
						/>
					</Box>
				)}

				<Box
					style={[
						s.msgContent,
						{
							paddingHorizontal,
							paddingBottom: paddingVertical,
							paddingTop: showUsernameUi ? 0 : paddingVertical
						}
					]}
					width={"100%"}
				>
					<Box
						style={[
							s.textWrapper,
							!showReactionsUi && {
								flexDirection: 'row',
								alignItems: 'flex-end',
							}
						]}
						flexShrink={1}
						minWidth={0}
					>
						<Box
							gap={4}
							flexShrink={1}
							minWidth={0}
						>
							{!showStickerUi ? (
								<RenderFormattedText
									textStyle={s.messageText}
									text={message.content}
									isMy={isYou}
								/>
							) : null}
						</Box>

						<Box
							fD='row'
							gap={3}
						>
							{showReactionsUi && (
								<MessageReactions message={message} chatEnterKey={chatEnterKey} />
							)}

							{showTimeUi && (
								<SecondaryText
									style={s.timeSpacer}
								>
									{'  '}{isEdited ? `${t('message_edited')} ${formattedTime}` : formattedTime}{''}
								</SecondaryText>
							)}
						</Box>
					</Box>

					<MessageInfoComponent
						intensity={15}
						style={[
							hideUsername ? s.msgInfoRight : s.msgInfo,
							!showStickerUi && { paddingBottom: 4, paddingRight: isYou ? 8 : 11 },
							showStickerUi && {
								backgroundColor: changeRgbA(currentTheme.bg_100, "0.6"),
								borderRadius: 1000,
								overflow: "hidden",
								alignItems: "center",
								justifyContent: "center",
								paddingHorizontal: 6,
								paddingVertical: 2
							}
						]}
					>
						{showTimeUi && (
							<SecondaryText px={9}>
								{isEdited ? `${t('message_edited')} ${formattedTime}` : formattedTime}
							</SecondaryText>
						)}

						{showReadStatusUi && (
							<Box
								style={[
									hideUsername ? { paddingTop: 2 } : {
										position: 'absolute',
										bottom: -2,
										right: -2,
									},
								]}
							>
								{message?.isTemp ? (
									<WatchIcon
										size={8}
										color={currentTheme.secondary_100}
									/>
								) : selectedChat?.type === "FAVOURITES" || message.is_read ? (
									<ReadedIcon
										size={12.5}
										color={currentTheme.text_100}
									/>
								) : (
									<UnreadedIcon
										size={8}
										color={currentTheme.text_100}
									/>
								)}
							</Box>
						)}
					</MessageInfoComponent>
				</Box>

				{showLinkPreviewUi && (
					<Box
						width={"100%"}
						style={{
							paddingHorizontal,
							paddingBottom: paddingVertical + 3
						}}
					>
						<LinkPreview
							message={message}
							chatId={message.chat_id}
							params={params}
						/>
					</Box>
				)}
			</Box>
		</>
	);

	if (skipWrapper) {
		return content;
	}

	const isSticker = message.content_type === 'sticker';
	return (
		<View style={s.right}>
			<View
				style={[
					s.msg,
					isSticker ? { backgroundColor: 'transparent' } : { backgroundColor: gradientFromColor(currentTheme.bg_200) },
					!isYou && !isSticker && { borderBottomRightRadius: 20 }
				]}
			>
				{content}
			</View>
		</View>
	);
});

const s = StyleSheet.create({
	imageContainer: {},
	textWrapper: {
		marginRight: 10,
	},
	messageText: {
		fontSize: 16,
		lineHeight: 21,
	},
	timeSpacer: {
		opacity: 0,
		fontSize: 9,
		lineHeight: 16
	},
	msgInfo: {
		alignItems: "center",
		position: "absolute",
		bottom: 0,
		right: 0
	},
	msgInfoRight: {
		flexDirection: "row",
		gap: 3,
		alignItems: "center",
		position: "absolute",
		bottom: 0,
		right: 0
	},
	msgContent: {
		paddingHorizontal: 0,
		position: "relative",
	},
	msg: {
		maxWidth: 280,
		position: "relative",
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		overflow: "hidden"
	},
	msgContainer: {},
	right: {
		justifyContent: "flex-end",
		overflow: "visible",
		position: "relative",
	},
});
