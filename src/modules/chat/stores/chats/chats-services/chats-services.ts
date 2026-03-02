import { showNotify } from '@core/config/const';
import { eventActionsStore } from '@core/stores/events';
import { onlineServices } from '@core/stores/online';
import { checker, logger } from '@lib/helpers';
import { navigate, push } from '@lib/navigation';
import { authServiceStore } from '@modules/auth/stores';
import { profileStore } from '@modules/user/stores/profile';
import { appStorage } from '@storage/AppStorage';
import i18n from 'i18n';
import { TFunction } from 'i18next';
import { makeAutoObservable } from 'mobx';
import { useMobxUpdate } from 'mobx-toolbox';
import { GetMessageMessage } from '../../message';
import { chatsActionsStore } from '../chats-actions/chats-actions';
import { ChatIdOrUserChatId, ChatInfo, ProtoGetChatByIdResponse, ProtoGetChatPreviewByInviteLinkResponse } from '../chats-actions/types';
import { chatsInteractionsStore } from '../chats-interactions/chats-interactions';
import { ChatsListResponse, ErrorResponse } from './types';

class ChatsServicesStore {
	constructor() { makeAutoObservable(this); }

	// CHATS

	getAllUserIdsFromPrivateChats = (chats: ChatInfo[]) => {
		const userIds = chats.filter(chat => chat.type === "PRIVATE").map(chat => chat.participant.id);
		return [...new Set(userIds)];
	};

	upChatOrAddToTop = (message: GetMessageMessage) => {
		const { getProfileUserId } = authServiceStore;
		const { chats } = chatsActionsStore;

		logger.info("upChatOrAddToTop", message.id);

		const userId = getProfileUserId();

		if (!userId) return;

		checker(message.chat_id, "upChatOrAddToTop: chat_id is not set");

		if (!chats.data && message.chat) {
			chats?.saiUpdater?.(null, null, () => {
				return [message.chat!];
			}, "id", ["getChats", userId], "both");
			return;
		}

		if (!chats.data) {
			console.warn("[upChatOrAddToTop] chats.data is not set and message.chat is not available");
			return;
		}

		const onlyMessage = Object.assign({}, message);
		if (onlyMessage.chat) delete (onlyMessage as any).chat;

		chats?.saiUpdater?.(null, null, (prev: ChatInfo[]) => {
			if (!prev || !Array.isArray(prev)) {
				if (message.chat) {
					return [message.chat];
				}
				return prev || [];
			}

			const chatIndex = prev.findIndex(c => c.id === message.chat_id);

			if (chatIndex !== -1) {
				const updatedChat = {
					...prev[chatIndex],
					last_message: onlyMessage,
					updated_at: message.timestamp || Date.now(),
				};

				const newChats = [...prev];
				newChats.splice(chatIndex, 1);
				return [updatedChat, ...newChats];
			} else {
				if (message.chat) {
					return [message.chat, ...prev];
				}
				return prev;
			}
		}, "id", ["getChats", userId], "both");
	};

	getChatByChatIdOrUserChatIdAndRefreshSelectedChat = async (chatOrUserChatId: string, which: ChatIdOrUserChatId = "chat_id") => {
		const { getChatByChatIdOrUserChatId } = chatsActionsStore;

		getChatByChatIdOrUserChatId(chatOrUserChatId, which);
	};

	// TEMP DATA

	createChatTempData = async (body: any, context: any) => {
		const { getMyProfile } = profileStore;

		const profile = await getMyProfile();

		checker(profile, "createChatTempData: profile is not set");

		const tempId = context?.tempId || `temp_${Date.now()}`;

		return {
			"id": tempId,
			"isTemp": true,
			"creator_info": profile?.id || "",
			"description": body?.description || "",
			"is_public": body?.is_public || false,
			"tag": body?.tag || "Add",
			"title": body?.title || "Add",
			"banner_url": body?.banner_url || "",
			"type": body.type,
			"logo_url": body?.logo_url || "",
			"participants": body?.participants || [],
			"forward_in_chat_enabled": body?.forward_in_chat_enabled || false,
			"last_mesage": {
				"caption": null,
				"content": `Channel '${body?.title}' was created`,
				"content_type": "system",
				"has_attachments": false,
				"has_reactions": false,
				"id": `temp_${Date.now()}`,
				"is_forwarded": false,
				"is_pinned": false,
				"is_reply": false,
				"is_system_message": true,
				"media_info": null,
				"sender": null,
				"sender_id": "00000000-0000-0000-0000-000000000000",
				"sender_name": "Unknown User",
				"system_message_type": null,
				"timestamp": new Date().getTime()
			},

			"can_accept_join_requests": false,
			"can_ban_members": false,
			"can_invite_users": true,
			"can_kick_members": false,
			"can_manage_chat": false,
			"can_pin_messages": false,
			"custom_color": "",
			"custom_title": null,
			"encryption_enabled": false,
			"is_anonymous": false,
			"is_muted": false,
			"is_pinned": false,
			"is_verified": false,
			"joined_at": Date.now(),
			"last_activity": Date.now(),
			"member_count": 1,
			"mute_until": null,
			"notifications_enabled": true,
			"participant": null,
			"role": "OWNER",
			"unread_count": 0,
			"updated_at": Date.now(),
			"user_chat_id": tempId,
			"username": body?.tag || null,
			"typing_datas": [],
			"created_at": Date.now()
		};
	};

