import { showNotify } from '@core/config/const';
import { commentsSortKeyVariants, repliesSortKeyVariants } from '@core/config/sorts';
import { DefaultResponse, PreDataModeType, VirtualList } from '@core/config/types';
import { checker } from '@lib/helpers';
import { AxiosResponse } from 'axios';
import i18next from 'i18next';
import { makeAutoObservable, runInAction } from 'mobx';
import { MobxUpdateInstance, clearMobxSaiFetchCache, useMobxUpdate } from 'mobx-toolbox';
import { postInteractionsStore } from 'src/modules/post/stores';
import { commentActionsStore } from '../comment-actions/comment-actions';
import { CommentSortType, GetCommentsResponse, RespliesSortType } from '../comment-actions/types';
import { commentInteractionsStore } from '../comment-interactions/comment-interactions';

class CommentServiceStore {
   constructor() { makeAutoObservable(this); };

   lastTempId: Array<number | string> = [];
   deleteLastTempId = (): number | string | undefined => this.lastTempId.shift();

   lastCommentTextClone: Array<string> = [];
   deleteLastCommentClone = (): string | undefined => this.lastCommentTextClone.shift();

   lastRawCommentTextClone: Array<string> = [];
   deleteLastRawCommentTextClone = (): string | undefined => this.lastRawCommentTextClone.shift();

   lastLikeCommentId: Array<number | string> = [];
   deleteLastLikeCommentId = (): number | string | undefined => this.lastLikeCommentId.shift();

   lastDislikeCommentId: Array<number | string> = [];
   deleteLastDislikeCommentId = (): number | string | undefined => this.lastDislikeCommentId.shift();

   checkPostIdProviding = (funcName: string) => {
      const { selectedPost } = postInteractionsStore;
      const postId = selectedPost?.id;
      checker(postId, `${funcName}: Post id not provided`);
      return true;
   };

   // COMMENTS CACHE

   setCachedCommentsData = (sort: CommentSortType, postId: number | string, data: VirtualList<GetCommentsResponse[]>) => {
      const { postUpdater } = postInteractionsStore;

      checker(postUpdater, "setCachedCommentsData: Post updater not found");

      postUpdater(postId, commentsSortKeyVariants[sort] as any, data);
   };

   clearCachedCommentsData = (postId: number | string) => {
      runInAction(() => {
         clearMobxSaiFetchCache(postId + "feed");
         clearMobxSaiFetchCache(postId + "new");
         clearMobxSaiFetchCache(postId + "old");
         clearMobxSaiFetchCache(postId + "my");
      });
   };

   // REPLIES CACHE

   setCachedRepliesData = (sort: RespliesSortType, postId: number | string, data: VirtualList<GetCommentsResponse[]>) => {
      const {
         selectedCommentForReply: { selectedCommentForReply },
         commentUpdater,
      } = commentInteractionsStore;

      if (!selectedCommentForReply) return;
      checker(commentUpdater, "setCachedRepliesData: Comment updater not found");

      commentUpdater(selectedCommentForReply.id, repliesSortKeyVariants[sort] as any, data);
   };

   clearCachedRepliesData = (postId: number | string, commentId: number | string) => {
      runInAction(() => {
         clearMobxSaiFetchCache(postId + String(commentId) + "replies" + "popular");
         clearMobxSaiFetchCache(postId + String(commentId) + "replies" + "new");
         clearMobxSaiFetchCache(postId + String(commentId) + "replies" + "old");
         clearMobxSaiFetchCache(postId + String(commentId) + "replies" + "my");
      });
   };

   // CREATE COMMENT HELPERS

