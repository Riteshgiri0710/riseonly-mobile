import { ProtoChatTheme } from '@modules/theme/stores';
import { GetMessageMessage, TypingResponse } from 'src/modules/chat/stores/message/message-actions/types';
import { User } from 'src/modules/user/stores/profile';

export interface MessagePreview {
	id: string;
	sender_id: string;
	sender_name: string;
	sender: User;
	content: string;
	timestamp: number;
	content_type: string;
	is_system_message?: boolean;
	system_message_type?: string;
	has_attachments?: boolean;
	is_forwarded?: boolean;
	is_reply?: boolean;
	has_reactions?: boolean;
	is_pinned?: boolean;
	caption?: string;
	media_info?: any;
}

export type ChatType = "PRIVATE" | "GROUP" | "CHANNEL" | "FAVOURITES";

export enum ChatTypeEnum {
	PRIVATE = 'PRIVATE',
	GROUP = 'GROUP',
	CHANNEL = 'CHANNEL',
	FAVOURITES = 'FAVOURITES'
}

export interface ProtoChatUnreadMentions {
	message_ids: string[];
	count: number;
}

export interface ProtoChatUnreadInfo {
	reactions?: ProtoChatUnreadReactions;
	messages?: ProtoChatUnreadMessages;
	mentions?: ProtoChatUnreadMentions;
}

export interface ProtoChatUnreadReactions {
	reactions: string[];
	count: number;
}

export interface ProtoChatUnreadMessages {
	count: number;
}

export interface ChatInfo {
	id: string;
	title: string;
	type: ChatType;
	last_message: GetMessageMessage | null;
	unread_count: number;
	is_pinned: boolean;
	is_muted: boolean;
	updated_at: number;
	allowed_reactions: string[];
	created_at: number;
	description?: string;
	logo_url?: string;
	banner_url?: string;
	username?: string;
	member_count: number;
	is_verified: boolean;
	is_public: boolean;
	role?: string;
	joined_at?: number;
	notifications_enabled: boolean;
	mute_until?: number;
	custom_title?: string;
	is_anonymous: boolean;
	custom_color?: string;
	last_activity?: number;
	can_invite_users: boolean;
	can_pin_messages: boolean;
	can_manage_chat: boolean;
	creator_info?: string;
	user?: any;
	participant: User;
	tag?: string;
	forward_in_chat_enabled: boolean;
	unread_info: ProtoChatUnreadInfo;

	// OTHER DATA
	typing_datas: TypingResponse[];
	selectedMessageToReply: GetMessageMessage | null;
	selectedMessageToEdit: GetMessageMessage | null;
}

export interface GetChatsResponse {
	type: 'chats_list';
	limit: number;
	relative_id: string | null;
	is_have_more: boolean;
	chats: ChatInfo[];
	request_id: string;
}


export interface CreateChatRequest {
	title: string;
	type: string;
	description: string;
	is_public: boolean;
	logo_url: string;
	banner_url: string;
	participants: string[];
	forward_in_chat_enabled: boolean;
	tag?: string;
}

export interface CreateGroupRequest {
	title: string;
	type: string;
	description: string;
	is_public: boolean;
	logo_url: string;
	banner_url: string;
	participants: string[];
	forward_in_chat_enabled: boolean;
}

export interface ProtoEditChatRequest {
	user_id: string;
	chat_id: string;
	title?: string;
	description?: string;
	username?: string;
	is_public?: boolean;
	logo_url?: string;
	banner_url?: string;
	slow_mode_interval?: number;
	theme?: ProtoChatTheme;
	disable_theme_for_user?: boolean;
	forward_in_chat_enabled?: boolean;
}

export interface ProtoGetInviteLinksRequest {
	user_id: string;
	chat_id: string;
}

export interface ProtoCreateInviteLinkResponse {
	success: boolean;
	error: string;
	stats: null;
	invite_links?: ProtoInviteLink[];
}

