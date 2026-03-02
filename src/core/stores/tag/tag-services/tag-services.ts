import { showNotify } from '@core/config/const';
import { navigate, push } from '@core/lib/navigation/utils/navigationRef';
import i18next from 'i18next';
import { makeAutoObservable } from "mobx";
import { GlobalSearchByTagResponse, SearchChatResult, SearchUserResult } from '../tag-actions/types';
import { ChatInfo } from '@modules/chat/stores/chats/chats-actions/types';

class TagServicesStore {
	constructor() { makeAutoObservable(this); }

	// HANDLERS

	// CHECK TAG EXIST HANDLERS

	checkTagExistSuccessHandler = (data: any) => {
		console.log('✅ [Tag] Tag exist:', data);
	};

	checkTagExistErrorHandler = (error: any) => {
		showNotify("error", { message: "check_tag_exist_error" });
	};

	globalSearchByTagSuccessHandler = (data: any) => {
		console.log('✅ [Tag] Global search by tag:', data);
	};

	globalSearchByTagErrorHandler = (error: any) => {
		console.log('❌ [Tag] Failed to global search by tag:', error);
		showNotify("error", { message: "global_search_by_tag_error" });
	};

	// SEARCH BY TAG FOR NAVIGATION HANDLERS

	private showChatNotFoundByTag = () => {
		setTimeout(() => {
			showNotify("system", {
				message: i18next.t("chat_not_found_by_tag"),
				position: "bottom",
				duration: 3500,
			});
		}, 150);
	};

	searchByTagAndNavigateSuccessHandler = (data: GlobalSearchByTagResponse) => {
		if (data?.results?.length === 0) {
			this.searchByTagAndNavigateErrorHandler(null);
			return;
		}

		this.navigateFromSearchResults(data);
	};

	searchByTagAndNavigateErrorHandler = (error: any) => {
		this.showChatNotFoundByTag();
	};

	searchByTagAndNavigateCacheUsedHandler = (data: GlobalSearchByTagResponse) => {
		this.navigateFromSearchResults(data);
	};

	navigateFromSearchResults = (data: GlobalSearchByTagResponse) => {
		const results = data?.results ?? (data as any)?.data?.results;
		if (!Array.isArray(results) || results.length === 0) {
			this.showChatNotFoundByTag();
			return;
		}
		const first = results[0];
		const entityType = first.entity_type as string | number | undefined;
		const isUser = entityType === "USER" || entityType === 0;
		const isChannel = entityType === "CHANNEL" || entityType === 1;
		if (isUser && first.user) {
			const selectedChat = this.buildChatInfoFromSearchUser(first.user);
			const chatId = first.user.chat_id ?? first.user.user_chat_id ?? first.user.id;
			const userChatId = first.user.chat_id ? undefined : (first.user.user_chat_id ?? undefined);
			push("Chat", { chatId, userChatId, selectedChat });
		} else if (isChannel && first.chat) {
			const selectedChat = this.buildChatInfoFromSearchChat(first.chat);
			push("Chat", { chatId: first.chat.id, tag: first.chat.tag ?? undefined, selectedChat });
		} else {
			this.showChatNotFoundByTag();
		}
	};

	buildChatInfoFromSearchUser = (user: SearchUserResult): ChatInfo => {
		const more = user.more;
		const participant = {
			id: user.id,
			name: user.name,
			tag: user.tag,
			phone: "",
			created_at: "",
			updated_at: "",
			is_premium: user.is_premium,
			user_chat_id: user.user_chat_id || user.id,
			customer_id: "",
			gender: "NONE" as const,
			more_id: "",
			role: "USER" as const,
			is_blocked: false,
			more: {
				id: "",
				logo: user.logo || more?.logo || "",
				description: (more?.description ?? more?.who) || "",
				hb: null,
				streak: more?.streak ?? 0,
				p_lang: more?.p_lang ?? [],
				plans: [],
				subscribers: 0,
				friends: 0,
				status: more?.status ?? "",
				posts_count: 0,
				level: more?.rating ?? 0,
				stack: [],
				banner: "",
				who: more?.who ?? "",
				rating: more?.rating ?? 0,
				subscription_id: "",
				subscription_status: "NONE" as const,
				subscription_provider: "",
				subscription_start_date: "",
				subscription_end_date: "",
				subscription_period: "",
				subscription_cancelled_at: "",
				subscription_auto_renew: false,
				subscription_price_id: "",
				subscription_payment_method_id: "",
				is_online: false,
				last_seen: 0,
			},
			posts_count: 0,
			friends_count: 0,
			subs_count: 0,
			subscribers_count: 0,
			friend_request_id: null,
			is_subbed: null,
			is_friend: null,
		};
		return {
			id: user.chat_id ?? user.user_chat_id ?? user.id,
			title: user.name,
			type: "PRIVATE",
			participant: participant as any,
			last_message: null,
			unread_count: 0,
			is_pinned: false,
			is_muted: false,
			updated_at: 0,
			allowed_reactions: [],
			created_at: 0,
			member_count: 1,
			is_verified: false,
			is_public: false,
			notifications_enabled: true,
			is_anonymous: false,
			can_invite_users: false,
			can_pin_messages: false,
			can_manage_chat: false,
			forward_in_chat_enabled: true,
			unread_info: { messages: { count: 0 }, reactions: { count: 0, reactions: [] }, mentions: { count: 0, message_ids: [] } },
			typing_datas: [],
			selectedMessageToReply: null,
			selectedMessageToEdit: null,
		};
	};

	buildChatInfoFromSearchChat = (chat: SearchChatResult): ChatInfo => {
		return {
			id: chat.id,
			title: chat.title,
			type: "CHANNEL",
			participant: null as any,
			last_message: null,
			unread_count: 0,
			is_pinned: false,
			is_muted: false,
			updated_at: 0,
			allowed_reactions: [],
			created_at: 0,
			member_count: chat.member_count ?? 0,
			is_verified: chat.is_verified ?? false,
			is_public: chat.is_public ?? false,
			description: chat.description ?? "",
			logo_url: chat.logo_url ?? "",
			notifications_enabled: true,
			is_anonymous: false,
			can_invite_users: true,
			can_pin_messages: false,
			can_manage_chat: false,
			forward_in_chat_enabled: true,
			unread_info: { messages: { count: 0 }, reactions: { count: 0, reactions: [] }, mentions: { count: 0, message_ids: [] } },
			typing_datas: [],
			selectedMessageToReply: null,
			selectedMessageToEdit: null,
			tag: chat.tag ?? undefined,
		};
	};
}

export const tagServicesStore = new TagServicesStore();