   openAndReplyComment = (comment: GetCommentsResponse) => {
      const {
         repliesOpen: { setRepliesOpen },
         selectedCommentForReply: { setSelectedCommentForReply },
         selectedCommentToReply: { setSelectedCommentToReply },
         replyCommentText: { setReplyCommentText },
         rawReplyCommentText: { setRawReplyCommentText },
         commentInputFocus: { setCommentInputFocus }
      } = commentInteractionsStore;

      runInAction(() => {
         setSelectedCommentForReply(comment);
         setSelectedCommentToReply(comment);
         setReplyCommentText(`@${comment.author.tag},`);
         setRawReplyCommentText(`@${comment.author.tag},`);
         setRepliesOpen(true);
         setCommentInputFocus(p => !p);
      });
   };

   // ========================== COMMENT PRE DATA =============================

   // PRE CREATE COMMENT

   preCreateComment = (postId: number, tempId: string) => {
      const { postUpdater } = postInteractionsStore;
      const {
         comments,
         replies
      } = commentActionsStore;
      const {
         commentText: { commentText, setCommentText },
         rawCommentText: { rawCommentText, setRawCommentText },
         replyCommentText: { replyCommentText, setReplyCommentText },
         rawReplyCommentText: { rawReplyCommentText, setRawReplyCommentText },
         repliesOpen: { repliesOpen },
         createCommentTempIds: { setCreateCommentTempIds },
         createReplyCommentTempIds: { setCreateReplyCommentTempIds },
         selectedCommentForReply: { selectedCommentForReply },
         selectedCommentToReply: { selectedCommentToReply },
         commentUpdater,
         repliesUpdater,
         getTempComment
      } = commentInteractionsStore;

      const content = repliesOpen ? replyCommentText : commentText;
      const originalContent = repliesOpen ? rawReplyCommentText : rawCommentText;

      const tempComment = getTempComment({
         id: tempId,
         content,
         originalContent,
         postId,
         parentId: repliesOpen ? Number(selectedCommentToReply?.id) : null
      });

      if (!tempComment || !(repliesOpen ? replies : comments)?.data?.items) return;

      // UPDATES
      (repliesOpen ? replies : comments).data!.items = [tempComment, ...((repliesOpen ? replies : comments).data!.items || [])];

      if (repliesOpen) {
         setReplyCommentText("");
         setRawReplyCommentText("");
         setCreateReplyCommentTempIds(prev => prev.filter(t => t != tempId));
      } else {
         setCommentText("");
         setRawCommentText("");
         setCreateCommentTempIds(prev => prev.filter(t => t != tempId));
      }

   };

   // PRE COMMENT DELETE

