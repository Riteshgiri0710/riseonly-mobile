import { VirtualList } from '@config/types';
import { checker } from '@lib/helpers';
import { mobxSaiWs } from '@lib/mobx-toolbox/mobxSaiWs';
import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';
import { getCurrentRoute } from '@lib/navigation';
import { numericId } from '@lib/numbers';
import { makeAutoObservable } from 'mobx';
import { mobxState } from 'mobx-toolbox';
import { searchInteractionsStore } from 'src/modules/search/stores/post';
import { profileStore } from 'src/modules/user/stores/profile';
import { postInteractionsStore } from '../post-interactions/post-interactions';
import { postServiceStore } from '../post-service/post-service';
import { CreatePostBody, GetPostFeedResponse, GetPostsParams } from './types';

class PostActionsStore {
   constructor() { makeAutoObservable(this); }

   // GET FEED

   postsFeed: MobxSaiWsInstance<VirtualList<GetPostFeedResponse[]>> = {};
   POSTS_LIMIT = 20;

   getPostsAction = async (fetchIfHaveData = true, needAddToArr = true, newFeed = false, needPending = true) => {
      const { getPostsSuccessHandler, getPostsErrorHandler } = postServiceStore;
      const { postScrollRef: { postScrollRef } } = postInteractionsStore;
      const { selectedPost: { selectedPost } } = searchInteractionsStore;
      const searchPostId = selectedPost?.id == "undefined" ? "" : selectedPost?.id || "";

      checker(postScrollRef, "getPostsAction: postScrollRef is not loaded yet");

      const params = mobxState<GetPostsParams>({
         relative_id: null,
         limit: 20,
         new_feed: newFeed,
         up: false,
      })("params");

      this.postsFeed = mobxSaiWs(
         params.params,
         {
            id: "getPostsAction" + searchPostId,
            fetchIfHaveData,
            needPending,
            onSuccess: getPostsSuccessHandler,
            onError: getPostsErrorHandler,
            storageCache: params.params.relative_id == null,
            takeCachePriority: "localStorage",
            dataScope: {
               startFrom: "top",
               scrollRef: postScrollRef,
               botPercentage: 80,
               setParams: params.setParams,
               relativeParamsKey: "relative_id",
               // resetPage: newFeed ? true : false,
               // pageParamsKey: "page",
               isHaveMoreResKey: "is_have_more",
               upOrDownParamsKey: "up",
               howMuchGettedToTop: 10000
            },
            cacheSystem: {
               limit: this.POSTS_LIMIT
            },
            fetchAddTo: {
               path: "list",
               addTo: needAddToArr ? "end" : undefined
            },
            service: "post",
            method: "get_feed",
         }
      );
   };

   // GET GRID USER POSTS

   userPosts: MobxSaiWsInstance<VirtualList<GetPostFeedResponse[]>> = {};
   USER_POSTS_LIMIT = 21;

   getUserPostsAction = async (tag: string, needPending: boolean = true, fetchIfHaveData = false, onFinish = () => { }) => {
      const { getMyProfile } = profileStore;
      const { getUserPostsSuccessHandler, getUserPostsErrorHandler } = postServiceStore;
      const {
         userPostsScrollRef: { userPostsScrollRef },
         setOnFinishGetUserPosts
      } = postInteractionsStore;

      setOnFinishGetUserPosts(onFinish);

      checker(tag, "getUserPostsAction: tag is undefined");

      const profile = await getMyProfile();

      const params = mobxState({
         relative_id: null,
         limit: this.USER_POSTS_LIMIT,
         up: false,
         tag
      })("params");

      this.userPosts = mobxSaiWs(
         params.params,
         {
            id: ["getUserPosts", tag],
            fetchIfHaveData: fetchIfHaveData,
            fetchIfHaveLocalStorage: true,
            needPending,
            onSuccess: getUserPostsSuccessHandler,
            onError: getUserPostsErrorHandler,
            storageCache: profile?.tag == tag,
            takeCachePriority: "localStorage",
            dataScope: {
               setParams: params.setParams,
               botPercentage: 80,
               startFrom: "top",
               scrollRef: userPostsScrollRef,
               relativeParamsKey: "relative_id",
               upOrDownParamsKey: "up"
            },
            cacheSystem: {
               limit: this.USER_POSTS_LIMIT,
            },
            fetchAddTo: fetchIfHaveData ? {
            } : {
               path: "list",
               addTo: "end",
            },
            service: "post",
            method: "get_user_posts",
         }
      );

      return true;
   };

