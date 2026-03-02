import { checker } from '@lib/helpers';
import { mobxSaiWs } from '@lib/mobx-toolbox/mobxSaiWs';
import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';
import { makeAutoObservable } from 'mobx';
import { mobxState } from 'mobx-toolbox';
import { authServiceStore } from 'src/modules/auth/stores';
import { profileStore } from 'src/modules/user/stores/profile';
import { chatsInteractionsStore } from '../chats-interactions/chats-interactions';
import { chatsServicesStore } from '../chats-services/chats-services';
import { GetChatsRequest } from '../chats-services/types';
import { ChatIdOrUserChatId, ChatInfo, CreateChatRequest, CreateGroupRequest, GetChatsResponse, ProtoCreateInviteLinkRequest, ProtoEditChatRequest, ProtoEditInviteLinkRequest, ProtoGetChatByIdRequest, ProtoGetChatByIdResponse, ProtoGetChatByUserChatIdRequest, ProtoGetChatMembersRequest, ProtoGetChatMembersResponse, ProtoGetChatPreviewByInviteLinkRequest, ProtoGetChatPreviewByInviteLinkResponse, ProtoGetInviteLinksRequest, ProtoJoinChatByLinkRequest, ProtoRequestJoinChatRequest, ProtoRevokeInviteLinkRequest, ProtoRevokeInviteLinkResponse } from './types';

const CHATS_LIMIT = 50;
class ChatsActionsStore {
	constructor() { makeAutoObservable(this); }

	// CHATS

	chats: MobxSaiWsInstance<GetChatsResponse> = {};
	cachedChats: MobxSaiWsInstance<ChatInfo[]> = {};

	getChatsAction = async (limit: number = 50, relativeId?: string, up: boolean = false) => {
		const { getProfileUserId } = authServiceStore;
		const { getChatsSuccessHandler, getChatsErrorHandler } = chatsServicesStore;
		const { allChatsScrollRef } = chatsInteractionsStore;

		const userId = getProfileUserId();

		if (!userId) return;

		const message = mobxState<GetChatsRequest>({
			limit,
			relative_id: null,
			up: false,
		})("message");

		if (relativeId) message.message.relative_id = relativeId;
		if (up) message.message.up = up;

		this.chats = mobxSaiWs(
			message.message,
			{
				id: ["getChats", userId],
				fetchIfPending: false,
				fetchIfHaveData: false,
				fetchIfHaveLocalStorage: true,
				shadowRequest: {
					enabled: true,
					route: ["Chats", "ChatProfile", "Chat"],
				},
				service: "chat",
				method: "get_chats",
				onSuccess: getChatsSuccessHandler,
				onError: getChatsErrorHandler,
				storageCache: true,
				takeCachePriority: "localStorage",
				pathToArray: "chats",
				dataScope: {
					setParams: message,
					relativeParamsKey: "relative_id",
					upOrDownParamsKey: "up",
					isHaveMoreResKey: "is_have_more",
					howMuchGettedToTop: 2,
					upStrategy: "reversed",
					scopeLimit: CHATS_LIMIT * 2,
					startFrom: "top",
					topPercentage: 80,
					botPercentage: 20,
					scrollRef: allChatsScrollRef,
				},
				fetchAddTo: {
					path: "chats",
					addTo: "start"
				},
			}
		);
	};

	// CREATE CHANNEL

	createChannel: MobxSaiWsInstance<any> = {};