   // TODO: [preCommentDelete]: Clean code refactor
   preCommentDelete = (mode: PreDataModeType = "default") => {
      const { selectedPost, postUpdater } = postInteractionsStore;
      const {
         deleteCommentModal: { setDeleteCommentModal },
         selectedComment: { selectedComment },
         selectedCommentForReply: { selectedCommentForReply },
         selectedCommentToReply: { selectedCommentToReply },
         repliesOpen: { repliesOpen },
         commentUpdater,
         repliesUpdater
      } = commentInteractionsStore;

      if (!selectedPost || !postUpdater || !selectedComment) return;

      setDeleteCommentModal(false);
      const commentId = selectedComment.id;

      // DECREMENT COMMENT COUNT
      postInteractionsStore.selectedPost!.comments_count = postInteractionsStore.selectedPost!.comments_count - 1;
      postUpdater(selectedComment.post_id, "comments_count", p => p - 1);
      if (!repliesOpen) {
         if (commentUpdater) {
            commentUpdater(commentId, "replies_count", p => p - 1);
         }
      } else {
         if (selectedCommentToReply?.id == selectedCommentForReply?.id) {
            selectedCommentForReply!.replies_count = selectedCommentForReply!.replies_count - 1;
         }
         if (repliesUpdater && selectedCommentToReply) {
            repliesUpdater(selectedCommentToReply.id, "replies_count", p => p - 1);
         }
      }

      // FILTER COMMENTS LISTS
      const commentsClone = [...(commentActionsStore.comments.data?.items || [])];
      const repliesClone = [...(commentActionsStore.comments.data?.items || [])];

      // FILTER CACHED IN POSTS COMMENTS LISTS
      const selectedPostCachedComments = [...(postInteractionsStore.selectedPost?.cachedComments?.items || [])];
      const selectedPostCachedCommentsMy = [...(postInteractionsStore.selectedPost?.cachedCommentsMy?.items || [])];
      const selectedPostCachedCommentsNew = [...(postInteractionsStore.selectedPost?.cachedCommentsNew?.items || [])];
      const selectedPostCachedCommentsOld = [...(postInteractionsStore.selectedPost?.cachedCommentsOld?.items || [])];

      // FILTER CACHED IN COMMENT REPLIES LISTS
      const selectedCommentCachedReplies = [...(commentInteractionsStore.selectedCommentForReply.selectedCommentForReply?.cachedReplies?.items || [])];
      const selectedCommentCachedRepliesMy = [...(commentInteractionsStore.selectedCommentForReply.selectedCommentForReply?.cachedRepliesMy?.items || [])];
      const selectedCommentCachedRepliesNew = [...(commentInteractionsStore.selectedCommentForReply.selectedCommentForReply?.cachedRepliesNew?.items || [])];
      const selectedCommentCachedRepliesOld = [...(commentInteractionsStore.selectedCommentForReply.selectedCommentForReply?.cachedRepliesOld?.items || [])];

      runInAction(() => {
         if (commentActionsStore.comments.data) {
            console.log("1");
            commentActionsStore.comments.data.items = mode == "repair" ? commentsClone : commentActionsStore.comments.data.items.filter(t => String(t.id) != String(commentId));
            console.log("2");
         }
         if (commentActionsStore.replies.data) commentActionsStore.replies.data.items = mode == "repair" ? repliesClone : commentActionsStore.replies.data.items.filter(t => String(t.id) != String(commentId));
         if (postInteractionsStore.selectedPost?.cachedComments) postInteractionsStore.selectedPost.cachedComments.items = mode == "repair" ? selectedPostCachedComments : postInteractionsStore.selectedPost.cachedComments.items.filter(t => String(t.id) != String(commentId));
         if (postInteractionsStore.selectedPost?.cachedCommentsMy) postInteractionsStore.selectedPost.cachedCommentsMy.items = mode == "repair" ? selectedPostCachedCommentsMy : postInteractionsStore.selectedPost.cachedCommentsMy.items.filter(t => String(t.id) != String(commentId));
         if (postInteractionsStore.selectedPost?.cachedCommentsNew) postInteractionsStore.selectedPost.cachedCommentsNew.items = mode == "repair" ? selectedPostCachedCommentsNew : postInteractionsStore.selectedPost.cachedCommentsNew.items.filter(t => String(t.id) != String(commentId));
         if (postInteractionsStore.selectedPost?.cachedCommentsOld) postInteractionsStore.selectedPost.cachedCommentsOld.items = mode == "repair" ? selectedPostCachedCommentsOld : postInteractionsStore.selectedPost.cachedCommentsOld.items.filter(t => String(t.id) != String(commentId));
         if (commentInteractionsStore.selectedCommentForReply.selectedCommentForReply?.cachedReplies) commentInteractionsStore.selectedCommentForReply.selectedCommentForReply.cachedReplies.items = mode == "repair" ? selectedCommentCachedReplies : commentInteractionsStore.selectedCommentForReply.selectedCommentForReply.cachedReplies.items.filter(t => String(t.id) != String(commentId));
         if (commentInteractionsStore.selectedCommentForReply.selectedCommentForReply?.cachedRepliesMy) commentInteractionsStore.selectedCommentForReply.selectedCommentForReply.cachedRepliesMy.items = mode == "repair" ? selectedCommentCachedRepliesMy : commentInteractionsStore.selectedCommentForReply.selectedCommentForReply.cachedRepliesMy.items.filter(t => String(t.id) != String(commentId));
         if (commentInteractionsStore.selectedCommentForReply.selectedCommentForReply?.cachedRepliesNew) commentInteractionsStore.selectedCommentForReply.selectedCommentForReply.cachedRepliesNew.items = mode == "repair" ? selectedCommentCachedRepliesNew : commentInteractionsStore.selectedCommentForReply.selectedCommentForReply.cachedRepliesNew.items.filter(t => String(t.id) != String(commentId));
         if (commentInteractionsStore.selectedCommentForReply.selectedCommentForReply?.cachedRepliesOld) commentInteractionsStore.selectedCommentForReply.selectedCommentForReply.cachedRepliesOld.items = mode == "repair" ? selectedCommentCachedRepliesOld : commentInteractionsStore.selectedCommentForReply.selectedCommentForReply.cachedRepliesOld.items.filter(t => String(t.id) != String(commentId));

         if (mode == "repair") {
            postInteractionsStore.selectedPost!.comments_count = postInteractionsStore.selectedPost!.comments_count + 1;
            postUpdater(selectedComment.post_id, "comments_count", p => p + 1);
            if (!repliesOpen) {
               if (commentUpdater) {
                  commentUpdater(commentId, "replies_count", p => p + 1);
               }
            } else {
               if (selectedCommentToReply?.id == selectedCommentForReply?.id) {
                  selectedCommentForReply!.replies_count = selectedCommentForReply!.replies_count + 1;
               }
               if (repliesUpdater && selectedCommentToReply) {
                  repliesUpdater(selectedCommentToReply.id, "replies_count", p => p + 1);
               }
            }
         }
      });
   };

