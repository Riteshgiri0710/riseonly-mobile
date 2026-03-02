import { User } from "src/modules/user/stores/profile/types";
import { ChatInfo } from "src/modules/chat/stores/chats/chats-actions/types";

export interface MessageCreatedMediaItem {
	file_url?: string;
	thumbnail_url?: string | null;
	file_name?: string;
	file_size?: number;
	media_type?: string;
	mime_type?: string;
	width?: number;
	height?: number;
	duration?: number | null;
	bitrate?: number | null;
	fps?: number | null;
	codec?: string | null;
	waveform?: string | null;
}

export interface MessageCreatedSuccessResponse {
	message_id?: string;
	id?: string;
	chat_id: string;
	sender_id: string;
	sender_name?: string;
	content: string;
	content_type: string;
	timestamp?: number;
	created_at?: number;
	reply_to?: string | null;
	forward_from?: string | null;
	media_url?: string | null;
	media_items?: MessageCreatedMediaItem[];
	sender_info?: User;
	sender?: User;
	is_system_message?: boolean;
	has_attachments?: boolean;
	is_forwarded?: boolean;
	is_reply?: boolean;
	has_reactions?: boolean;
	is_pinned?: boolean;
	is_mentioned_you?: boolean;
	chat?: ChatInfo;
}

export interface ReactionAddedSuccessResponse {
	chat_id: string;
	message_id: string;
	event_type: "reaction_added";
	reacted_by: Array<{
		reaction: string;
		created_at: number;
		sender: User;
		chat_id: string;
	}>;
	timestamp: number;
}

export interface ReactionRemovedSuccessResponse {
	chat_id: string;
	message_id: string;
	event_type: "reaction_removed";
	reacted_by: Array<{
		reaction: string;
		created_at: number;
		sender: User;
		chat_id: string;
	}>;
	reaction: string;
	remover_id: string;
	reaction_id: string;
	timestamp: number;
}

export interface MessageEditedSuccessResponse {
	chat_id: string;
	message_id: string;
	new_content: string;
	original_content?: string;
	edit_timestamp: number;
}