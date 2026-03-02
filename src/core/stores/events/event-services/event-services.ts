import { checker, logger } from '@lib/helpers';
import { getCurrentRoute } from '@lib/navigation';
import { getSaiInstanceById } from '@lib/mobx-toolbox/mobxSaiWs';
import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';
import { formatDiffData } from '@lib/text';
import { authServiceStore } from '@modules/auth/stores';
import { localStorage } from '@storage/index';
import { makeAutoObservable, runInAction } from 'mobx';
import { chatsActionsStore, chatsInteractionsStore, chatsServicesStore } from 'src/modules/chat/stores/chats';
import { ChatInfo, GetChatsResponse } from 'src/modules/chat/stores/chats/chats-actions/types';
import { messageServicesStore, messageActionsStore } from 'src/modules/chat/stores/message';
import { reactionsActionsStore } from 'src/modules/chat/stores/reactions';
import { TypingResponse, GetMessageMessage, GetMessagesResponse, ProtoReactionSummary } from 'src/modules/chat/stores/message/message-actions/types';
import { profileStore } from 'src/modules/user/stores/profile';
import { onlineServices } from '@core/stores/online';
import { eventActionsStore } from '../event-actions/event-actions';
import { MessageCreatedSuccessResponse, MessageEditedSuccessResponse, ReactionAddedSuccessResponse, ReactionRemovedSuccessResponse } from "../event-actions/types";
import { getIdOrServerId, getServerId } from '@utils/functions';

class EventServicesStore {
	constructor() { makeAutoObservable(this, {}, { deep: false }); }

	//

	presubscribeToChats = async (userId: string) => {
		const { presenceSubscribeAction } = eventActionsStore;
		const { getAllUserIdsFromPrivateChats } = chatsServicesStore;

		const cachedChats: MobxSaiWsInstance<GetChatsResponse> | null = await localStorage.get(`ws_cache_getChats-${userId}`);

		if (!cachedChats || !cachedChats.data) return;

		const userIds = getAllUserIdsFromPrivateChats(cachedChats.data.chats);

		presenceSubscribeAction(userIds);
	};

	// ONLINE STATUS CHANGED HANDLERS

	onlineStatusChangedSuccessHandler = (data: any) => {
		const { profile } = profileStore;
		const { chats } = chatsActionsStore;
		const msg = data?.data ?? data;

		if (!msg?.user_id) {
			logger.warn("onlineStatusChangedSuccessHandler", `user_id is not available in message: ${JSON.stringify(data)}`);
			return;
		}

		const lastSeenMs =
			typeof msg.last_seen === 'number' && msg.last_seen > 0
				? msg.last_seen
				: !msg.is_online
					? Date.now()
					: null;
		onlineServices.setStatus(msg.user_id, !!msg.is_online, lastSeenMs);

		if (profile?.id && chats?.saiUpdater) {
			chats.saiUpdater(
				null,
				"chats",
				(prev: any[]) => {
					return prev.map(chat => {
						if (chat?.participant?.id === msg.user_id) {
							const more = chat.participant.more ?? {};
							const nextMore = {
								...more,
								is_online: msg.is_online,
								...(!msg.is_online && lastSeenMs != null ? { last_seen: lastSeenMs } : {}),
							};
							return {
								...chat,
								participant: { ...chat.participant, more: nextMore },
							};
						}
						return chat;
					});
				},
				"id",
				["getChats", profile.id],
				"both"
			);
		}
	};

	onlineStatusChangedErrorHandler = (data: any) => {
		logger.error("getEventsErrorHandler", formatDiffData(data));
	};

	// MESSAGE TYPING HANDLERS

