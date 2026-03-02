
import { AuthorInfo, VirtualList } from '@config/types';
import { CommentSortType, GetCommentsResponse } from 'src/modules/comment/stores';
// GET POSTS

export interface GetPostFeedResponse {
   id: number | string;
   title: string;
   content: string;
   original_content: string;
   hashtags: string[];
   tags: string[];
   views_count: number;
   created_at: string;
   updated_at: string;
   author_id: string;
   main_comments_count: number;
   comments_count: number;
   can_comment: boolean;
   likes_count: number;
   favorites_count: number;
   images: string[];
   is_liked: boolean;
   is_favorited: boolean;
   author: AuthorInfo;

   // COMMENTS SORT CACHE
   selectedCommentSort?: CommentSortType;
   cachedComments?: VirtualList<GetCommentsResponse[]>;
   cachedCommentsOld?: VirtualList<GetCommentsResponse[]>;
   cachedCommentsNew?: VirtualList<GetCommentsResponse[]>;
   cachedCommentsMy?: VirtualList<GetCommentsResponse[]>;

   // TEMP DATA
   isTemp?: boolean;
   progress?: number;

   // OPTIMIZATION
   oldIsLiked: boolean;
   oldIsFav: boolean;
}

export interface GetUserPostsParams {
   sort?: "new" | "old";
   relative_id: number | null;
   limit: number;
   up: boolean;
   feed_session_id?: string;
}

export interface GetPostsParams {
   relative_id?: number | string | null;
   total?: number;
   limit?: number;
   up?: boolean;
   page?: number;
   q?: string;
   new_feed?: boolean;
   feed_session_id?: string;
}

export interface GetPostsByHashtagParams extends Omit<GetPostsParams, 'q'> {
   hashtag: string;
}

export interface GetPostsActionSettings {
   needAddToArr?: boolean;
   fetchIfHaveData?: boolean;
}

export interface CreatePostBody {
   "can_comment": boolean;
   "title": string;
   "original_content": string;
   "content": string;
   "hashtags": string[];
   "tags": string[];
   "images": string[];
}