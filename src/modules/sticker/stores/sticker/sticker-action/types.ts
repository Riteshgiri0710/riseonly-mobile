export interface CreatePackBody {
	title: string;
	is_default?: boolean;
}

export interface CreatePackResponse {
	id: string;
	title: string;
	link: string;
	is_admin: boolean;
	is_default: boolean;
	created_at_ms: number;
	updated_at_ms: number;
}

export interface PackRecord {
	id: string;
	title: string;
	link: string;
	is_admin: boolean;
	is_default: boolean;
	created_at_ms: number;
	updated_at_ms: number;
	is_saved?: boolean;
}

export interface StickerRecord {
	id: string;
	pack_id: string;
	file_url: string;
	width: number;
	height: number;
	position: number;
	created_at_ms: number;
	associated_emojis?: string[];
}

export interface GetDefaultPacksResponse {
	packs: PackRecord[];
	total: number;
}

export interface GetSavedPacksResponse {
	packs: PackRecord[];
	next_relative_id?: string;
}

export interface GetStickersByPackIdResponse {
	pack: PackRecord | null;
	stickers: StickerRecord[];
}

export interface GetStickersByPackLinkResponse {
	pack: PackRecord | null;
	stickers: StickerRecord[];
}

export interface CreateStickerResponse {
	id: string;
	pack_id: string;
	file_url: string;
	width: number;
	height: number;
	position: number;
	created_at_ms: number;
}