export interface ProtoInviteLink {
	id: string;
	chat_id: string;
	creator_id: string;
	link: string;
	name?: string;
	created_at: number;
	expires_at?: number;
	usage_limit?: number;
	used_count: number;
	is_revoked: boolean;
	revoked_at?: number;
	creates_join_request: boolean;
	is_primary: boolean;
}

export interface ProtoCreateInviteLinkRequest {
	user_id: string;
	chat_id: string;
	name?: string;
	expires_at?: number;
	usage_limit?: number;
	creates_join_request: boolean;
}

export interface ProtoCreateInviteLinkResponse {
	success: boolean;
	error: string;
	invite_link?: ProtoInviteLink;
}

export interface ProtoRevokeInviteLinkRequest {
	user_id: string;
	link_id: string;
}

export interface ProtoRevokeInviteLinkResponse {
	success: boolean;
	error: string;
	message?: string;
}

export interface ProtoEditInviteLinkRequest {
	user_id: string;
	link_id: string;
	name?: string;
	expires_at?: number;
	usage_limit?: number;
	creates_join_request?: boolean;
}

export interface ProtoEditInviteLinkResponse {
	success: boolean;
	error: string;
	invite_link?: ProtoInviteLink;
}

export interface ProtoGetChatMembersRequest {
	user_id: string;
	chat_id: string;
	limit: number;
	relative_id?: string;
	up: boolean;
}

export interface ProtoGetChatMembersResponse {
	success: boolean;
	error: string;
	members: ProtoChatMember[];
	pagination: ProtoPaginationInfo;
}

export interface ProtoPaginationInfo {
	has_more: boolean;
	first_id?: string;
	last_id?: string;
	total_count?: number;
}

export interface ProtoChatMember {
	user_id: string;
	chat_id: string;
	role: string;
	joined_at: number;
	is_muted: boolean;
	notifications_enabled: boolean;
	mute_until?: number;
	custom_title?: string;
	is_anonymous: boolean;
	custom_color?: string;
	last_activity_at?: number;

	can_invite_users: boolean;
	can_accept_join_requests: boolean;
	can_ban_members: boolean;
	can_kick_members: boolean;
	can_pin_messages: boolean;
	can_manage_chat: boolean;
	can_delete_messages: boolean;
	can_restrict_members: boolean;
	can_promote_members: boolean;
	can_change_info: boolean;
	can_post_messages: boolean;
	can_edit_messages: boolean;
	can_add_web_page_previews: boolean;
	can_send_media: boolean;
	can_send_polls: boolean;
	can_send_stickers: boolean;

	user: ProtoChatMemberUser;
}

export interface ProtoChatMemberUser {
	id: string;
	name: string;
	phone: string;
	tag: string;
	avatar_url?: string;
	is_online: boolean;
	last_seen?: number;
	is_verified: boolean;
	is_premium: boolean;
	is_blocked: boolean;
	bio?: string;
	status?: string;
}

export interface ProtoGetChatPreviewByInviteLinkRequest {
	invite_link: string;
	user_id?: string;
}

export interface ProtoGetChatPreviewByInviteLinkResponse {
	success: boolean;
	error: string;
	chat?: ChatInfo;
	is_member: boolean;
	can_join: boolean;
	join_status?: "can_join" | "requires_approval" | "already_member" | "link_expired" | "link_invalid";
	invite_link_info?: ProtoInviteLink;
}

export interface ProtoJoinChatByLinkRequest {
	user_id: string;
	chat_id: string;
	invite_link: string;
	message?: string;
}

export interface ProtoRequestJoinChatRequest {
	user_id: string;
	chat_id: string;
	invite_link: string;
	message?: string;
}

export interface ProtoGetChatByIdRequest {
	user_id: string;
	user_chat_id: string;
}

export interface ProtoGetChatByIdResponse {
	success: boolean;
	error: string;
	chat: ChatInfo;
}

export interface ProtoGetChatByUserChatIdRequest {
	user_id: string;
	chat_id: string;
}

export interface ProtoGetChatByUserChatIdResponse {
	success: boolean;
	error: string;
	chat: ChatInfo;
}

export type ChatIdOrUserChatId = "chat_id" | "user_chat_id";