	extractRealChatData = (response: any) => {
		const data = response?.data || response;
		if (!data) return null;

		const createdAt = data.created_at || Math.floor(Date.now() / 1000);

		return {
			id: data.chat_id || data.id,
			title: data.title,
			type: data.type,
			description: data.description || "",
			logo_url: data.logo_url || "",
			banner_url: data.banner_url || "",
			is_public: data.is_public || false,
			created_at: createdAt,
			updated_at: data.updated_at || createdAt,
			last_message: {
				caption: null,
				content: `Channel '${data.title || 'New Channel'}' was created`,
				content_type: "system",
				has_attachments: false,
				has_reactions: false,
				id: `msg_${Date.now()}`,
				is_forwarded: false,
				is_pinned: false,
				is_reply: false,
				is_system_message: true,
				media_info: null,
				sender: null,
				sender_id: "00000000-0000-0000-0000-000000000000",
				sender_name: "System",
				system_message_type: "CHAT_CREATED",
				timestamp: Date.now()
			},
			unread_count: 0,
			is_pinned: false,
			is_muted: false,
			member_count: 0,
			is_verified: false,
			username: data.tag || null,
			role: "OWNER",
			joined_at: createdAt,
			notifications_enabled: true,
			mute_until: null,
			custom_title: null,
			is_anonymous: false,
			custom_color: "",
			can_invite_users: true,
			can_pin_messages: false,
			can_manage_chat: false,
			creator_info: null,
			participant: null,
			tag: data.tag || null,
			forward_in_chat_enabled: data.forward_in_chat_enabled || false,
			typing_datas: []
		};
	};

	createGroupTempData = async (body: any, context: any) => {
		const { getMyProfile } = profileStore;

		const profile = await getMyProfile();

		checker(profile, "createGroupTempData: profile is not set");

		const tempId = context?.tempId || `temp_${Date.now()}`;

		return {
			"id": tempId,
			"isTemp": true,
			"creator_info": profile?.id || "",
			"description": body?.description || "",
			"is_public": body?.is_public || false,
			"tag": null,
			"title": body?.title || "CREATE TEMP DATA ERROR",
			"banner_url": body?.banner_url || "",
			"type": "GROUP",
			"logo_url": body?.logo_url || "",
			"participants": body?.participants || [],
			"forward_in_chat_enabled": body?.forward_in_chat_enabled || false,

			"last_mesage": {
				"caption": null,
				"content": `Group '${body?.title}' was created`,
				"content_type": "system",
				"has_attachments": false,
				"has_reactions": false,
				"id": `temp_${Date.now()}`,
				"is_forwarded": false,
				"is_pinned": false,
				"is_reply": false,
				"is_system_message": true,
				"media_info": null,
				"sender": null,
				"sender_id": "00000000-0000-0000-0000-000000000000",
				"sender_name": "Unknown User",
				"system_message_type": null,
				"timestamp": new Date().getTime()
			},

			"can_accept_join_requests": false,
			"can_ban_members": false,
			"can_invite_users": true,
			"can_kick_members": false,
			"can_manage_chat": false,
			"can_pin_messages": false,
			"custom_color": "",
			"custom_title": null,
			"encryption_enabled": false,
			"is_anonymous": false,
			"is_muted": false,
			"is_pinned": false,
			"is_verified": false,
			"joined_at": Date.now(),
			"last_activity": Date.now(),
			"member_count": 1,
			"mute_until": null,
			"notifications_enabled": true,
			"participant": null,
			"role": "OWNER",
			"unread_count": 0,
			"updated_at": Date.now(),
			"user_chat_id": tempId,
			"username": body?.tag || null,
			"typing_datas": [],
			"selectedMessageToReply": null,
			"selectedMessageToEdit": null,
			"created_at": Date.now()
		};
	};