	messageTypingSuccessHandler = (data: any) => {
		const { getProfileUserId } = authServiceStore;
		const { profile } = profileStore;
		const { chatUpdater } = chatsInteractionsStore;
		const { chats } = chatsActionsStore;

		logger.info("messageTypingSuccessHandler", formatDiffData(data));

		if (profile && (data.user_id === profile.id)) return;
		if (!chatUpdater) return;

		const userId = getProfileUserId();

		if (!userId) return;

		const normal_data: TypingResponse = {
			chat_id: data.chat_id,
			user_id: data.user_id,
			user_name: data.user_info.name,
			user_tag: data.user_info.tag,
			user_chat_id: data.user_info.user_chat_id,
			p_langs: data.user_info.more?.p_lang || [],
			is_typing: data.typing,
		};

		chats?.saiUpdater?.(null, null, (prev: any[]) => {
			if (!prev || !Array.isArray(prev)) return prev;

			const chatIndex = prev.findIndex(c => c.id === normal_data.chat_id);
			if (chatIndex === -1) return prev;

			const chat = prev[chatIndex];
			let updatedTypingDatas = [...(chat.typing_datas || [])];

			if (data.typing) {
				const existingIndex = updatedTypingDatas.findIndex(t => t.user_id === normal_data.user_id);
				if (existingIndex !== -1) {
					updatedTypingDatas[existingIndex] = normal_data;
				} else {
					updatedTypingDatas.push(normal_data);
				}
			} else {
				updatedTypingDatas = updatedTypingDatas.filter(t => t.user_id !== normal_data.user_id);
			}

			const updatedChat = {
				...chat,
				typing_datas: updatedTypingDatas,
			};

			const newChats = [...prev];
			newChats[chatIndex] = updatedChat;
			return newChats;
		}, "id", ["getChats", userId], "both");

		runInAction(() => {
			if (chatsInteractionsStore.selectedChat?.id === normal_data.chat_id) {
				if (data.typing) {
					const existingIndex = chatsInteractionsStore.selectedChat.typing_datas.findIndex(
						t => t.user_id === normal_data.user_id
					);
					if (existingIndex !== -1) {
						chatsInteractionsStore.selectedChat.typing_datas[existingIndex] = normal_data;
					} else {
						chatsInteractionsStore.selectedChat.typing_datas.push(normal_data);
					}
				} else {
					chatsInteractionsStore.selectedChat.typing_datas =
						chatsInteractionsStore.selectedChat.typing_datas.filter(
							t => t.user_id !== normal_data.user_id
						);
				}
			}
		});
	};

	messageTypingErrorHandler = (data: any) => {
		logger.error("messageTypingErrorHandler", formatDiffData(data));
	};

	// MESSAGE CREATED HANDLERS

