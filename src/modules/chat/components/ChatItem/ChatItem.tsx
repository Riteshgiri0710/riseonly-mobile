import { Box, LiveTimeAgo, MainText, SecondaryText, SimpleButtonUi } from '@core/ui';
import { onlineServices } from '@core/stores/online';
import { ChatTitle } from '@modules/chat/components/Chat/ChatTitle/ChatTitle';
import { profileStore } from '@modules/user/stores/profile';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DimensionValue, StyleSheet } from 'react-native';
import { ChatLogo } from 'src/modules/chat/components/Chat/ChatLogo/ChatLogo';
import { chatsInteractionsStore } from 'src/modules/chat/stores/chats';
import { ChatInfo } from 'src/modules/chat/stores/chats/chats-actions/types';
import { themeStore } from 'src/modules/theme/stores';
import { ChatItemContent } from './ChatItemContent/ChatItemContent';
import { ChatUnreadCount } from './ChatUnreadCount/ChatUnreadCount';
import { HeartIcon } from '@icons/MainPage/Posts/HeartIcon';
import { ReadedIcon } from '@icons/MainPage/Chats/ReadedIcon';
import { UnreadedIcon } from '@icons/MainPage/Chats/UnreadedIcon';
import { MentionIcon } from '@icons/MainPage/Chats/MentionIcon';

interface ChatItemsProps {
	item: ChatInfo;
	chatCallback?: (item: ChatInfo) => void;
	variant?: "default" | "linked";
	endGroupTitle?: string;
	isOnline?: boolean;
}

const ChatItemComponent = observer(({
	item,
	chatCallback,
	variant = "default",
	endGroupTitle = "",
	isOnline: isOnlineProp,
}: ChatItemsProps) => {
	const { currentTheme } = themeStore;
	const { profile } = profileStore;
	const {
		onChatLongPressHandler,
		onChatPressHandler,
		openChatWithScrollToMention,
		openChatWithScrollToReaction,
	} = chatsInteractionsStore;

	const { t } = useTranslation();

	const isYou = item.last_message?.sender?.id === profile?.id;

	const reactionsCount = item?.unread_info?.reactions?.count;
	const unreadedMentionsCount = item?.unread_info?.mentions?.count;
	const unreadedMessagesCount = item?.unread_info?.messages?.count;

	const rightTopHeights = {
		"default": "auto",
		"linked": "100%"
	};

	const iconSizes = {
		"default": 28,
		"linked": 20
	};

	const logoSizes = {
		"default": 55,
		"linked": 45
	};

	const isOnline = isOnlineProp ?? onlineServices.getEffectiveStatus(item?.participant?.id, item?.participant).is_online;

	return (
		<Box
			gap={3}
		>
			<SimpleButtonUi
				style={[
					s.chat,
					{ backgroundColor: currentTheme.bg_100 },
					variant === "linked" && {
						paddingVertical: 0,
						paddingHorizontal: 8,
						borderRadius: 30,
						height: "auto"
					}
				]}
				onPress={() => onChatPressHandler(item, chatCallback)}
				onLongPress={onChatLongPressHandler}
			>
				<Box
					style={s.left}
					height={65}
				>
					<ChatLogo
						size={logoSizes[variant as keyof typeof logoSizes]}
						iconSize={iconSizes[variant as keyof typeof iconSizes]}
						type={item.type}
						chat={item}
						logo={item?.participant?.more?.logo}
						isOnline={isOnline}
					/>
				</Box>

				<Box
					style={[
						s.right,
						variant === "default" && {
							borderTopWidth: 0.1,
							borderBottomWidth: 0.5,
						},
						{
							borderTopColor: currentTheme.border_100,
							borderBottomColor: currentTheme.border_100,
						}
					]}
					height={65}
					flex={1}
				>
					<Box
						style={s.rightTop}
						fD="row"
						align="center"
						gap={20}
						justify='space-between'
						width={"100%"}
						height={rightTopHeights[variant as keyof typeof rightTopHeights] as DimensionValue}
					>
						<Box
							flexShrink={1}
							minWidth={0}
						>
							<ChatTitle
								chat={item}
								usernamePx={16.5}
								titlePx={18}
								favPx={18}
								fontWeight="normal"
							/>

							{variant === "linked" && (
								<Box>
									<SecondaryText>
										{t(`chat_settings_linked_${item.type.toLowerCase()}`).toLowerCase()}
									</SecondaryText>
								</Box>
							)}
						</Box>

						{variant === "default" && (
							<Box
								style={s.rightTopRight}
								gap={5}
								fD='row'
								align='center'
							>
								{item.last_message && (
									<>
										{item.last_message.sender?.id === profile?.id && (
											<>
												{item.last_message?.is_read ? (
													<ReadedIcon
														size={12.5}
														color={currentTheme.text_100}
													/>
												) : (
													<UnreadedIcon
														size={10}
														color={currentTheme.text_100}
													/>
												)}
											</>
										)}

										<LiveTimeAgo
											date={new Date(item.last_message?.timestamp > 1e12 ? item.last_message?.timestamp : item.last_message?.timestamp * 1000).toISOString()}
											fontSize={11}
										/>
									</>
								)}
							</Box>
						)}
					</Box>

					{variant === "default" && (
						<Box style={s.rightBot}>
							<Box>
								{(
									(item.type === "GROUP") &&
									!item.last_message?.is_system_message &&
									!isYou
								) && (
										<Box style={s.rightMid}>
											<MainText
												px={13}
												numberOfLines={1}
											>
												{item.last_message?.sender_name || ''}
											</MainText>
										</Box>
									)}

								<Box style={s.rightBotLeft}>
									<ChatItemContent
										item={item}
									/>
								</Box>
							</Box>

							<Box
								style={s.rightBotRight}
								fD='row'
								gap={4}
							>
								<ChatUnreadCount
									item={item}
									count={unreadedMentionsCount}
									bgColor={currentTheme.primary_100}
									textColor={currentTheme.text_100}
									icon={<MentionIcon size={14} color={"white"} />}
									onPress={unreadedMentionsCount ? () => openChatWithScrollToMention(item) : undefined}
								/>

								<ChatUnreadCount
									item={item}
									count={reactionsCount}
									bgColor={"rgb(251, 50, 77)"}
									textColor={currentTheme.text_100}
									icon={<HeartIcon filled size={12} color={"white"} />}
									onPress={reactionsCount ? () => openChatWithScrollToReaction(item) : undefined}
								/>

								<ChatUnreadCount
									item={item}
									count={unreadedMessagesCount}
									bgColor={currentTheme.primary_100}
									textColor={currentTheme.text_100}
								/>
							</Box>
						</Box>
					)}
				</Box>
			</SimpleButtonUi>

			{endGroupTitle && (
				<SecondaryText
					px={12}
					ml={15}
				>
					{endGroupTitle}
				</SecondaryText>
			)}
		</Box>
	);
});

