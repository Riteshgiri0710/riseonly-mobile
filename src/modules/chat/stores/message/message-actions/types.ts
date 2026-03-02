import { FileUploadState } from '@lib/mobx-toolbox/mobxSaiWs';
import { ChatInfo } from 'src/modules/chat/stores/chats/chats-actions/types';
import { User } from 'src/modules/user/stores/profile';

export interface GetMessagesBody {
	"chat_id"?: string;
	"user_chat_id"?: string;
	"limit": number;
	"relative_id": number | null;
	"up": boolean;
}

export interface ReplyToMessage {
	caption: string,
	content: string,
	content_type: string,
	created_at: number,
	media_items: MessageMediaItems[],
	message_id: string,
	sender: User,
	sender_id: string,
}

export interface ProtoReactionSummary {
	reaction: string;
	count: number;
	reacted_by_you: boolean;
}

export interface ProtoReactedByEntry {
	reaction: string;
	created_at: number;
	sender: User;
	chat_id: string;
}

export interface GetMessageMessage {
	"chat": ChatInfo;
	"id": string;
	"sender_id": string,
	"sender_name": string,
	"content": string;
	"original_content": string,
	"created_at": number,
	"timestamp": number,
	"content_type": string,
	"sender": User,
	"is_system_message": boolean,
	"has_attachments": boolean,
	"is_forwarded": boolean,
	"is_reply": boolean,
	"reply_to": ReplyToMessage | null,
	"has_reactions": boolean,
	"reactions_unreaded"?: boolean;
	"is_mentioned_you"?: boolean;
	"is_pinned": boolean;
	"chat_id"?: string;
	"encryption_info"?: {
		is_encrypted: boolean;
		encrypted_for?: string[];
		sender_key_id?: string;
		encryption_version?: number;
	};
	reacted_by: ProtoReactedByEntry[];
	reactions: ProtoReactionSummary[];
	is_read: boolean;

	/** og:title, og:description, og:image of first link. link_preview_type: "SMALL" | "BIG" */
	link_preview?: {
		title?: string;
		description?: string;
		image_url?: string;
		link_preview_type?: "SMALL" | "BIG";
	} | null;

	// FROM MOBILE
	isSelecting?: boolean;
	isTemp?: boolean;
	isSelected?: boolean;
	fileUploadStates?: FileUploadState[];
	file_urls?: string[];
	media_items?: MessageMediaItems[];
}

export interface MessageMediaItems {
	media_type: "image" | "video" | "audio" | "voice" | "video_note" | "document" | "gif" | "sticker";
	file_id?: string;
	file_url?: string;
	thumbnail_url?: string;
	duration?: number;
	width?: number;
	height?: number;
	file_name?: string;
	file_size?: number;
	mime_type?: string;
	variants?: MessageMediaVariant[];
	waveform?: string;
	bitrate?: number;
	fps?: number;
	codec?: string;
	/** Sticker-only */
	sticker_id?: string;
	pack_id?: string;
	sticker_type?: "static" | "animated" | "lottie";
	associated_emojis?: string[];
}

export interface MessageMediaVariant {
	variant_type: string;
	width: number;
	height: number;
	size: number;
	file_url: string;
	file_id?: string;
	bitrate?: number;
	quality?: string;
}

export interface GetMessagesResponse {
	type: string;
	chat_id: string;
	limit: number;
	relative_id: null | string;
	is_have_more: boolean;
	messages: GetMessageMessage[];
	request_id: string;
}
export interface CreateMessageResponse {
	type: string;
	message_id: string;
	id: string;
	sender_id: string;
	sender_name: string;
	content: string;
	is_reply: boolean;
	is_forwarded: boolean;
	original_content: string;
	chat_info: ChatInfo;
	content_type: string;
	created_at: number;
	is_pinned: boolean;
	timestamp: number;
	has_reactions: boolean;
	is_system_message: boolean;
	has_attachments: boolean;
	entities: null;
	reply_to: null;
	forward_info: {
		from_chat_id: null | string;
		from_message_id: null | string;
		sender_name: null | string;
		date: null | number;
	};
	media_info: {
		type_: string;
		file_url: string;
		thumbnail_url: null | string;
		duration: null | number;
		width: null | number;
		height: null | number;
		file_name: null | string;
		file_size: null | number;
		mime_type: null | string;
		bitrate: null | number;
		fps: null | number;
		codec: null | string;
		waveform: null | string;
		variants: any[]; // ProtoMediaVariant[]
	};
	caption: string;
	request_id: string;
	sender: User;
}

export interface CreateMessageBody {
	"chat_id"?: string;
	"content": string;
	"original_content": string;
	"content_type": string;
	"reply_to_id": null | string;
	"forward_from_message_id": null | string;
	"forward_from_chat_id": null | string;
	"media_group_id": null | string;
	"entities": null;
	"user_chat_id"?: string;
	"caption": string | null;
	"is_encrypted"?: boolean;
	"file_urls"?: string[];
	"media_items"?: MessageMediaItems[];
}

export interface TypingBody {
	"chat_id": string;
	"is_typing": boolean;
	"user_id": string;
}

export interface TypingResponse {
	"chat_id": string;
	"user_id": string;
	"user_name": string;
	"user_tag": string;
	"user_chat_id": string;
	"p_langs": string[];
	"is_typing": boolean;
}

export interface ProtoGetMediaMessagesRequest {
	user_id: string;
	chat_id: string;
	limit?: number;
	relative_id?: string | null; // Format: message_id:item_index
	up?: boolean;
}

export interface MediaItemResponse {
	id: string; // Format: message_id:item_index
	message_id: string;
	chat_id: string;
	sender_id: string;
	sender_name: string;
	sender: User | null;
	caption: string;
	content_type: string;
	created_at: number;
	timestamp: number;
	media_info: MessageMediaItems;
	media_index: number;
	total_media_in_message: number;
}

export interface ProtoGetMediaMessagesResponse {
	success: boolean;
	error: string;
	media_items: MediaItemResponse[];
	is_have_more: boolean;
}

export interface MarkChatAsReadBody {
	user_id: string;
	chat_id: string;
}

export interface MarkChatAsReadResponse {
	success: boolean;
	error: string;
	chat_id?: string;
}

export interface MarkMessagesAsReadBody {
	user_id: string;
	message_ids: string[];
}

export interface MarkMessagesAsReadResponse {
	success: boolean;
	error: string;
	read_message_ids: string[];
}

export interface MarkReactionsAsReadBody {
	user_id: string;
	message_ids: string[];
}

export interface MarkReactionsAsReadResponse {
	success: boolean;
	error: string;
	cleared_reaction_count: number;
}

export interface MarkMessageAsMentionedReadBody {
	user_id: string;
	message_ids: string[];
}

export interface MarkMessageAsMentionedReadResponse {
	success: boolean;
	error: string;
	read_message_ids: string[];
}

export interface DeleteMessagesBody {
	user_id: string;
	message_ids: string[];
	for_everyone?: boolean;
}

export interface DeleteMessagesResponse {
	success: boolean;
	error: string;
	deleted_message_ids: string[];
}

export interface EditMessageBody {
	user_id: string;
	message_id: string;
	content: string;
	entities?: string | null;
	chat_id: string;
	previous_content?: string;
}

export interface EditMessageResponse {
	success: boolean;
	error: string;
	message_id?: string;
	edit_date?: number;
}