	buildChatInfoFromMessageCreated = (
		data: MessageCreatedSuccessResponse,
		normalizedMessage: GetMessageMessage,
		isFromCurrentUser: boolean,
		isUserInThisChat: boolean
	): ChatInfo => {
		const c = data.chat as any;
		const sender = data.sender_info || data.sender || c?.last_message?.sender;
		const participant = sender ? {
			id: sender.id,
			name: sender.name ?? "",
			tag: sender.tag ?? "",
			is_premium: sender.is_premium ?? false,
			user_chat_id: sender.user_chat_id ?? null,
			more: {
				...(sender.more ?? {}),
				description: sender.more?.description ?? "",
				friends: sender.more?.friends ?? 0,
				is_online: sender.more?.is_online ?? false,
				last_seen: sender.more?.last_seen ?? 0,
				level: sender.more?.level ?? 0,
				logo: sender.more?.logo ?? "",
				p_lang: sender.more?.p_lang ?? [],
				rating: sender.more?.rating ?? 0,
				status: sender.more?.status ?? "",
				subscribers: sender.more?.subscribers ?? 0,
				who: sender.more?.who ?? "",
			},
			role: sender.role ?? "USER",
		} : (c?.participant ?? { id: data.sender_id, name: data.sender_name ?? "", tag: "", role: "USER", more: {} });
		const ts = data.timestamp ?? data.created_at ?? 0;
		const unreadCount = !isUserInThisChat && !isFromCurrentUser ? 1 : 0;
		return {
			id: data.chat_id,
			title: c?.title ?? "",
			type: (c?.type_ ?? c?.type ?? "PRIVATE") as ChatInfo["type"],
			last_message: normalizedMessage,
			unread_count: c?.unread_count ?? unreadCount,
			is_pinned: c?.is_pinned ?? false,
			is_muted: c?.is_muted ?? false,
			updated_at: c?.updated_at ?? ts,
			allowed_reactions: c?.allowed_reactions ?? [],
			created_at: c?.created_at ?? ts,
			description: c?.description ?? "",
			logo_url: c?.logo_url ?? "",
			banner_url: c?.banner_url ?? "",
			member_count: c?.member_count ?? 2,
			is_verified: c?.is_verified ?? false,
			is_public: c?.is_public ?? false,
			role: c?.role ?? "MEMBER",
			joined_at: c?.joined_at,
			notifications_enabled: c?.notifications_enabled ?? true,
			mute_until: c?.mute_until ?? undefined,
			custom_title: c?.custom_title ?? undefined,
			is_anonymous: c?.is_anonymous ?? false,
			custom_color: c?.custom_color,
			last_activity: c?.last_activity ?? (ts < 1000000000000 ? ts * 1000 : ts),
			can_invite_users: c?.can_invite_users ?? true,
			can_pin_messages: c?.can_pin_messages ?? false,
			can_manage_chat: c?.can_manage_chat ?? false,
			creator_info: c?.creator_info,
			participant: participant as ChatInfo["participant"],
			tag: c?.tag ?? undefined,
			forward_in_chat_enabled: c?.forward_in_chat_enabled ?? true,
			unread_info: {
				...(c?.unread_info ?? {}),
				messages: !isUserInThisChat && !isFromCurrentUser ? { count: 1 } : (c?.unread_info?.messages ?? undefined),
			},
			typing_datas: [],
			selectedMessageToReply: null,
			selectedMessageToEdit: null,
		};
	};