   // LIKE/UNLIKE POST

   likePost: MobxSaiWsInstance<void> = {};

   likePostAction = async (postId: number, newIsLiked: boolean) => {
      const { toggleLikeSuccessHandler, toggleLikeErrorHandler } = postServiceStore;
      const { profile } = profileStore;
      const { selectedPost, selectedUserPost: { selectedUserPost } } = postInteractionsStore;

      const route = getCurrentRoute()?.name;
      const finalSelectedPost = route == "PostDetail" ? selectedUserPost : selectedPost;

      if (finalSelectedPost?.oldIsLiked === newIsLiked) return;

      this.likePost = mobxSaiWs(
         {
            post_id: postId,
            user_id: profile?.id
         },
         {
            id: "likePostAction",
            service: "post",
            method: "toggle_like",
            fetchIfHaveData: true,
            fetchIfPending: false,
            onSuccess: toggleLikeSuccessHandler,
            onError: toggleLikeErrorHandler,
         }
      );
   };

   // FAVORITE/UNFAVORITE POST

   favPost: MobxSaiWsInstance<void> = {};

   favPostAction = async (postId: number, newIsFav: boolean) => {
      const { toggleFavSuccessHandler, toggleFavErrorHandler } = postServiceStore;
      const { profile } = profileStore;
      const { selectedPost, selectedUserPost: { selectedUserPost } } = postInteractionsStore;

      const route = getCurrentRoute()?.name;
      const finalSelectedPost = route == "PostDetail" ? selectedUserPost : selectedPost;

      if (finalSelectedPost?.oldIsFav === newIsFav) return;

      this.favPost = mobxSaiWs(
         {
            post_id: postId,
            user_id: profile?.id
         },
         {
            id: "favPostAction",
            service: "post",
            method: "toggle_favorite",
            fetchIfHaveData: true,
            fetchIfPending: false,
            onSuccess: toggleFavSuccessHandler,
            onError: toggleFavErrorHandler,
         }
      );
   };

   // DELETE POST

   deletePost: MobxSaiWsInstance<void> = {};

   deletePostAction = async () => {
      const { deletePostSuccessHandler, deletePostErrorHandler } = postServiceStore;
      const { profile } = profileStore;
      const {
         checkPostIdProviding,
         filterPostAfterDelete,
         addPostFromPostsData
      } = postServiceStore;
      const {
         selectedPost,
         postDeleteModalOpen: { setPostDeleteModalOpen }
      } = postInteractionsStore;

      if (!checkPostIdProviding("deletePostAction")) return;

      const postId = selectedPost?.id!;

      // PRE DELETE POST
      const deletedPostData = filterPostAfterDelete(postId);
      addPostFromPostsData(deletedPostData);
      setPostDeleteModalOpen(false);

      this.deletePost = mobxSaiWs(
         {
            post_id: postId,
            user_id: profile?.id
         },
         {
            method: "delete_post",
            service: "post",
            onSuccess: deletePostSuccessHandler,
            onError: deletePostErrorHandler,
         }
      );
   };

   // CREATE POST

   createPost: MobxSaiWsInstance<GetPostFeedResponse> = {};

   createPostAction = async (images?: string[]) => {
      const { createPostSuccessHandler, createPostErrorHandler } = postServiceStore;
      const {
         getPostTempData,
         addTempPost,
         addCreatePostTempId
      } = postServiceStore;
      const {
         createPostForm: { values },
         selectedMedias: { selectedMedias }
      } = postInteractionsStore;

      const body: CreatePostBody = {
         can_comment: values.canComment,
         title: values.title,
         content: values.content, // TODO: Поменять когда изменю формат текстового редактора
         original_content: values.content,
         hashtags: values.hashtags,
         tags: values.tags,
         images: images ? images : (selectedMedias.length > 0 ? selectedMedias.map(media => media.uri) : [])
      };

      const tempId = numericId();
      addCreatePostTempId(tempId);

      if (!images) {
         const tempData = getPostTempData(tempId);

         addTempPost(tempData);

         this.createPost = mobxSaiWs(
            body,
            {
               id: "createPostAction",
               fetchIfHaveData: true,
               service: "post",
               method: "create_post",
               takePath: "post",
               onSuccess: createPostSuccessHandler,
               onError: createPostErrorHandler,
            }
         );
      };
   };
}

export const postActionsStore = new PostActionsStore();