	extractRealGroupData = (response: any) => {
		const data = response?.data || response;
		if (!data) return null;

		const createdAt = data.created_at || Math.floor(Date.now() / 1000);

		return {
			id: data.chat_id || data.id,
			title: data.title,
			type: data.type,
			description: data.description || "",
			logo_url: data.logo_url || "",
			banner_url: data.banner_url || "",
			is_public: data.is_public || false,
			created_at: createdAt,
			updated_at: data.updated_at || createdAt,
			last_message: {
				caption: null,
				content: `Channel '${data.title || 'New Channel'}' was created`,
				content_type: "system",
				has_attachments: false,
				has_reactions: false,
				id: `msg_${Date.now()}`,
				is_forwarded: false,
				is_pinned: false,
				is_reply: false,
				is_system_message: true,
				media_info: null,
				sender: null,
				sender_id: "00000000-0000-0000-0000-000000000000",
				sender_name: "System",
				system_message_type: "CHAT_CREATED",
				timestamp: Date.now()
			},
			unread_count: 0,
			is_pinned: false,
			is_muted: false,
			member_count: 0,
			is_verified: false,
			username: data.tag || null,
			role: "OWNER",
			joined_at: createdAt,
			notifications_enabled: true,
			mute_until: null,
			custom_title: null,
			is_anonymous: false,
			custom_color: "",
			can_invite_users: true,
			can_pin_messages: false,
			can_manage_chat: false,
			creator_info: null,
			participant: null,
			tag: data.tag || null,
			forward_in_chat_enabled: data.forward_in_chat_enabled || false,
			typing_datas: [],
			selectedMessageToReply: null,
			selectedMessageToEdit: null
		};
	};

	createInviteLinkTempData = async (body: any) => {
		const { getMyProfile } = profileStore;

		const user = await getMyProfile();

		return {
			id: "",
			chat_id: "",
			creator_id: user?.id || "",
			link: "",
			name: "",
			created_at: Date.now(),
			expires_at: Date.now(),
			usage_limit: 0,
			used_count: 0,
			is_revoked: false,
			revoked_at: Date.now(),
			creates_join_request: false,
			is_primary: false,
		};
	};

	extractInviteLinkData = (response: any) => {
		const data = response?.invite_link;

		if (!data) return null;

		return {
			id: data.id,
			chat_id: data.chat_id,
			creator_id: data.creator_id,
			link: data.link,
			name: data.name || data.link,
			created_at: data.created_at,
			expires_at: data.expires_at,
			usage_limit: data.usage_limit,
			used_count: data.used_count,
			is_revoked: data.is_revoked,
			revoked_at: data.revoked_at,
			creates_join_request: data.creates_join_request,
			is_primary: data.is_primary,
		};
	};

	// ==================== HANDLERS =========================

	// GET CHATS HANDLERS

	getChatsSuccessHandler = async (message: ChatsListResponse) => {
		const { setChatUpdater } = chatsInteractionsStore;
		const { presenceSubscribeAction } = eventActionsStore;

		if (!message?.chats) {
			showNotify("error", { message: i18n.t("get_chats_error") });
			return;
		}

		if (message.chats && message.chats.length > 0) {
			const avatarsToCache: string[] = [];

			const allUserIdsFromPrivateChats = this.getAllUserIdsFromPrivateChats(message.chats);

			presenceSubscribeAction(allUserIdsFromPrivateChats);

			onlineServices.mergeFromChats(message.chats);

			message.chats.forEach(chat => {
				if (chat.logo_url && chat.logo_url !== "") {
					avatarsToCache.push(chat.logo_url);
				}

				if (chat.participant && chat.participant.more && chat.participant.more.logo && chat.participant.more.logo !== "") {
					avatarsToCache.push(chat.participant.more.logo);
				}
			});

			if (avatarsToCache.length > 0) {
				try {
					appStorage.batchSaveMedia(avatarsToCache)
						.then(cachedPaths => {
							console.log(`Cached ${Object.keys(cachedPaths).length} chat avatars`);
						})
						.catch(error => {
							console.error('Error caching chat avatars:', error);
						});
				} catch (error) {
					console.error('Error preparing chat avatars for caching:', error);
				}
			}
		}

		setChatUpdater(useMobxUpdate(() => message.chats));
	};

	getChatsErrorHandler = (message: ErrorResponse) => {
		showNotify("error", { message: i18n.t("get_chats_error") });
	};

	// CREATE CHANNEL HANDLERS

	createChannelSuccessHandler = (message: any) => { };

	createChannelErrorHandler = (message: ErrorResponse) => {
		showNotify("error", { message: i18n.t("create_channel_error") });
	};

	// CREATE GROUP HANDLERS

	createGroupSuccessHandler = (message: any) => { };

