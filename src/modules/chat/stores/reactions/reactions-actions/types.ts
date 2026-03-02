export interface ProtoAddReactionRequest {
	user_id: string;
	message_id: string;
	reaction: string;
}

export interface ProtoAddReactionResponse {
	success: boolean;
	error: string;
	message_od?: string;
	reaction?: string;
}

export interface ProtoRemoveReactionRequest {
	user_id: string;
	message_id: string;
	reaction: string;
}

export interface ProtoRemoveReactionResponse {
	success: boolean;
	error: string;
	message_id?: string;
	reaction?: string;
}