	messageCreatedSuccessHandler = (data: MessageCreatedSuccessResponse) => {
		const { addMessageToChat } = messageServicesStore;
		const { markChatAsReadAction } = messageActionsStore;
		const { profile } = profileStore;
		const { chats } = chatsActionsStore;

		logger.info("messageCreatedSuccessHandler", data);

		checker(data, "messageCreatedSuccessHandler: data is undefined");

		const route = getCurrentRoute();
		const currentChatId = (route?.params as { chatId?: string; })?.chatId;
		const isUserInThisChat = route?.name === "Chat" && currentChatId === data.chat_id;
		const isFromCurrentUser = data.sender_id === profile?.id;

		const mediaItems = data.media_items && data.media_items.length > 0
			? data.media_items.map((item: any) => ({
				media_type: item.media_type || "image",
				file_url: item.file_url,
				thumbnail_url: item.thumbnail_url ?? null,
				file_name: item.file_name,
				file_size: item.file_size,
				mime_type: item.mime_type,
				width: item.width ?? undefined,
				height: item.height ?? undefined,
				duration: item.duration ?? undefined,
				bitrate: item.bitrate ?? undefined,
				fps: item.fps ?? undefined,
				codec: item.codec ?? undefined,
				waveform: item.waveform ?? undefined,
			}))
			: undefined;

		const normalizedMessage: any = {
			id: data.message_id || data.id,
			chat_id: data.chat_id,
			sender_id: data.sender_id,
			sender_name: data.sender_info?.name || data.sender_name || "",
			content: data.content,
			original_content: data.content,
			created_at: data.timestamp || data.created_at,
			timestamp: data.timestamp || data.created_at,
			content_type: data.content_type,
			sender: data.sender_info || data.sender,
			is_system_message: data.is_system_message || false,
			has_attachments: data.has_attachments || Boolean(data.media_url) || Boolean(mediaItems?.length),
			is_forwarded: data.is_forwarded || Boolean(data.forward_from),
			is_reply: data.is_reply || Boolean(data.reply_to),
			has_reactions: data.has_reactions || false,
			is_pinned: data.is_pinned || false,
			is_mentioned_you: data.is_mentioned_you ?? false,
			reply_to: data.reply_to || null,
			...(mediaItems && mediaItems.length > 0 && { media_items: mediaItems }),
		};

		const messageCopyForChat = { ...normalizedMessage };
		delete messageCopyForChat.chat;
		const normalizedChat = this.buildChatInfoFromMessageCreated(
			data,
			messageCopyForChat,
			isFromCurrentUser,
			isUserInThisChat
		);
		normalizedMessage.chat = normalizedChat;

		logger.info("messageCreatedSuccessHandler normalized message", normalizedMessage);
		addMessageToChat(normalizedMessage);

		if (isUserInThisChat && data.chat_id) {
			markChatAsReadAction(data.chat_id);
		}

		if (!isUserInThisChat && !isFromCurrentUser && chats?.saiUpdater && profile?.id) {
			chats.saiUpdater(
				null,
				null,
				(prev: ChatInfo[]) => {
					if (!prev || !Array.isArray(prev)) return prev;
					return prev.map((chat) => {
						if (chat.id !== data.chat_id) return chat;
						const messages = chat.unread_info?.messages;
						const currentCount = messages?.count ?? 0;
						const mentions = chat.unread_info?.mentions;
						const mentionCount = mentions?.count ?? 0;
						const mentionIds = mentions?.message_ids ?? [];
						const messageId = data.message_id || data.id;
						const isMention = data.is_mentioned_you === true;

						return {
							...chat,
							unread_info: {
								...chat.unread_info,
								messages: {
									...messages,
									count: currentCount + 1,
								},
								...(isMention && messageId && {
									mentions: {
										message_ids: [messageId, ...mentionIds],
										count: mentionCount + 1,
									},
								}),
							},
						};
					});
				},
				"id",
				["getChats", profile.id],
				"both"
			);
		} else if (data.is_mentioned_you === true && !isUserInThisChat && chats?.saiUpdater && profile?.id) {
			const messageId = data.message_id || data.id;
			if (messageId) {
				chats.saiUpdater(
					null,
					null,
					(prev: ChatInfo[]) => {
						if (!prev || !Array.isArray(prev)) return prev;
						return prev.map((chat) => {
							if (chat.id !== data.chat_id) return chat;
							const mentions = chat.unread_info?.mentions;
							const mentionCount = mentions?.count ?? 0;
							const mentionIds = mentions?.message_ids ?? [];
							return {
								...chat,
								unread_info: {
									...chat.unread_info,
									mentions: {
										message_ids: [messageId, ...mentionIds],
										count: mentionCount + 1,
									},
								},
							};
						});
					},
					"id",
					["getChats", profile.id],
					"both"
				);
			}
		}
	};

	messageCreatedErrorHandler = (error: any) => {
		logger.error("messageCreatedErrorHandler", error);
	};

	messageEditedSuccessHandler = (eventData: any) => {
		const { messages } = messageActionsStore;
		const { chats } = chatsActionsStore;
		const { profile } = profileStore;

		const data: MessageEditedSuccessResponse = eventData?.data?.data ?? eventData?.data ?? eventData;
		const chat_id = data?.chat_id;
		const message_id = data?.message_id;
		const new_content = data?.new_content;
		const original_content = data?.original_content ?? new_content;
		const edit_date = data?.edit_timestamp;

		if (!message_id || !chat_id || new_content == null) {
			logger.warn("messageEditedSuccessHandler", `message_id, chat_id or new_content missing: ${JSON.stringify(data)}`);
			return;
		}

		if (messages?.saiUpdater) {
			const cacheId = `getMessages-null-null-${chat_id}`;
			messages.saiUpdater(
				null,
				null,
				(prev: GetMessageMessage[]) => {
					if (!prev || !Array.isArray(prev)) return prev;
					return prev.map((m) =>
						getServerId(m) === message_id
							? { ...m, content: new_content, original_content, ...(edit_date != null && { edit_date }) }
							: m
					);
				},
				"id",
				cacheId,
				"both"
			);
		}

		if (chats?.saiUpdater && profile?.id) {
			chats.saiUpdater(
				null,
				null,
				(prev: ChatInfo[]) => {
					if (!prev || !Array.isArray(prev)) return prev;
					return prev.map((chat) => {
						if (chat.id !== chat_id) return chat;
						const lm = chat.last_message;
						if (!lm || getServerId(lm) !== message_id) return chat;
						return {
							...chat,
							last_message: {
								...lm,
								content: new_content,
								original_content,
								...(edit_date != null && { edit_date }),
							},
						};
					});
				},
				"id",
				["getChats", profile.id],
				"both"
			);
		}
	};

