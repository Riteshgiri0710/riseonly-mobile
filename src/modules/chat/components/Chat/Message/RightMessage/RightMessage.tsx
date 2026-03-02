import { checker } from '@lib/helpers';
import { gradientFromColor } from '@lib/theme';
import { stickerInteractionsStore } from '@modules/sticker/stores/sticker/sticker-interactions/sticker-interactions';
import React, { memo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ChatType } from 'src/modules/chat/stores/chats';
import { GetMessageMessage } from 'src/modules/chat/stores/message/message-actions/types';
import { themeStore } from 'src/modules/theme/stores';
import { BaseMessage } from '../BaseMessage/BaseMessage';
import { MessageContent } from '../MessageContent/MessageContent';
import { RootStackParamList } from '@app/router';
import { MessageListConfig } from '@core/config/const';

interface RightMessageProps {
	message?: GetMessageMessage | null;
	style?: StyleProp<ViewStyle>;
	showAvatar?: boolean;
	onLongPress: () => void;
	onPressIn: (isSender: boolean) => void;
	chatType: ChatType;
	params: RootStackParamList['Chat'];
	chatEnterKey?: number;
	messageListConfig?: MessageListConfig;
	isSelected?: boolean;
	isSelectionMode?: boolean;
}

export const replyCircleView = 50;

const RightMessageComponent = ({
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
}: RightMessageProps) => {
	const currentTheme = themeStore.currentTheme;

	checker(message, "message is required");
	checker(chatType, "chatType is required");

	const opacity = message?.isTemp ? 0.7 : 1;
	const showCheckbox = config?.showCheckbox ?? true;
	const showSwipeToReply = config?.showSwipeToReply ?? true;
	const isSticker = message?.content_type === 'sticker';
	const firstMedia = message?.media_items?.[0] as { pack_id?: string; packId?: string; media_info?: { pack_id?: string; }; } | undefined;
	const stickerPackId = isSticker
		? (firstMedia?.pack_id ?? firstMedia?.packId ?? firstMedia?.media_info?.pack_id ?? '')
		: '';
	const onStickerTap = (isSticker && stickerPackId)
		? () => stickerInteractionsStore.openStickerPackByPackId(stickerPackId)
		: undefined;

	return (
		<BaseMessage
			message={message}
			style={[s.main, style]}
			onLongPress={onLongPress}
			onPressIn={onPressIn}
			onStickerTap={onStickerTap}
			isSender={true}
			pressableStyle={s.right}
			longPressScale={0.9}
			opacity={opacity}
			showCheckbox={showCheckbox}
			disableInteractions={!showSwipeToReply}
			simple={config?.simpleMessage}
			isSelected={isSelected}
			isSelectionMode={isSelectionMode}
		>
			<View
				style={[
					s.msg,
					isSticker
						? { backgroundColor: 'transparent', paddingHorizontal: 0, paddingTop: 0 }
						: {
							backgroundColor: gradientFromColor(currentTheme.primary_100),
							paddingHorizontal: 1,
							paddingTop: 1
						}
				]}
			>
				<MessageContent
					message={message}
					chatType={chatType}
					skipWrapper={true}
					hideUsername={true}
					params={params}
					chatEnterKey={chatEnterKey}
					messageListConfig={config}
				/>
			</View>
		</BaseMessage>
	);
};

export const RightMessage = memo(RightMessageComponent, (prevProps, nextProps) => {
	return (
		prevProps.message?.id === nextProps.message?.id &&
		prevProps.message?.content === nextProps.message?.content &&
		prevProps.message?.content_type === nextProps.message?.content_type &&
		prevProps.showAvatar === nextProps.showAvatar &&
		prevProps.message?.isTemp === nextProps.message?.isTemp &&
		prevProps.params === nextProps.params &&
		prevProps.message?.has_reactions === nextProps.message?.has_reactions &&
		prevProps.message?.reactions === nextProps.message?.reactions &&
		prevProps.message?.reacted_by === nextProps.message?.reacted_by &&
		prevProps.message?.is_read === nextProps.message?.is_read &&
		prevProps.chatEnterKey === nextProps.chatEnterKey &&
		prevProps.messageListConfig === nextProps.messageListConfig
	);
});

const s = StyleSheet.create({
	imageContainer: {
		paddingHorizontal: 3,
		paddingTop: 3,
	},
	textWrapper: {
		flexWrap: 'wrap',
		flexDirection: 'row',
		alignItems: 'flex-end',
		marginRight: 3
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
		flexDirection: "row",
		gap: 3,
		alignItems: "center",
		position: "absolute",
		bottom: 5,
		right: 8,
	},
	msgContent: {
		paddingVertical: 7,
		paddingHorizontal: 11,
		backgroundColor: "transparent",
	},
	msg: {
		maxWidth: 280,
		position: "relative",
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		borderBottomLeftRadius: 20,
		overflow: "hidden"
	},
	right: {
		justifyContent: "flex-end",
	},
	main: {
		alignItems: "flex-end",
		paddingRight: 5,
		marginRight: -replyCircleView,
	},
});
