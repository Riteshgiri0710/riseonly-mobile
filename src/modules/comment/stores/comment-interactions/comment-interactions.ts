import { commentsSortKeyVariants, repliesSortKeyVariants } from '@core/config/sorts';
import { VirtualList } from '@core/config/types';
import BottomSheet from '@gorhom/bottom-sheet';
import { checker, logger } from '@lib/helpers';
import { formatDiffData } from '@lib/text';
import { makeAutoObservable, runInAction } from 'mobx';
import { MobxUpdateInstance, mobxDebouncer, mobxState } from 'mobx-toolbox';
import { MutableRefObject } from 'react';
import { Keyboard } from 'react-native';
import { CommentModesT } from 'src/modules/comment/components';
import { postInteractionsStore } from 'src/modules/post/stores';
import { profileStore } from 'src/modules/user/stores/profile';
import { commentActionsStore } from '../comment-actions/comment-actions';
import { CommentSortType, GetCommentsResponse, RespliesSortType } from '../comment-actions/types';
import { GetTempCommentParams } from './types';

class CommentInteractionsStore {
   constructor() { makeAutoObservable(this); }

   isCommentOpen = false;
   activeInputRefs: Array<any> = [];
   isInputsVisible = true;
   bottomSheetRef: React.RefObject<BottomSheet> | null = null;

   setIsCommentOpen = (value: boolean) => this.isCommentOpen = value;

   selectedComment = mobxState<GetCommentsResponse | null>(null)("selectedComment");

   commentRenderType = mobxState<"cached" | "default">("cached")("commentRenderType");

   // TEXT EDITOR

   rawCommentText = mobxState('')('rawCommentText');
   commentText = mobxState('')('commentText');

   rawReplyCommentText = mobxState('')('rawReplyCommentText');
   replyCommentText = mobxState('')('replyCommentText');

   commentInputFocus = mobxState(false)("commentInputFocus");

   // CONTEXT MENU / SORT

   commentListContextMenu = mobxState(false)('commentListContextMenu');

   changeCommentSelectedSort = (sort: CommentSortType) => {
      const { postUpdater, selectedPost } = postInteractionsStore;
      const { getCommentsAction } = commentActionsStore;

      checker(postUpdater, "changeCommentSelectedSort: No post updater found");
      if (!selectedPost) return;

      console.log("[changeCommentSelectedSort]: postId", selectedPost.id);
      postUpdater(selectedPost.id, "selectedCommentSort", sort);
      getCommentsAction(sort, true, false, true);
   };

   changeRepliesSelectedSort = (sort: RespliesSortType) => {
      const { selectedPost } = postInteractionsStore;
      const { getRepliesAction } = commentActionsStore;
      const {
         selectedCommentForReply: { selectedCommentForReply },
         commentUpdater
      } = commentInteractionsStore;

      if (!selectedPost || !selectedCommentForReply) return;
      checker(commentUpdater, "changeRepliesSelectedSort: No comment updater found");

      console.log("[changeCommentSelectedSort]: sort", sort);
      logger.info("changeRepliesSelectedSort", `selectedCommentForReply = ${formatDiffData(selectedCommentForReply)}`);
      commentUpdater(selectedCommentForReply.id, "selectedRepliesSort", sort);
      getRepliesAction(sort, true, false, true);
   };

   // COMMENTS CACHE

   getCachedCommentsData = (): VirtualList<GetCommentsResponse[]> | null => {
      const { selectedPost } = postInteractionsStore;

      if (!selectedPost) return null;

      const selectedCommentSort = selectedPost?.selectedCommentSort as CommentSortType || "feed";
      const cachedCommentsKey = commentsSortKeyVariants[selectedCommentSort];

      console.log("[getCachedCommentsData]: cachedCommentsKey ", cachedCommentsKey);

      if (cachedCommentsKey &&
         (
            cachedCommentsKey === 'cachedComments' ||
            cachedCommentsKey === 'cachedCommentsOld' ||
            cachedCommentsKey === 'cachedCommentsNew' ||
            cachedCommentsKey === 'cachedCommentsMy'
         )
      ) {
         const res = selectedPost[cachedCommentsKey] as VirtualList<GetCommentsResponse[]>;
         if (res) return res;
         return null;
      }

      return null;
   };