	// CHAT READ HANDLERS

	chatReadSuccessHandler = (eventPayload: any) => {
		const { profile } = profileStore;
		const { chats } = chatsActionsStore;
		const { messages } = messageActionsStore;

		const msg = eventPayload?.data ?? eventPayload;
		const chat_id = msg?.chat_id;
		const last_read_message_id = msg?.last_read_message_id;
		const read_timestamp = msg?.read_timestamp ?? 0;

		if (!chat_id || !last_read_message_id) {
			logger.warn("chatReadSuccessHandler", `chat_id or last_read_message_id missing: ${JSON.stringify(msg)}`);
			return;
		}

		if (chats?.saiUpdater && profile?.id) {
			chats.saiUpdater(
				null,
				null,
				(prev: ChatInfo[]) => {
					if (!prev || !Array.isArray(prev)) return prev;
					return prev.map((chat) => {
						if (chat.id !== chat_id) return chat;
						const lm = chat.last_message;
						if (!lm) return chat;
						const lmIdOrServerId = getIdOrServerId(lm);
						const isReadUpTo = lmIdOrServerId === last_read_message_id;
						logger.info("chatReadSuccessHandler", `lm: ${lmIdOrServerId} last_read_message_id: ${last_read_message_id} isReadUpTo: ${isReadUpTo}`);

						return {
							...chat,
							last_message: {
								...lm,
								is_read: isReadUpTo ? true : (lm.is_read ?? false),
							},
						};
					});
				},
				"id",
				["getChats", profile.id],
				"both"
			);
		}

		const cacheId = `getMessages-null-null-${chat_id}`;
		if (messages?.saiUpdater) {
			messages.saiUpdater(
				null,
				null,
				(prev: GetMessageMessage[]) => {
					if (!prev || !Array.isArray(prev)) return prev;
					return prev.map((message) => {
						const messageIdOrServerId = getIdOrServerId(message);
						const isThisReadUpTo = messageIdOrServerId === last_read_message_id;
						return {
							...message,
							is_read: isThisReadUpTo ? true : (message.is_read ?? false),
						};
					});
				},
				"id",
				cacheId,
				"both"
			);
		}
	};

	// REACTION ADDED HANDLERS
	// Note: Crash on device happens only AFTER messages have visually updated (reactions added/removed).
	// Deferring store updates to next frame to avoid updating during WebSocket callback and reduce risk of Reanimated/native crash on re-render.

