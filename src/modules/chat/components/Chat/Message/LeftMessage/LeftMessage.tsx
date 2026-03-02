import { Box, UserLogo } from '@core/ui';
import { checker } from '@lib/helpers';
import { ChatType } from '@modules/chat/stores/chats';
import { messageInteractionsStore } from '@modules/chat/stores/message';
import { stickerInteractionsStore } from '@modules/sticker/stores/sticker/sticker-interactions/sticker-interactions';
import React, { memo, useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { GetMessageMessage } from 'src/modules/chat/stores/message/message-actions/types';
import { BaseMessage } from '../BaseMessage/BaseMessage';
import { MessageContent } from '../MessageContent/MessageContent';
import { RootStackParamList } from '@app/router';
import { ChatLogo } from '../../ChatLogo/ChatLogo';
import { gradientFromColor } from '@lib/theme';
import type { MessageListConfig } from '@core/config/const';

interface LeftMessageProps {
	message?: GetMessageMessage | null;
	style?: StyleProp<ViewStyle>;
	showAvatar?: boolean;
	onLongPress: () => void;
	onPressIn: (isSender: boolean) => void;
	chatType: ChatType | null | undefined;
	params: RootStackParamList['Chat'];
	chatEnterKey?: number;
	messageListConfig?: MessageListConfig;
	isSelected?: boolean;
	isSelectionMode?: boolean;
}

const LeftMessageComponent = ({
	message,
	style = {},
	showAvatar = true,
	onLongPress,
	onPressIn,
	chatType,
	params,
	chatEnterKey,
	messageListConfig: config,
	isSelected = false,
	isSelectionMode = false,
}: LeftMessageProps) => {
	checker(message, "message is required");
	checker(chatType, "chatType is required");

	useEffect(() => {
		if (!message?.is_mentioned_you) return;
		messageInteractionsStore.markMentionAsReadForMessage(message);
		const cid = message.chat_id ?? (message as { chat?: { id?: string; }; }).chat?.id;
		if (cid) messageInteractionsStore.flushMentionsReadBatch(cid);
	}, [message?.id, message?.is_mentioned_you, message?.chat_id, chatEnterKey]);

	const showAvatarUi = showAvatar && (config?.showAvatar ?? true);
	const showCheckbox = config?.showCheckbox ?? true;
	const showSwipeToReply = config?.showSwipeToReply ?? true;
	const firstMedia = message?.media_items?.[0] as { pack_id?: string; packId?: string; media_info?: { pack_id?: string; }; } | undefined;
	const stickerPackId = message?.content_type === 'sticker'
		? (firstMedia?.pack_id ?? firstMedia?.packId ?? firstMedia?.media_info?.pack_id ?? '')
		: '';
	const onStickerTap = (message?.content_type === 'sticker' && stickerPackId)
		? () => stickerInteractionsStore.openStickerPackByPackId(stickerPackId)
		: undefined;

	return (
		<BaseMessage
			message={message}
			style={[s.main, style]}
			onLongPress={onLongPress}
			onPressIn={onPressIn}
			onStickerTap={onStickerTap}
			isSender={false}
			wrapperStyle={s.wrapper}
			pressableStyle={{ width: '100%' }}
			longPressScale={0.935}
			showCheckbox={showCheckbox}
			disableInteractions={!showSwipeToReply}
			isSelected={isSelected}
			isSelectionMode={isSelectionMode}
		>
			<View
				style={s.contentRow}
			>
				<Box>
					{showAvatarUi ? (
						message?.sender ? (
							<UserLogo
								source={message?.sender?.more?.logo}
								size={35}
							/>
						) : (
							<ChatLogo
								size={35}
								type={chatType}
								chat={params.selectedChat}
							/>
						)
					) : (
						<View style={{ width: 35 }} />
					)}
				</Box>

				<MessageContent
					message={message}
					chatType={chatType}
					params={params}
					chatEnterKey={chatEnterKey}
					messageListConfig={config}
				/>
			</View>
		</BaseMessage>
	);
};

export const LeftMessage = memo(LeftMessageComponent, (prevProps, nextProps) => {
	return (
		prevProps.message?.id === nextProps.message?.id &&
		prevProps.message?.content === nextProps.message?.content &&
		prevProps.showAvatar === nextProps.showAvatar &&
		prevProps.message?.isTemp === nextProps.message?.isTemp &&
		prevProps.params === nextProps.params &&
		prevProps.message?.has_reactions === nextProps.message?.has_reactions &&
		prevProps.message?.reactions === nextProps.message?.reactions &&
		prevProps.message?.reacted_by === nextProps.message?.reacted_by &&
		prevProps.message?.is_mentioned_you === nextProps.message?.is_mentioned_you &&
		prevProps.chatEnterKey === nextProps.chatEnterKey &&
		prevProps.messageListConfig === nextProps.messageListConfig
	);
});

const s = StyleSheet.create({
	contentRow: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: 5,
	},
	wrapper: {
		minHeight: 35,
	},
	main: {
		marginLeft: -47,
		position: 'relative',
	},
});
