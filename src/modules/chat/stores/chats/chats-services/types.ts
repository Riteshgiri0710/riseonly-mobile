import { ChatInfo } from '../chats-actions/types';


export interface AuthRequest {
	type: 'auth';
	token: string;
	device_id?: string;
}

export interface GetChatsRequest {
	limit: number;
	relative_id?: string | null;
	up?: boolean;
}

export interface EditChatRequest {
	type: 'edit_chat';
	chat_id: string;
	updates: {
		title?: string;
		description?: string;
		is_public?: boolean;
		logo_url?: string;
		banner_url?: string;
		[key: string]: any;
	};
	request_id: string;
}

export interface DeleteChatRequest {
	type: 'delete_chat';
	chat_id: string;
	delete_for_both?: boolean;
	request_id: string;
}

export interface SendMessageRequest {
	type: 'send_message';
	chat_id: string;
	content: string;
	content_type: string;
	request_id: string;
}

export interface GetChatHistoryRequest {
	type: 'get_chat_history';
	chat_id: string;
	limit: number;
	request_id: string;
}

export interface PingRequest {
	type: 'ping';
}

export interface PongResponse {
	type: 'pong';
	timestamp: number;
	from?: string;
}

export interface ChatsListResponse {
	type: 'chats_list';
	limit: number;
	relative_id: string | null;
	is_have_more: boolean;
	chats: ChatInfo[];
	request_id: string;
}

export interface AuthResultResponse {
	type: 'auth_result';
	success: boolean;
	message: string;
	user_id?: string;
}

export interface ChatCreatedResponse {
	type: 'chat_created';
	chat_id: string;
	title: string;
	type_: string;
	created_at: number;
	description: string;
	is_public: boolean;
	request_id: string;
}

export interface ChatEditedResponse {
	type: 'chat_edited';
	chat_id: string;
	title: string;
	description?: string;
	username?: string;
	is_public: boolean;
	logo_url?: string;
	banner_url?: string;
	slow_mode_interval: number;
	request_id: string;
}

export interface ChatDeletedResponse {
	type: 'chat_deleted';
	chat_id: string;
	request_id: string;
}

export interface ErrorResponse {
	type: 'error';
	code: number;
	message: string;
	request_id?: string;
}

export interface MessagePreview {
	id: string;
	sender_id: string;
	sender_name: string;
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

export interface WebSocketCloseEvent {
	code: number;
	reason: string;
}