	createChannelAction = async () => {
		const { getProfileUserId } = authServiceStore;
		const { getMyProfile } = profileStore;
		const { createChannelSuccessHandler, createChannelErrorHandler, createChatTempData, extractRealChatData } = chatsServicesStore;
		const {
			createChannelForm: { values: { title, description, tag, image } },
			forwardInChatEnabled: { forwardInChatEnabled },
			channelChatType: { channelChatType },
			createChatSheetCloseSignal: { setCreateChatSheetCloseSignal }
		} = chatsInteractionsStore;

		const user = await getMyProfile();

		const body: CreateChatRequest = {
			type: "CHANNEL",
			title,
			description,
			is_public: channelChatType == 'public',
			logo_url: "",
			banner_url: "",
			participants: [user.id],
			forward_in_chat_enabled: forwardInChatEnabled,
			tag,
		};

		setCreateChatSheetCloseSignal(true);

		this.createChannel = mobxSaiWs(
			body,
			{
				id: "createChannel",
				fetchIfHaveData: true,
				fetchIfPending: false,
				service: 'chat',
				method: 'create_chat',
				pathToArray: "chats",
				onSuccess: createChannelSuccessHandler,
				onError: createChannelErrorHandler,
				optimisticUpdate: {
					enabled: true,
					updateCache: "both",
					createTempData: createChatTempData,
					extractRealData: extractRealChatData,
					addStrategy: 'start',
					targetCacheId: ["getChats", user.id],
					onError: () => false,
				},
			}
		);
	};

	// CREATE GROUP

	createGroup: MobxSaiWsInstance<any> = {};

	createGroupAction = async () => {
		const { getMyProfile } = profileStore;
		const { createGroupSuccessHandler, createGroupErrorHandler, createGroupTempData, extractRealGroupData } = chatsServicesStore;
		const {
			createGroupForm: { values: { title, description, image } },
			forwardInGroupEnabled: { forwardInGroupEnabled },
			groupChatType: { groupChatType },
			createChatSheetCloseSignal: { setCreateChatSheetCloseSignal }
		} = chatsInteractionsStore;

		const user = await getMyProfile();

		const body: CreateGroupRequest = {
			type: "GROUP",
			title,
			description,
			is_public: groupChatType == 'public',
			logo_url: "",
			banner_url: "",
			participants: [user.id],
			forward_in_chat_enabled: forwardInGroupEnabled,
		};

		setCreateChatSheetCloseSignal(true);

		this.createGroup = mobxSaiWs(
			body,
			{
				id: "createGroup",
				fetchIfHaveData: true,
				fetchIfPending: false,
				service: 'chat',
				method: 'create_chat',
				pathToArray: "chats",
				onSuccess: createGroupSuccessHandler,
				onError: createGroupErrorHandler,
				optimisticUpdate: {
					enabled: true,
					updateCache: "both",
					createTempData: createGroupTempData,
					extractRealData: extractRealGroupData,
					addStrategy: 'start',
					targetCacheId: ["getChats", user.id],
					onError: () => false,
				},
			}
		);
	};

	// EDIT CHAT

	editChat: MobxSaiWsInstance<any> = {};

	editChatAction = async (propsBody?: Omit<ProtoEditChatRequest, "user_id" | "chat_id">) => {
		const { getMyProfile } = profileStore;
		const { selectedChat, setSelectedChat } = chatsInteractionsStore;
		const { editChatErrorHandler, editChatSuccessHandler } = chatsServicesStore;

		checker(selectedChat, "[editChatAction] no selectedChat");

		const user = await getMyProfile();

		const resBody: ProtoEditChatRequest = {
			user_id: user.id,
			chat_id: selectedChat.id,
			...(propsBody || {})
		};

		setSelectedChat({ ...selectedChat, ...propsBody });

		this.editChat = mobxSaiWs(
			resBody,
			{
				id: ["editChat", selectedChat.id, user.id],
				fetchIfHaveData: true,
				fetchIfPending: true,
				service: "chat",
				method: "edit_chat",
				onError: editChatErrorHandler,
				onSuccess: editChatSuccessHandler,
				debounceMs: 1000,
				deepCompare: true,
				initialMessage: resBody,
				preData: {
					enabled: true,
					targetCacheId: ["getChats", user.id],
					updater: (prev: ChatInfo[]) => prev.map(chat =>
						chat.id === selectedChat.id ? { ...chat, ...propsBody } : chat
					),
					onApply: (body: ProtoEditChatRequest) => ({ ...selectedChat, ...body }),
					onRevert: (snapshot) => setSelectedChat(snapshot)
				}
			}
		);
	};