	reactionAddedSuccessHandler = (eventData: any) => {
		const { profile } = profileStore;
		const { messages } = messageActionsStore;
		const { chats } = chatsActionsStore;

		const data: ReactionAddedSuccessResponse = eventData?.data || eventData;

		logger.info("reactionAddedSuccessHandler", data);

		checker(data, "reactionAddedSuccessHandler: data is undefined");
		checker(data.chat_id, "reactionAddedSuccessHandler: chat_id is not available");
		checker(data.message_id, "reactionAddedSuccessHandler: message_id is not available");
		checker(data.reacted_by, "reactionAddedSuccessHandler: reacted_by is not available");

		if (!messages?.saiUpdater || !data.reacted_by || data.reacted_by.length === 0) return;

		const route = getCurrentRoute();
		const isUserInChat = route?.name === "Chat" && (route?.params as { chatId?: string; })?.chatId === data.chat_id;
		const cacheId = `getMessages-null-null-${data.chat_id}`;
		const reactionEntry = data.reacted_by[data.reacted_by.length - 1];

		const reactedByFromEvent = data.reacted_by.map((r) => ({
			reaction: r.reaction,
			created_at: r.created_at,
			sender: r.sender,
			chat_id: r.chat_id,
		}));
		const reactionToCount = new Map<string, number>();
		const reactionToReactedByYou = new Map<string, boolean>();
		for (const r of data.reacted_by) {
			reactionToCount.set(r.reaction, (reactionToCount.get(r.reaction) ?? 0) + 1);
			if (r.sender?.id === profile?.id) {
				reactionToReactedByYou.set(r.reaction, true);
			}
		}
		const reactionsFromEvent = Array.from(reactionToCount.entries()).map(([reaction, count]) => ({
			reaction,
			count,
			reacted_by_you: reactionToReactedByYou.get(reaction) ?? false,
		}));

		const applyUpdates = () => {
			if (!messages?.saiUpdater) return;
			messages.saiUpdater(
				null,
				null,
				(prev: GetMessageMessage[]) => {
					if (!prev || !Array.isArray(prev)) return prev;

					return prev.map((message) => {
						if (getServerId(message) !== data.message_id) return message;

						return {
							...message,
							reacted_by: reactedByFromEvent,
							reactions: reactionsFromEvent,
							has_reactions: reactionsFromEvent.length > 0,
							reactions_unreaded: !isUserInChat,
						};
					});
				},
				"id",
				cacheId,
				"both"
			);

			const isReactionFromCurrentUser = reactionEntry?.sender?.id === profile?.id;

			if (isUserInChat && !isReactionFromCurrentUser) {
				try {
					reactionsActionsStore.markReactionsAsReadAction(data.chat_id, [data.message_id]);
				} catch (e) {
					logger.error("reactionAddedSuccessHandler markReactionsAsReadAction", e);
				}
			}

			if (chats?.saiUpdater && profile?.id) {
				chats.saiUpdater(
					null,
					null,
					(prev: ChatInfo[]) => {
						if (!prev || !Array.isArray(prev)) return prev;
						return prev.map((chat) => {
							if (chat.id !== data.chat_id) return chat;
							const isLastMessage = chat.last_message && getServerId(chat.last_message) === data.message_id;
							const lastMessagePatch = isLastMessage && chat.last_message
								? {
									last_message: {
										...chat.last_message,
										reacted_by: reactedByFromEvent,
										reactions: reactionsFromEvent,
										has_reactions: true,
									},
								}
								: {};
							if (isUserInChat) {
								return { ...chat, ...lastMessagePatch };
							}
							const reactions = chat.unread_info?.reactions;
							const currentCount = reactions?.count ?? 0;
							const currentReactionsList = reactions?.reactions ?? [];
							return {
								...chat,
								...lastMessagePatch,
								unread_info: {
									...chat.unread_info,
									reactions: {
										...reactions,
										count: currentCount + 1,
										reactions: [...currentReactionsList, data.message_id],
									},
								},
							};
						});
					},
					"id",
					["getChats", profile.id],
					"both"
				);
			}
		};

		requestAnimationFrame(applyUpdates);
	};

	reactionAddedErrorHandler = (error: any) => {
		logger.error("reactionAddedErrorHandler", error);
	};

	// REACTION REMOVED HANDLERS