	createGroupErrorHandler = (message: ErrorResponse) => {
		showNotify("error", { message: i18n.t("create_group_error") });
	};

	// EDIT CHAT HANDLERS

	editChatSuccessHandler = (message: any) => { };

	editChatErrorHandler = (message: ErrorResponse, prevChat?: ChatInfo) => {
		showNotify("error", { message: i18n.t("edit_chat_error") });
	};

	// GET INVITE LINKS

	getInviteLinksSuccessHandler = (message: any) => { };

	getInviteLinksErrorHandler = (message: ErrorResponse) => {
		showNotify("error", { message: i18n.t("get_invite_links_error") });
	};

	// CREATE INVITE LINK

	createInviteLinkSuccessHandler = (message: any) => { };

	createInviteLinkErrorHandler = (message: ErrorResponse) => {
		showNotify("error", { message: i18n.t("create_invite_link_error") });
	};

	// REVOKE INVITE LINK HANDLERS

	revokeInviteLinkSuccessHandler = (message: any) => { };

	revokeInviteLinkErrorHandler = (message: ErrorResponse) => {
		showNotify("error", { message: i18n.t("revoke_invite_link_error") });
	};

	// EDIT INVITE LINK HANDLERS

	editInviteLinkSuccessHandler = (message: any) => { };

	editInviteLinkErrorHandler = (message: ErrorResponse) => {
		showNotify("error", { message: i18n.t("edit_invite_link_error") });
	};

	// GET CHAT MEMBERS HANDLERS

	getChatMembersSuccessHandler = (message: any) => {
		if (message?.members && Array.isArray(message.members)) {
			onlineServices.mergeFromMembers(message.members);
		}
	};

	getChatMembersErrorHandler = (message: ErrorResponse) => {
		showNotify("error", { message: i18n.t("get_chat_members_error") });
	};

	// GET CHAT PREVIEW BY INVITE LINK HANDLERS

	getChatPreviewByInviteLinkSuccessHandler = (message: ProtoGetChatPreviewByInviteLinkResponse) => {
		const { isPreviewInviteLinkChatOpen: { setIsPreviewInviteLinkChatOpen } } = chatsInteractionsStore;

		if (message.join_status === "already_member") {
			checker(message.chat, "acceptInviteOrSendJoinRequestSuccessHandler: message.chat is not set", true);
			push("Chat", { chatId: message.chat.id, tag: message.chat.tag || undefined, selectedChat: message.chat });
			return;
		}

		setIsPreviewInviteLinkChatOpen(true);
	};

	getChatPreviewByInviteLinkErrorHandler = (message: ErrorResponse) => {
		showNotify("error", { message: i18n.t("get_chat_preview_by_invite_link_error") });
	};

	// ACCEPT INVITE HANDLER

	acceptInviteSuccessHandler = (message: any) => { };

	acceptInviteErrorHandler = (message: ErrorResponse) => {
		showNotify("error", { message: i18n.t("accept_invite_error") });
	};

	// SEND JOIN REQUEST HANDLER

	sendJoinRequestSuccessHandler = (message: any, t: TFunction) => {
		showNotify("system", { message: t("join_request_sent"), position: "bottom" });
	};

	sendJoinRequestErrorHandler = (message: ErrorResponse) => {
		showNotify("error", { message: i18n.t("send_join_request_error") });
	};

	getChatByIdSuccessHandler = (message: ProtoGetChatByIdResponse) => {
		const { setSelectedChat, notificationPendingPayload, setNotificationPendingPayload } = chatsInteractionsStore;

		if (!message?.chat) return;
		const chat = message.chat;
		setSelectedChat(chat);
		const pending = notificationPendingPayload;
		if (pending && pending.chatId === chat.id) {
			setNotificationPendingPayload(null);
			navigate("Chat", { chatId: chat.id, selectedChat: chat, messageId: pending.messageId });
		}
	};

	getChatByIdErrorHandler = () => {
		const { setNotificationPendingPayload } = chatsInteractionsStore;

		setNotificationPendingPayload(null);
		showNotify("error", { message: i18n.t("get_chat_by_id_error") });
	};

	getChatByUserChatIdSuccessHandler = (message: ProtoGetChatByIdResponse) => {
		const { setSelectedChat } = chatsInteractionsStore;
		if (message?.chat) setSelectedChat(message.chat);
	};

	getChatByUserChatIdErrorHandler = () => {
		const { setNotificationPendingPayload } = chatsInteractionsStore;
		setNotificationPendingPayload(null);
		showNotify("error", { message: i18n.t("get_chat_by_user_chat_id_error") });
	};
}

export const chatsServicesStore = new ChatsServicesStore(); 