	// LINKS

	// GET INVITE LINKS

	inviteLinks: MobxSaiWsInstance<any> = {};

	getInviteLinksAction = async () => {
		const { getMyProfile } = profileStore;
		const { selectedChat } = chatsInteractionsStore;
		const { getInviteLinksSuccessHandler, getInviteLinksErrorHandler } = chatsServicesStore;

		checker(selectedChat, "[getInviteLinksAction] no selectedChat");

		const user = await getMyProfile();

		const body: ProtoGetInviteLinksRequest = {
			user_id: user.id,
			chat_id: selectedChat.id
		};

		this.inviteLinks = mobxSaiWs(
			body,
			{
				id: ["getInviteLinks", selectedChat.id, user.id],
				fetchIfHaveData: false,
				fetchIfPending: false,
				storageCache: true,
				takeCachePriority: "localStorage",
				pathToArray: "invite_links",
				service: "chat",
				method: "get_invite_links",
				onError: getInviteLinksErrorHandler,
				onSuccess: getInviteLinksSuccessHandler,
			}
		);
	};

	// CREATE INVITE LINK

	createInviteLink: MobxSaiWsInstance<any> = {};

	createInviteLinkAction = async () => {
		const { getMyProfile } = profileStore;
		const {
			createInviteLinkSuccessHandler,
			createInviteLinkErrorHandler,
			createInviteLinkTempData,
			extractInviteLinkData
		} = chatsServicesStore;
		const {
			createChatLinkForm: { values: { name, creates_join_request } },
			selectedChat
		} = chatsInteractionsStore;

		const user = await getMyProfile();

		checker(selectedChat, "[createInviteLinkAction] no selected chat");

		const body: ProtoCreateInviteLinkRequest = {
			user_id: user.id,
			chat_id: selectedChat.id,
			name,
			expires_at: new Date().getTime() + 60 * 60 * 1000,
			usage_limit: 0,
			creates_join_request
		};

		this.createInviteLink = mobxSaiWs(
			body,
			{
				id: ["createInviteLink", selectedChat.id, user.id],
				fetchIfHaveData: true,
				fetchIfPending: true,
				service: "chat",
				method: "create_invite_link",
				onError: createInviteLinkErrorHandler,
				onSuccess: createInviteLinkSuccessHandler,
				optimisticUpdate: {
					enabled: true,
					createTempData: createInviteLinkTempData,
					extractRealData: extractInviteLinkData,
					targetCacheId: ["getInviteLinks", selectedChat.id, user.id],
					onError: () => false,
					updateCache: "both",
				}
			}
		);
	};

	// REVOKLE INVITE LINK ACTION

	revokeInviteLink: MobxSaiWsInstance<ProtoRevokeInviteLinkResponse> = {};

	revokeInviteLinkAction = async () => {
		const { revokeInviteLinkSuccessHandler, revokeInviteLinkErrorHandler } = chatsServicesStore;
		const { getMyProfile } = profileStore;
		const { selectedLink, selectedChat } = chatsInteractionsStore;

		checker(selectedLink, "[revokeInviteLinkAction] no selected link");
		checker(selectedChat, "[revokeInviteLinkAction] no selected chat");

		const user = await getMyProfile();

		const body: ProtoRevokeInviteLinkRequest = {
			user_id: user.id,
			link_id: selectedLink.id
		};

		this.revokeInviteLink = mobxSaiWs(
			body,
			{
				id: ["revokeInviteLink", selectedChat.id, user.id],
				fetchIfHaveData: true,
				fetchIfPending: false,
				service: "chat",
				method: "revoke_invite_link",
				onError: revokeInviteLinkErrorHandler,
				onSuccess: revokeInviteLinkSuccessHandler,
				optimisticUpdate: {
					enabled: true,
					targetCacheId: ["getInviteLinks", selectedChat.id, user.id],
					updateCache: "both",
					deleteMode: true,
					deleteId: selectedLink.id
				}
			}
		);
	};

