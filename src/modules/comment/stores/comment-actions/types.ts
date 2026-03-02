import { AuthorInfo, VirtualList } from '@core/config/types';

export type CommentSortType = "feed" | "new" | "old" | "my";
export type RespliesSortType = "popular" | "new" | "old" | "my";

// PARAMS/BODY
export interface GetCommentsParams {
   sort?: CommentSortType;
   relativeId: number | null;
   limit: number;
   up: boolean;
}

export interface GetRepliesParams {
   sort?: Omit<CommentSortType, "feed">;
   relativeId?: number | null;
   up?: boolean;
   page?: number;
   limit?: number;
}

export interface CreateCommentBody {
   content: string;
   original_content: string;
   parent_id?: number | null;
   addressed_to_name?: string;
   addressed_to_tag?: string;
}

// RESPONSES

export interface GetCommentsResponse {
   id: number | string;
   content: string;
   original_content: string;
   created_at: string;
   updated_at: string;
   post_id: number;
   author_id: string;
   parent_id: number | null;
   replies_count: number;
   is_temp: boolean;
   likes_count: number;
   dislikes_count: number;
   user_liked: boolean;
   user_disliked: boolean;
   user_liked_static?: boolean;
   user_disliked_static?: boolean;
   addressed_to_name: string | null;
   addressed_to_tag: string | null;
   author: AuthorInfo;
   preview_reply_comment?: GetCommentsResponse | null;

   // REPLIES SORT CACHE
   selectedRepliesSort?: RespliesSortType;
   cachedReplies?: VirtualList<GetCommentsResponse[]>;
   cachedRepliesOld?: VirtualList<GetCommentsResponse[]>;
   cachedRepliesNew?: VirtualList<GetCommentsResponse[]>;
   cachedRepliesMy?: VirtualList<GetCommentsResponse[]>;

   // OPTIMIZATION
   oldIsLiked: boolean;
   oldIsDisliked: boolean;
}