   getCommentsSuccessHandler = (message: any) => {
      const { setCommentUpdater } = commentInteractionsStore;
      const { selectedPost } = postInteractionsStore;

      if (!selectedPost) return;

      const data = message.data || message;
      setCommentUpdater(useMobxUpdate(() => commentActionsStore.comments?.data?.items || []));
      this.setCachedCommentsData("feed", selectedPost.id, data);
   };

   getCommentsErrorHandler = (message: any) => {
      showNotify("error", {
         message: "get_comments_error_text"
      });
   };

   createCommentSuccessHandler = (message: any) => {
      const { comments, replies } = commentActionsStore;
      const {
         repliesOpen: { repliesOpen }
      } = commentInteractionsStore;

      const parent = commentInteractionsStore.selectedCommentForReply.selectedCommentForReply;
      const { selectedPost, postUpdater } = postInteractionsStore;

      if (selectedPost && postUpdater && !repliesOpen) {
         postUpdater(selectedPost.id, 'main_comments_count', prev => prev + 1);
      }

      if (!selectedPost || !postUpdater) return;

      if (!repliesOpen) {
         postUpdater(selectedPost.id, 'comments_count', prev => prev + 1);
      } else if (parent && commentInteractionsStore.commentUpdater) {
         commentInteractionsStore.commentUpdater(
            parent.id,
            'replies_count',
            prev => prev + 1
         );
         postUpdater(selectedPost.id, 'comments_count', prev => prev + 1);
      }

      const tempId = this.deleteLastTempId();
      if (tempId == null) return;

      const tempIndex = (repliesOpen ? replies : comments).data!.items.findIndex(comment => comment.id === tempId);
      const data = message;

      if (
         tempIndex !== -1 &&
         tempIndex !== undefined &&
         (comments?.data?.items || replies?.data?.items) &&
         data
      ) {
         const prevTempComment = (repliesOpen ? replies : comments).data!.items[tempIndex];

         const realComment: GetCommentsResponse = {
            ...data,
            isTemp: false,
            userLiked: prevTempComment.user_liked ?? data.userLiked,
            userDisliked: prevTempComment.user_disliked ?? data.userDisliked,
            likesCount: data.likesCount ?? prevTempComment.likes_count,
            dislikesCount: data.dislikesCount ?? prevTempComment.dislikes_count,
            repliesCount: data.repliesCount ?? prevTempComment.replies_count,
         };

         (repliesOpen ? replies : comments).data!.items[tempIndex] = realComment;
      }
   };