	editInviteLink: MobxSaiWsInstance<any> = {};

	editInviteLinkAction = async () => {
		const { getMyProfile } = profileStore;
		const {
			editChatLinkForm: { values },
			selectedChat,
			selectedLink
		} = chatsInteractionsStore;
		const { editInviteLinkSuccessHandler, editInviteLinkErrorHandler } = chatsServicesStore;

		checker(selectedLink, "[editInviteLinkAction] no selected link");
		checker(selectedChat, "[editInviteLinkAction] no selected chat");

		const user = await getMyProfile();

		const body: ProtoEditInviteLinkRequest = {
			user_id: user.id,
			link_id: selectedLink.id,
			name: values.name || selectedLink.name,
			expires_at: values.expires_at || selectedLink.expires_at,
			usage_limit: values.usage_limit || selectedLink.usage_limit,
			creates_join_request: values.creates_join_request || selectedLink.creates_join_request
		};

		this.editInviteLink = mobxSaiWs(
			body,
			{
				id: ["editInviteLink", selectedChat.id, user.id],
				fetchIfHaveData: true,
				fetchIfPending: false,
				service: "chat",
				method: "edit_invite_link",
				onError: editInviteLinkErrorHandler,
				onSuccess: editInviteLinkSuccessHandler,
				optimisticUpdate: {
					enabled: true,
					targetCacheId: ["getInviteLinks", selectedChat.id, user.id],
					updateCache: "both",
					updateMode: true,
					updateId: selectedLink.id,
					updateTempData: (body, currentData) => ({
						...currentData,
						name: body.name,
						expires_at: body.expires_at,
						usage_limit: body.usage_limit,
						creates_join_request: body.creates_join_request
					})
				}
			}
		);
	};

	// MEMBERS

	members: MobxSaiWsInstance<ProtoGetChatMembersResponse> = {};

	getMembersAction = async (selectedChat?: ChatInfo) => {
		const { getMyProfile } = profileStore;
		const { getChatMembersErrorHandler, getChatMembersSuccessHandler } = chatsServicesStore;

		checker(selectedChat, "[getMembersAction] no selected chat");

		const user = await getMyProfile();

		const params = mobxState<ProtoGetChatMembersRequest>({
			user_id: user.id,
			chat_id: selectedChat.id,
			limit: 20,
			up: false
		})("params");

		this.members = mobxSaiWs(
			params.params,
			{
				id: ["getChatMembers", selectedChat.id, user.id],
				fetchIfHaveData: true,
				fetchIfPending: false,
				storageCache: true,
				takeCachePriority: "localStorage",
				pathToArray: "members",
				service: "chat",
				method: "get_chat_members",
				onError: getChatMembersErrorHandler,
				onSuccess: getChatMembersSuccessHandler,
			}
		);
	};

	inviteLinkPreview: MobxSaiWsInstance<ProtoGetChatPreviewByInviteLinkResponse> = {};

	inviteLinkPreviewAction = async (inviteLink: string) => {
		const { getMyProfile } = profileStore;
		const { selectedChat } = chatsInteractionsStore;
		const { getChatPreviewByInviteLinkSuccessHandler, getChatPreviewByInviteLinkErrorHandler } = chatsServicesStore;

		const user = await getMyProfile();

		checker(selectedChat, "[inviteLinkPreviewAction] no selected chat");

		const body: ProtoGetChatPreviewByInviteLinkRequest = {
			user_id: user.id,
			invite_link: inviteLink
		};

		this.inviteLinkPreview = mobxSaiWs(
			body,
			{
				id: ["getChatPreviewByInviteLink", inviteLink, user.id],
				fetchIfHaveData: false,
				fetchIfPending: false,
				service: "chat",
				method: "get_chat_preview_by_invite_link",
				onCacheUsed: getChatPreviewByInviteLinkSuccessHandler,
				onError: getChatPreviewByInviteLinkErrorHandler,
				onSuccess: getChatPreviewByInviteLinkSuccessHandler,
			}
		);
	};