   // REPLIES CACHE

   getCachedRepliesData = (): VirtualList<GetCommentsResponse[]> | null => {
      const {
         selectedCommentForReply: { selectedCommentForReply },
         commentUpdater
      } = commentInteractionsStore;

      if (!commentUpdater || !selectedCommentForReply) return null;
      const cachedRepliesKey = repliesSortKeyVariants[selectedCommentForReply?.selectedRepliesSort as RespliesSortType];

      if (cachedRepliesKey &&
         (
            cachedRepliesKey === 'cachedReplies' ||
            cachedRepliesKey === 'cachedRepliesOld' ||
            cachedRepliesKey === 'cachedRepliesNew' ||
            cachedRepliesKey === 'cachedRepliesMy'
         )
      ) {
         const res = selectedCommentForReply[cachedRepliesKey] as VirtualList<GetCommentsResponse[]>;
         if (res) return res;
         return null;
      }

      return null;
   };

   // UPDATERS

   commentUpdater: MobxUpdateInstance<GetCommentsResponse> | null = null;
   setCommentUpdater = (updater: MobxUpdateInstance<GetCommentsResponse>) => this.commentUpdater = updater;

   repliesUpdater: MobxUpdateInstance<GetCommentsResponse> | null = null;
   setRepliesUpdater = (updater: MobxUpdateInstance<GetCommentsResponse>) => this.repliesUpdater = updater;

   cachedCommentUpdater: MobxUpdateInstance<GetCommentsResponse> | null = null;
   setCachedCommentUpdater = (updater: MobxUpdateInstance<GetCommentsResponse>) => this.cachedCommentUpdater = updater;

   // REFS

   commentScrollRef = mobxState<MutableRefObject<null> | null>(null)('commentScrollRef');
   repliesScrollRef = mobxState<MutableRefObject<null> | null>(null)('repliesScrollRef');

   // INPUT

   registerInput = (ref: any) => {
      if (ref && !this.activeInputRefs.includes(ref)) {
         this.activeInputRefs.push(ref);
      }
   };

   unregisterInput = (ref: any) => {
      this.activeInputRefs = this.activeInputRefs.filter(input => input !== ref);
   };

   dismissKeyboardAndBlurInputs = () => {
      this.activeInputRefs.forEach(input => {
         if (input) {
            if (input.blur) input.blur();
            if (input.blurContentEditor) input.blurContentEditor();

            if (input.commandDOM) {
               input.commandDOM(`
						document.activeElement.blur();
						window.ReactNativeWebView.postMessage(JSON.stringify({type: 'blur'}));
					`);
            }
         }
      });

      Keyboard.dismiss();
   };

   hideInputsTemporarily = () => {
      this.isInputsVisible = false;
      Keyboard.dismiss();

      setTimeout(() => {
         this.isInputsVisible = true;
      }, 100);
   };

   // BOTTOM SHEET

   commentsBottomSheetCloseSignal = mobxState(false)("commentsBottomSheetCloseSignal");

   setBottomSheetRef = (ref: React.RefObject<BottomSheet>) => this.bottomSheetRef = ref;
   closeBottomSheet = () => {
      console.log('Trying to close bottom sheet', this.bottomSheetRef?.current);
      if (this.bottomSheetRef?.current) {
         try {
            this.bottomSheetRef.current.close();
            console.log('Bottom sheet close method called');
         } catch (error) {
            console.error('Error closing bottom sheet:', error);
         }
      } else {
         console.log('Bottom sheet ref is null');
      }
      this.isCommentOpen = false;
   };

   // TEMP DATA

   createCommentTempIds = mobxState<string[]>([])("createCommentTempIds");
   createReplyCommentTempIds = mobxState<string[]>([])("createReplyCommentTempIds");