   createCommentErrorHandler = (error: AxiosResponse<DefaultResponse>) => {
      const { postUpdater, selectedPost } = postInteractionsStore;
      const { comments } = commentActionsStore;
      const {
         commentText: { setCommentText },
         rawCommentText: { setRawCommentText }
      } = commentInteractionsStore;

      if (!selectedPost) return;
      const postId = selectedPost.id;

      const tempId = this.deleteLastTempId();
      const commentTextClone = this.deleteLastCommentClone();
      const rawCommentTextClone = this.deleteLastRawCommentTextClone();

      if (!tempId) return;
      if (!commentTextClone) return;
      if (!rawCommentTextClone) return;

      comments?.data?.items?.filter((item) => item.id !== tempId);
      postUpdater!(postId, "comments_count", (prev: number) => prev - 1);
      setCommentText(commentTextClone);
      setRawCommentText(rawCommentTextClone);
   };

   // GET REPLIES HANDLERS

   getRepliesSuccessHandler = (
      data: VirtualList<GetCommentsResponse[]>,
   ) => {
      const { selectedPost } = postInteractionsStore;
      const { setRepliesUpdater } = commentInteractionsStore;

      setRepliesUpdater(useMobxUpdate(() => commentActionsStore.replies?.data?.items || []));

      const sort = data.fetchParams.sort;
      const postId = selectedPost?.id;

      if (!postId) return;

      this.setCachedRepliesData(sort, postId, data);
   };

   getRepliesErrorHandler = (message: any) => {
      showNotify("error", {
         message: i18next.t("get_replies_error_text")
      });
   };

   getRepliesSaiHandler = (data: any) => {
      commentActionsStore.replies = data;
   };
   // LIKE COMMENT HANDLERS

   likeCommentSuccessHandler = () => {
      const {
         repliesOpen: { repliesOpen },
         commentUpdater,
         repliesUpdater
      } = commentInteractionsStore;

      const commentId = this.deleteLastLikeCommentId();

      const currentUpdater = repliesOpen ? repliesUpdater : commentUpdater;

      if (!currentUpdater) return;
      if (!commentId) return;

      currentUpdater(commentId, "user_liked_static", (prev) => !prev);
   };

   likeCommentErrorHandler = (message: any) => {
      showNotify("error", {
         message: i18next.t("like_comment_error_text")
      });
   };

   likeCommentSaiHandler = (data: any) => {
      commentActionsStore.likeComment = data;
   };

   // DISLIKE COMMENT HANDLERS

   dislikeCommentSuccessHandler = (currentUpdater: MobxUpdateInstance<GetCommentsResponse>) => {
      const commentId = this.deleteLastDislikeCommentId();

      if (!currentUpdater) return;
      if (!commentId) return;
      currentUpdater(commentId, "user_disliked_static", (prev) => !prev);
   };

   dislikeCommentErrorHandler = (error: AxiosResponse<DefaultResponse>) => {
      showNotify("error", {
         message: i18next.t("dislike_comment_error_text")
      });
   };

   dislikeCommentSaiHandler = (data: any) => {
      commentActionsStore.dislikeComment = data;
   };

   // DELETE COMMENT HANDLERS

   /**
   * "message": "Comment deleted successfully",
   * "statusCode": 200,
   */
   deleteCommentSuccess = (data: DefaultResponse) => {
      showNotify("success", {
         message: i18next.t("delete_comment_success_text")
      });
   };

   deleteCommentError = (error: DefaultResponse) => {
      const { preCommentDelete } = commentServiceStore;

      preCommentDelete("repair");
      showNotify("error", {
         message: i18next.t("delete_comment_error_text")
      });
   };
}

export const commentServiceStore = new CommentServiceStore();