	// ACCEPT INVITE OR SEND JOIN REQUEST

	acceptInviteOrSendJoinRequest: MobxSaiWsInstance<any> = {};

	acceptInviteOrSendJoinRequestAction = async (previewLink: ProtoGetChatPreviewByInviteLinkResponse) => {
		const { getMyProfile } = profileStore;
		const { selectedChat } = chatsInteractionsStore;
		const {
			acceptInviteErrorHandler,
			acceptInviteSuccessHandler,
			sendJoinRequestErrorHandler,
			sendJoinRequestSuccessHandler
		} = chatsServicesStore;

		const user = await getMyProfile();

		checker(selectedChat, "[acceptInviteOrSendJoinRequestAction] no selected chat");

		let method: string;

		if (previewLink.invite_link_info?.creates_join_request) method = "request_join_chat";
		else method = "join_chat_by_link";

		checker(previewLink.chat, "[acceptInviteOrSendJoinRequestAction] no chat", true);
		checker(previewLink.invite_link_info, "[acceptInviteOrSendJoinRequestAction] no invite link info", true);

		const body: ProtoJoinChatByLinkRequest | ProtoRequestJoinChatRequest = {
			user_id: user.id,
			chat_id: previewLink.chat.id,
			invite_link: previewLink.invite_link_info.link,
		};

		const onError = method === "request_join_chat" ? sendJoinRequestErrorHandler : acceptInviteErrorHandler;
		const onSuccess = method === "request_join_chat" ? sendJoinRequestSuccessHandler : acceptInviteSuccessHandler;

		this.acceptInviteOrSendJoinRequest = mobxSaiWs(
			body,
			{
				id: ["acceptInviteOrSendJoinRequest", method, previewLink.chat.id, user.id],
				fetchIfHaveData: true,
				fetchIfPending: false,
				service: "chat",
				method,
				onError,
				onSuccess,
			}
		);
	};

	// GET CHAT BY CHAT ID OR USER CHAT ID 

	chatByChatIdOrUserChatId: MobxSaiWsInstance<ProtoGetChatByIdResponse | ProtoGetChatByUserChatIdRequest> = {};

	getChatByChatIdOrUserChatId = async (chatIdOrUserChatId: string, which: ChatIdOrUserChatId = "chat_id") => {
		const { getMyProfile } = profileStore;
		const {
			getChatByIdSuccessHandler,
			getChatByIdErrorHandler,
			getChatByUserChatIdSuccessHandler,
			getChatByUserChatIdErrorHandler
		} = chatsServicesStore;

		const user = await getMyProfile();
		const isChatId = which === "chat_id";

		const onSuccess = isChatId ? getChatByIdSuccessHandler : getChatByUserChatIdSuccessHandler;
		const onError = isChatId ? getChatByIdErrorHandler : getChatByUserChatIdErrorHandler;

		const body: Partial<ProtoGetChatByIdRequest & ProtoGetChatByUserChatIdRequest> = {
			user_id: user.id,
		};

		if (isChatId) body.chat_id = chatIdOrUserChatId;
		else body.user_chat_id = chatIdOrUserChatId;

		this.chatByChatIdOrUserChatId = mobxSaiWs(
			body,
			{
				id: ["getChatByChatIdOrUserChatId", user.id, chatIdOrUserChatId],
				service: "chat",
				method: isChatId ? "get_chat_by_id" : "get_chat_by_user_chat_id",
				storageCache: true,
				takeCachePriority: "localStorage",
				fetchIfHaveLocalStorage: true,
				onSuccess,
				onError
			}
		);
	};
}

export const chatsActionsStore = new ChatsActionsStore();