	reactionRemovedSuccessHandler = (eventData: any) => {
		const { profile } = profileStore;
		const { messages } = messageActionsStore;

		const data: ReactionRemovedSuccessResponse = eventData?.data?.data || eventData?.data || eventData;

		logger.info("reactionRemovedSuccessHandler", data);

		checker(data, "reactionRemovedSuccessHandler: data is undefined");
		checker(data.chat_id, "reactionRemovedSuccessHandler: chat_id is not available");
		checker(data.message_id, "reactionRemovedSuccessHandler: message_id is not available");
		checker(data.reaction, "reactionRemovedSuccessHandler: reaction is not available");
		checker(data.remover_id, "reactionRemovedSuccessHandler: remover_id is not available");

		if (!messages?.saiUpdater) return;

		const cacheId = `getMessages-null-null-${data.chat_id}`;

		const applyUpdates = () => {
			if (!messages?.saiUpdater) return;
			messages.saiUpdater(
				null,
				null,
				(prev: GetMessageMessage[]) => {
					if (!prev || !Array.isArray(prev)) return prev;

					return prev.map((message) => {
						if (getServerId(message) !== data.message_id) return message;

						const currentReactedBy = [...(message.reacted_by || [])];
						const currentReactions = [...(message.reactions || [])];

						const filteredReactedBy = currentReactedBy.filter(
							(r) => !(r.reaction === data.reaction && r.sender?.id === data.remover_id)
						);

						const updatedReactions = currentReactions
							.map((r) => {
								if (r.reaction !== data.reaction) return r;
								const count = Math.max(0, r.count - 1);
								const reactedByYou = data.remover_id === profile?.id ? false : r.reacted_by_you;
								return count === 0 ? null : { ...r, count, reacted_by_you: reactedByYou };
							})
							.filter((r): r is ProtoReactionSummary => r !== null);

						return {
							...message,
							reacted_by: filteredReactedBy,
							reactions: updatedReactions,
							has_reactions: updatedReactions.length > 0,
						};
					});
				},
				"id",
				cacheId,
				"both"
			);
		};

		requestAnimationFrame(applyUpdates);
	};

	reactionRemovedErrorHandler = (error: any) => {
		logger.error("reactionRemovedErrorHandler", error);
	};

	// MESSAGE DELETED HANDLERS

	messageDeletedSuccessHandler = (eventData: any) => {
		const { messages } = messageActionsStore;
		const { chats } = chatsActionsStore;
		const { profile } = profileStore;

		const data = eventData?.data?.data ?? eventData?.data ?? eventData;
		const message_id = data?.message_id;
		const chat_id = data?.chat_id;

		if (!message_id || !chat_id) {
			logger.warn("messageDeletedSuccessHandler", `message_id or chat_id missing: ${JSON.stringify(data)}`);
			return;
		}

		if (messages?.saiUpdater) {
			const cacheId = `getMessages-null-null-${chat_id}`;
			messages.saiUpdater(
				null,
				null,
				(prev: GetMessageMessage[]) => {
					if (!prev || !Array.isArray(prev)) return prev;
					return prev.filter((m) => getServerId(m) !== message_id);
				},
				"id",
				cacheId,
				"both"
			);
		}

		if (chats?.saiUpdater && profile?.id) {
			chats.saiUpdater(
				null,
				null,
				(prev: ChatInfo[]) => {
					if (!prev || !Array.isArray(prev)) return prev;
					return prev.map((chat) => {
						if (chat.id !== chat_id) return chat;
						if (chat.last_message?.id !== message_id) return chat;
						return { ...chat, last_message: null };
					});
				},
				"id",
				["getChats", profile.id],
				"both"
			);
		}
	};

	linkPreviewReadySuccessHandler = (data: any) => {
		const { messages } = messageActionsStore;
		const payload = data?.data ?? data;

		if (!payload?.message_id || !payload?.chat_id) return;

		if (!messages?.saiUpdater) return;

		const cacheId = `getMessages-null-null-${payload.chat_id}`;
		const linkPreview = {
			title: payload.title ?? '',
			description: payload.description ?? '',
			image_url: payload.image_url ?? '',
			link_preview_type: (payload.link_preview_type === 'BIG' ? 'BIG' : 'SMALL') as 'SMALL' | 'BIG',
		};

		messages.saiUpdater(
			null,
			null,
			(prev: GetMessageMessage[]) => {
				if (!prev || !Array.isArray(prev)) return prev;
				return prev.map((m) =>
					m.id === payload.message_id
						? { ...m, link_preview: linkPreview }
						: m
				);
			},
			"id",
			cacheId,
			"both"
		);
	};

}

export const eventServicesStore = new EventServicesStore();