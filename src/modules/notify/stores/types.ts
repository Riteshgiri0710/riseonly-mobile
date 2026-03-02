import { ReactNode } from 'react';

export type NotifyType = "success" | "error" | "warning" | "info" | "system";

export interface NotifyData {
	title?: string;
	message: string;
	icon?: ReactNode;
	duration?: number;
	position?: "top" | "bottom";
	offset?: number;
	callback?: () => void;
	onPress?: () => void;
	onHidden?: () => void;
	hideOnPress?: boolean;
	logo?: string;
	image?: string;
}

// NOTIFICATION

type NotificationType = "System" | "NewLogin" | "Mention" | "Subscription" | "CommentReply" | "CommentLike" | "PostLike";

export interface Notify {
	id: number;
	title: string;
	body: string;
	type: NotificationType;
	created_at: string;
	group_count: number;
	actors: Actor[];
	is_read: boolean;
}
interface Actor {
	id: number;
	actor_id: string;
	actor_name: string | null;
	actor_avatar: string | null;
	actor_tag: string | null;
}