   getTempComment = ({
      id,
      content,
      originalContent,
      postId,
      parentId = null,
      addressedToName = null,
      addressedToTag = null
   }: GetTempCommentParams): GetCommentsResponse | null => {
      const { profile } = profileStore;

      checker(profile, "getTempComment: No profile found");

      return {
         "id": id,
         "content": content,
         "original_content": originalContent,
         "created_at": new Date().toISOString(),
         "updated_at": new Date().toISOString(),
         "post_id": postId,
         "author_id": profile.id,
         "parent_id": parentId,
         "is_temp": true,
         "replies_count": 0,
         "likes_count": 0,
         "dislikes_count": 0,
         "user_liked": false,
         "user_disliked": false,
         "addressed_to_name": addressedToName,
         "addressed_to_tag": addressedToTag,
         "preview_reply_comment": null,
         "author": {
            "name": profile.name,
            "tag": profile.tag,
            "more": {
               "isPremium": profile.is_premium,
               "role": profile.role,
               "p_lang": profile.more.p_lang,
               "who": profile.more.who,
               "logo": profile.more.logo,
            }
         },
         oldIsLiked: false,
         oldIsDisliked: false
      };
   };

   // LIKE/DISLIKE COMMENT

   likeCommentHandler = (
      commentId: number,
      comment: GetCommentsResponse,
      type: CommentModesT = "default"
   ) => {
      const { likeCommentAction } = commentActionsStore;
      const { debouncedAction } = mobxDebouncer;

      let userDisliked = comment.oldIsDisliked;
      const userLikedStatic = comment.oldIsLiked;
      const currentUpdater = type == "default" ? this.commentUpdater : this.repliesUpdater;

      if (!currentUpdater) return;

      let newIsLiked: boolean;

      runInAction(() => {
         if (comment.user_disliked) {
            currentUpdater(commentId, "dislikes_count", (prev) => prev - 1);
            currentUpdater(commentId, "user_disliked", (prev) => {
               const res = !prev;
               userDisliked = res;
               return res;
            });
         }
         currentUpdater(commentId, "likes_count", (prev) => prev + (comment.user_liked ? -1 : 1));
         currentUpdater(commentId, "user_liked", (prev) => {
            const res = !prev;
            newIsLiked = res;
            return res;
         });
      });

      debouncedAction(
         commentId + type,
         () => {
            if (userLikedStatic == newIsLiked) return;
            likeCommentAction(commentId, newIsLiked);
         },
         1000
      );
   };

   dislikeCommentHandler = (
      commentId: number,
      comment: GetCommentsResponse,
      type: CommentModesT = "default"
   ) => {
      const { dislikeCommentAction } = commentActionsStore;
      const { debouncedAction } = mobxDebouncer;

      let userLiked = comment.user_liked;
      let userDisliked = comment.user_disliked;
      const userDislikedStatic = comment.oldIsDisliked;
      const currentUpdater = type == "default" ? this.commentUpdater : this.repliesUpdater;

      if (!currentUpdater) return;

      let newDisliked: boolean;

      runInAction(() => {
         if (comment.user_liked) {
            currentUpdater(commentId, "likes_count", (prev) => prev - 1);
            currentUpdater(commentId, "user_liked", (prev) => {
               const res = !prev;
               userLiked = res;
               return res;
            });
         }
         currentUpdater(commentId, "dislikes_count", (prev) => prev + (comment.user_disliked ? -1 : 1));
         currentUpdater(commentId, "user_disliked", (prev) => {
            const res = !prev;
            newDisliked = res;
            userDisliked = res;
            return res;
         });
      });

      debouncedAction(
         commentId + type,
         () => {
            if (userDislikedStatic == newDisliked) return;
            dislikeCommentAction(commentId, currentUpdater);
         },
         1000
      );
   };

   // REPLIES

   repliesOpen = mobxState(false)("repliesOpen");
   selectedCommentForReply = mobxState<GetCommentsResponse | null>(null)("selectedCommentForReply");
   selectedCommentToReply = mobxState<GetCommentsResponse | null>(null)("selectedCommentToReply");

   onCloseReplies = () => this.repliesOpen.setRepliesOpen(false);

   // MODALS

   deleteCommentModal = mobxState(false)("deleteCommentModal");

}

export const commentInteractionsStore = new CommentInteractionsStore();