export const ChatItem = React.memo(ChatItemComponent, (prevProps, nextProps) => {
	const prevTypingKey = prevProps.item.typing_datas
		?.map(t => `${t.user_id}:${t.is_typing}`)
		.sort()
		.join(',') || '';
	const nextTypingKey = nextProps.item.typing_datas
		?.map(t => `${t.user_id}:${t.is_typing}`)
		.sort()
		.join(',') || '';

	const idEqual = prevProps.item.id === nextProps.item.id;
	const unreadCountEqual = prevProps.item.unread_count === nextProps.item.unread_count;
	const lastMessageIdEqual = prevProps.item.last_message?.id === nextProps.item.last_message?.id;
	const lastMessageCreatedAtEqual = prevProps.item.last_message?.created_at === nextProps.item.last_message?.created_at;
	const lastMessageIsReadEqual = prevProps.item.last_message?.is_read === nextProps.item.last_message?.is_read;
	const isOnlineEqual = prevProps.isOnline !== undefined && nextProps.isOnline !== undefined
		? prevProps.isOnline === nextProps.isOnline
		: prevProps.item.participant?.more?.is_online === nextProps.item.participant?.more?.is_online;
	const typingKeyEqual = prevTypingKey === nextTypingKey;
	const typingDatasRefEqual = prevProps.item.typing_datas === nextProps.item.typing_datas;
	const itemRefEqual = prevProps.item === nextProps.item;
	const reactionsCountEqual = prevProps.item?.unread_info?.reactions?.count === nextProps.item?.unread_info?.reactions?.count;
	const unreadedMentionsCountEqual = prevProps.item?.unread_info?.mentions?.count === nextProps.item?.unread_info?.mentions?.count;
	const unreadedMessagesCountEqual = prevProps.item?.unread_info?.messages?.count === nextProps.item?.unread_info?.messages?.count;
	const unreadedMentionsArrayEqual = prevProps.item?.unread_info?.mentions?.message_ids?.length === nextProps.item?.unread_info?.mentions?.message_ids?.length
		&& (prevProps.item?.unread_info?.mentions?.message_ids?.join?.() ?? '') === (nextProps.item?.unread_info?.mentions?.message_ids?.join?.() ?? '');
	const reactionsArrayEqual = (prevProps.item?.unread_info?.reactions?.reactions?.length ?? 0) === (nextProps.item?.unread_info?.reactions?.reactions?.length ?? 0)
		&& (prevProps.item?.unread_info?.reactions?.reactions?.join?.() ?? '') === (nextProps.item?.unread_info?.reactions?.reactions?.join?.() ?? '');

	const shouldSkipUpdate = idEqual &&
		unreadCountEqual &&
		lastMessageIdEqual &&
		lastMessageCreatedAtEqual &&
		lastMessageIsReadEqual &&
		isOnlineEqual &&
		typingKeyEqual &&
		typingDatasRefEqual &&
		itemRefEqual &&
		reactionsCountEqual &&
		reactionsArrayEqual &&
		unreadedMentionsCountEqual &&
		unreadedMentionsArrayEqual &&
		unreadedMessagesCountEqual;

	return shouldSkipUpdate;
});

const s = StyleSheet.create({
	right: {
		paddingVertical: 6,
	},
	rightTopRight: {
		marginRight: 10,
	},
	rightBotRight: {
		marginRight: 5,
		position: "absolute",
		top: 7,
		right: 0,
	},
	rightTopLeft: {},
	rightBotLeft: {},
	rightMid: {},
	rightTop: {},
	rightBot: {
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
		gap: 5
	},
	left: {
		justifyContent: "center",
		alignItems: "center",
		paddingLeft: 8,
	},
	chat: {
		flexDirection: "row",
		gap: 8,
		height: 65
	},
});
