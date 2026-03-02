import { rust } from '@api/api';
import { DefaultResponse, VirtualList } from '@core/config/types';
import { mobxSaiWs } from '@lib/mobx-toolbox/mobxSaiWs';
import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';
import { numericId } from '@lib/numbers';
import { deleteSpacesFromStartAndEnd } from '@lib/text';
import { makeAutoObservable } from 'mobx';
import { MobxUpdateInstance, mobxState, useMobxUpdate } from 'mobx-toolbox';
import { postInteractionsStore } from 'src/modules/post/stores';
import { profileStore } from 'src/modules/user/stores/profile';
import { commentInteractionsStore } from '../comment-interactions/comment-interactions';
import { commentServiceStore } from '../comment-service/comment-service';
import { CommentSortType, CreateCommentBody, GetCommentsParams, GetCommentsResponse, GetRepliesParams, RespliesSortType } from './types';

class CommentActionsStore {
   constructor() { makeAutoObservable(this); }

   comments: MobxSaiWsInstance<VirtualList<GetCommentsResponse[]>> = {
      data: {
         items: [],
         list: [],
         limit: 0,
         relativeId: null,
      },
   };

   getCommentsAction = async (
      sort: CommentSortType = "feed",
      fetchIfHaveData = true,
      needAddToArr = true,
      fromContextMenu = false
   ) => {
      const { getCommentsSuccessHandler, getCommentsErrorHandler } = commentServiceStore;
      const { selectedPost } = postInteractionsStore;
      const { profile } = profileStore;
      const { clearCachedCommentsData } = commentServiceStore;
      const {
         commentScrollRef: { commentScrollRef },
         getCachedCommentsData,
         setCommentUpdater
      } = commentInteractionsStore;

      if (!selectedPost?.id || !profile?.id) return;
      const postId = selectedPost.id;

      // CACHE SYSTEM
      const cachedData = getCachedCommentsData();
      if (fromContextMenu && cachedData != null) {
         console.log("[getCommentsAction]: Cached data", cachedData);
         setCommentUpdater(useMobxUpdate(() => cachedData?.items));
         clearCachedCommentsData(postId);
         return;
      }

      const params = mobxState<GetCommentsParams>({
         relativeId: null,
         limit: 20,
         up: false,
         sort
      })("params");

      this.comments = mobxSaiWs(
         {
            ...params.params,
            post_id: postId,
            user_id: profile.id,
         },
         {
            id: postId + sort,
            fetchIfHaveData,
            dataScope: {
               startFrom: "top",
               scrollRef: commentScrollRef,
               botPercentage: 80,
               setParams: params.setParams,
               isHaveMoreResKey: "isHaveMore",
               relativeParamsKey: "relativeId",
               upOrDownParamsKey: "up",
               howMuchGettedToTop: 10000,
            },
            cacheSystem: {
               limit: 20,
            },
            fetchAddTo: {
               path: "items",
               addTo: needAddToArr ? "end" : undefined,
            },
            service: "comment",
            method: "get_comments",
            onSuccess: getCommentsSuccessHandler,
            onError: getCommentsErrorHandler,
         }
      );

      if (this.comments.setScrollRef) {
         this.comments.setScrollRef(commentScrollRef);
      }
   };

   // CREATE COMMENT

   createComment: MobxSaiWsInstance<any> = {};

   createCommentAction = async () => {
      const { createCommentSuccessHandler, createCommentErrorHandler } = commentServiceStore;
      const { selectedPost } = postInteractionsStore;
      const { profile } = profileStore;
      const {
         preCreateComment,
         lastTempId,
         lastCommentTextClone,
         lastRawCommentTextClone,
      } = commentServiceStore;
      const {
         commentText: { commentText },
         rawCommentText: { rawCommentText },
         rawReplyCommentText: { rawReplyCommentText },
         repliesOpen: { repliesOpen },
         selectedCommentForReply: { selectedCommentForReply }
      } = commentInteractionsStore;

      const postId = selectedPost?.id!;
      if (!commentServiceStore.checkPostIdProviding('createCommentAction') || !profile?.id) return;

      const cleanContent = repliesOpen
         ? deleteSpacesFromStartAndEnd(rawReplyCommentText)
         : deleteSpacesFromStartAndEnd(rawCommentText);

      const tempId = numericId();
      const commentTextClone = commentText;
      const rawCommentTextClone = rawCommentText;

      lastTempId.push(tempId);
      lastCommentTextClone.push(commentTextClone);
      lastRawCommentTextClone.push(rawCommentTextClone);

      if (typeof postId === "string") return;
      preCreateComment(postId, tempId);

      const body: CreateCommentBody = {
         content: cleanContent, // TODO: Переделать в нормальный редактор текста со своими правилами а не разметкой html
         original_content: cleanContent,
         parent_id: repliesOpen ? Number(selectedCommentForReply!.id) : null
      };

      this.createComment = mobxSaiWs(
         {
            post_id: postId,
            user_id: profile.id,
            content: body.content,
            original_content: body.original_content,
            parent_id: body.parent_id,
            addressed_to_name: null,
            addressed_to_tag: null
         },
         {
            id: "createCommentAction",
            service: "comment",
            method: "create_comment",
            takePath: "comment",
            fetchIfHaveData: true,
            fetchIfPending: true,
            onSuccess: createCommentSuccessHandler,
            onError: createCommentErrorHandler,
         }
      );
   };

   // LIKE COMMENT

   likeComment: MobxSaiWsInstance<DefaultResponse> = {};
   loading = false;

