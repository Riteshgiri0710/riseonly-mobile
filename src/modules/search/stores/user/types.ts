
export interface SearchUser {
	id: string;
	name: string;
	tag: string;
	is_premium: boolean;
	is_blocked: boolean;
	logo: string;
	more: SearchUserMore;
}

export interface SearchUserMore {
	p_lang: string | null;
	who: string;
	rating: number;
	streak: number;
	logo: string;
	role: string;
	status: string;
}