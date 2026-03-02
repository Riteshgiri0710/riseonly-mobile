export type TagExistEntityType = "USER" | "CHANNEL";

export interface CheckTagExistResponse {
	success: boolean;
	error: string;
	exists: boolean;
	is_reserved: boolean;
	occupied_by_type: TagExistEntityType;
	message: string;
}

export interface GlobalSearchByTagRequest {
	tag: string;
	relative_id?: string | null;
	up: boolean;
	limit: number;
	user_id?: string | null;
}

export interface GlobalSearchByTagResponse {
	success: boolean;
	error: string;
	results: SearchResultItem[];
	has_more: boolean;
	next_cursor?: string;
}

export interface SearchResultItem {
	entity_type: "CHANNEL" | "USER";
	entity_id: string;
	user?: SearchUserResult;
	chat?: SearchChatResult;
}

export interface SearchUserResult {
	id: string;
	name: string;
	tag: string;
	is_premium: boolean;
	logo: string;
	more: SearchUserMore;
	user_chat_id?: string;
	chat_id?: string;
}

export interface SearchUserMore {
	logo: string;
	role: string;
	status: string;
	p_lang: string[];
	who: string;
	rating: number;
	streak: number;
	description?: string;
}

export interface SearchChatResult {
	id: string;
	title: string;
	logo_url: string;
	tag?: string;
	is_verified: boolean;
	is_public: boolean;
	description: string;
	member_count: number;
}