   likeCommentAction = async (commentId: number, newIsLiked: boolean) => {
      const { profile } = profileStore;
      const { lastLikeCommentId, likeCommentSuccessHandler, likeCommentErrorHandler } = commentServiceStore;

      if (!profile?.id) return;

      lastLikeCommentId.push(commentId);

      this.likeComment = mobxSaiWs(
         {
            comment_id: commentId,
            user_id: profile.id
         },
         {
            id: "likeCommentAction",
            service: "comment",
            method: "like_comment",
            fetchIfHaveData: true,
            onSuccess: likeCommentSuccessHandler,
            onError: likeCommentErrorHandler,
         }
      );
   };

   // DISLIKE COMMENT

   dislikeComment: MobxSaiWsInstance<DefaultResponse> = {};

   dislikeCommentAction = async (commentId: number, currentUpdater: MobxUpdateInstance<GetCommentsResponse>) => {
      const { profile } = profileStore;
      const { lastDislikeCommentId, dislikeCommentSuccessHandler, dislikeCommentErrorHandler } = commentServiceStore;

      if (!profile?.id) return;

      lastDislikeCommentId.push(commentId);

      this.dislikeComment = mobxSaiWs(
         {
            comment_id: commentId,
            user_id: profile.id
         },
         {
            id: "dislikeCommentAction",
            service: "comment",
            method: "dislike_comment",
            onSuccess: dislikeCommentSuccessHandler,
            onError: dislikeCommentErrorHandler,
         }
      );
   };

   // GET REPLIES

   replies: MobxSaiWsInstance<VirtualList<GetCommentsResponse[]>> = {};
   REPLIES_LIMIT = 20;

   clearRepliesData = () => {
      this.replies.data = {
         items: [],
         list: [],
         limit: 0,
         relativeId: null,
      };
   };

   getRepliesAction = (
      sort: RespliesSortType = "popular",
      fetchIfHaveData = true,
      needAddToArr = true,
      fromContextMenu = false
   ) => {
      const { selectedPost } = postInteractionsStore;
      const { profile } = profileStore;
      const {
         getRepliesSuccessHandler,
         getRepliesErrorHandler,
         clearCachedRepliesData
      } = commentServiceStore;
      const {
         selectedCommentForReply: { selectedCommentForReply },
         repliesScrollRef: { repliesScrollRef },
         setRepliesUpdater,
         getCachedRepliesData
      } = commentInteractionsStore;

      if (!selectedCommentForReply || !selectedPost || !profile?.id) return;
      const commentId = selectedCommentForReply.id;
      const postId = selectedPost.id;

      // CACHE SYSTEM
      const cachedData = getCachedRepliesData();
      if (fromContextMenu && cachedData != null) {
         console.log("[getCommentsAction]: Cached data", cachedData);
         // TODO: ПОСМОТРЕТЬ РАБОТАЕТ ИЛИ НЕТ
         setRepliesUpdater(useMobxUpdate(() => cachedData?.items || commentActionsStore.replies.data?.items));
         clearCachedRepliesData(postId, commentId);
         return;
      }

      const params = mobxState<GetRepliesParams>({
         limit: this.REPLIES_LIMIT,
         relativeId: null,
         up: false,
         sort
      })("params");

      this.replies = mobxSaiWs(
         {
            comment_id: commentId,
            user_id: profile.id,
            ...params.params,
         },
         {
            id: postId + String(commentId) + "replies" + sort,
            fetchIfHaveData,
            onSuccess: getRepliesSuccessHandler,
            onError: getRepliesErrorHandler,
            dataScope: {
               startFrom: "top",
               scrollRef: repliesScrollRef,
               botPercentage: 80,
               setParams: params.setParams,
               isHaveMoreResKey: "isHaveMore",
               relativeParamsKey: "relativeId",
               upOrDownParamsKey: "up",
               howMuchGettedToTop: 10000,
            },
            cacheSystem: {
               limit: this.REPLIES_LIMIT
            },
            fetchAddTo: {
               path: "items",
               addTo: needAddToArr ? "end" : undefined
            },
            service: "comment",
            method: "get_comment_replies"
         }
      );
   };

   // DELETE COMMENT

   deleteCommentSai: MobxSaiWsInstance<DefaultResponse> = {};

   deleteCommentAction = () => {
      const { profile } = profileStore;
      const { preCommentDelete, deleteCommentSuccess, deleteCommentError } = commentServiceStore;
      const { selectedComment: { selectedComment } } = commentInteractionsStore;

      if (!selectedComment || !profile?.id) return;
      const commentId = selectedComment.id;

      preCommentDelete();

      this.deleteCommentSai = mobxSaiWs(
         {
            comment_id: commentId,
            user_id: profile.id
         },
         {
            id: "deleteCommentAction",
            service: "comment",
            method: "delete_comment",
            onSuccess: deleteCommentSuccess,
            onError: deleteCommentError,
         }
      );
   };
}

export const commentActionsStore = new CommentActionsStore();

export const getComments = async (postId: number | string, params: GetCommentsParams) => (await rust.get(`/comment/post/${postId}`, { params: params })).data;
export const getReplies = async (commentId: number | string, params?: GetRepliesParams) => (await rust.get(`/comment/post/replies/${commentId}`, { params })).data;
export const createComment = async (postId: number | string, body: CreateCommentBody) => (await rust.post(`/comment/post/${postId}`, body)).data;
export const likeComment = async (commentId: number | string) => (await rust.post(`/comment/${commentId}/like`)).data;
export const dislikeComment = async (commentId: number | string) => (await rust.post(`/comment/${commentId}/dislike`)).data;
export const deleteComment = async (commentId: number | string) => (await rust.delete(`/comment/${commentId}`)).data;