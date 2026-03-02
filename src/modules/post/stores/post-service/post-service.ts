import { showNotify } from '@config/const';
import { getDeletePostNotifyData, getDeletePostSuccessNotifyData } from '@config/notify-data';
import { DefaultResponse } from '@config/types';
import { checker } from '@lib/helpers';
import { getCurrentRoute } from '@lib/navigation';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import { makeAutoObservable } from 'mobx';
import { useMobxUpdate } from 'mobx-toolbox';
import { profileStore } from 'src/modules/user/stores/profile';
import { postActionsStore } from '../post-actions/post-actions';
import { GetPostFeedResponse } from '../post-actions/types';
import { postInteractionsStore } from '../post-interactions/post-interactions';

class PostServiceStore {
   constructor() { makeAutoObservable(this); }


   deletedPostsData: any[] = [];
   deletePostFromPostsData = () => this.deletedPostsData.shift();
   addPostFromPostsData = (post: any) => this.deletedPostsData.push(post);

   createPostTempIds: string[] = [];
   addCreatePostTempId = (tempId: string) => this.createPostTempIds.push(tempId);
   removeCreatePostTempId = () => this.createPostTempIds.shift();

   createPostStatuses = new Map<string, "pending" | "fulfilled" | "rejected">();

   postLikeIds: number[] = [];
   postFavIds: number[] = [];

   addPostLikeId = (postId: number) => this.postLikeIds.push(postId);
   removePostLikeId = (postId: number) => this.postLikeIds.filter(item => item !== postId);

   addPostFavId = (postId: number) => this.postFavIds.push(postId);
   removePostFavId = (postId: number) => this.postFavIds.filter(item => item !== postId);

   changeCreatePostStatus = (uploadId: string, status: "pending" | "fulfilled" | "rejected") => {
      this.createPostStatuses.set(uploadId, status);
   };

   checkPostIdProviding = (funcName: string) => {
      const { selectedPost } = postInteractionsStore;

      const postId = selectedPost?.id;

      checker(postId, `${funcName}: Post id not provided`);

      return true;
   };

   filterPostAfterDelete = (postId: number | string) => {
      const { profile } = profileStore;
      const { userPosts, postsFeed } = postActionsStore;

      const path = getCurrentRoute()?.name;
      console.log("[filterPostAfterDelete]: path ", path);

      if (!userPosts?.data) return;
      if (!postsFeed?.data) return;

      const deletedPostIndex = userPosts.data.list.findIndex(post => post.id === postId);
      const deletedPost = userPosts.data.list[deletedPostIndex];

      // Сохраняем информацию о позиции поста
      const deletionInfo = {
         userPostIndex: deletedPost.author_id == profile?.id ? deletedPostIndex : -1,
         feedPostIndex: postsFeed.data.list.findIndex(post => post.id === postId)
      };

      if (deletedPost.author_id == profile?.id) {
         userPosts.data.list = userPosts.data.list.filter(post => post.id !== postId);
      }

      postsFeed.data.list = postsFeed.data.list.filter(post => post.id !== postId);

      return {
         post: deletedPost,
         positions: deletionInfo
      };
   };

   restoreDeletedPost = (deletedPostData: any) => {
      const { profile } = profileStore;
      const { userPosts, postsFeed } = postActionsStore;

      if (!deletedPostData || !deletedPostData.post) return;

      const { post: { deletedPost, positions } } = deletedPostData;

      if (!userPosts?.data || !postsFeed?.data) return;

      if (deletedPost.authorId === profile?.id && userPosts.data.list && positions.userPostIndex >= 0) {
         userPosts.data.list.insert(positions.userPostIndex, deletedPost);
      }

      if (postsFeed.data.list && positions.feedPostIndex >= 0) {
         postsFeed.data.list.insert(positions.feedPostIndex, deletedPost);
      }
   };

   // GET POSTS HANDLERS

   getPostsSuccessHandler = (data: any) => {
      const { setPostUpdater } = postInteractionsStore;

      // @ts-ignore
      if (data?.feed_session_id && postActionsStore.postsFeed?.messageOrFunction) {
         // @ts-ignore
         const currentParams = postActionsStore.postsFeed.messageOrFunction as any;
         if (typeof currentParams === 'object') {
            currentParams.feed_session_id = data.feed_session_id;
            // Reset new_feed flag after first successful request
            if (currentParams.new_feed) {
               currentParams.new_feed = false;
            }
         }
      }

      setPostUpdater(useMobxUpdate(() => postActionsStore?.postsFeed?.data?.list || []));
   };

   getPostsErrorHandler = (error: AxiosError<DefaultResponse>) => {
      // showNotify("error", {
      // 	message: i18next.t("get_posts_error_text")
      // })
   };

   // CREATE POST HANDLERS

   resetAllCreatePostPage = () => {
      const {
         inpHashtags: { setInpHashtags },
         selectedMedias: { setSelectedMedias },
         createPostForm
      } = postInteractionsStore;

      createPostForm.reset();
      setInpHashtags("");
      setSelectedMedias([]);
   };

   createPostSuccessHandler = (data: GetPostFeedResponse) => {
      if (!postActionsStore.userPosts.data) return;

      const tempId = this.removeCreatePostTempId();

      if (!tempId) return;

      this.removeTempPost(tempId);
      this.resetAllCreatePostPage();
      this.addTempPost(data);

      postActionsStore.userPosts.data.list = postActionsStore.userPosts.data.list.replaceAt(0, data);

      showNotify("success", {
         message: i18next.t("create_post_success_text")
      });
   };

   createPostErrorHandler = (_error: AxiosError<DefaultResponse>) => {
      const tempId = this.removeCreatePostTempId();

      if (!tempId) return;

      this.removeTempPost(tempId);

      showNotify("error", {
         message: i18next.t("crete_post_error_text")
      });
   };

   // GET USER POSTS HANDLERS

   getUserPostsSuccessHandler = (data: any) => {
      const { onFinishGetUserPosts, setUserPostUpdater } = postInteractionsStore;

      setUserPostUpdater(useMobxUpdate(() => postActionsStore?.userPosts?.data?.list || []));
      onFinishGetUserPosts?.();
   };

   getUserPostsErrorHandler = (error: AxiosError<DefaultResponse>) => { };

   // TOGGLE LIKE HANDLERS

   toggleLikeSuccessHandler = (data: any) => { };

   toggleLikeSaiHandler = (data: any) => {
      const postId = data?.body?.post_id;
      const message = data?.data?.message;

      const location = getCurrentRoute()?.name;

      const updater = location == "PostDetail" ? postInteractionsStore.userPostUpdater : postInteractionsStore.postUpdater;

      if (postId && updater) {
         if (message.includes('unliked')) updater(postId, 'oldIsLiked', false);
         else updater(postId, 'oldIsLiked', true);
         postServiceStore.removePostLikeId(postId);
      }

      postActionsStore.likePost = data;
   };

   toggleLikeErrorHandler = (error: AxiosError<DefaultResponse>) => { };

   // TOGGLE FAV HANDLERS

   toggleFavSuccessHandler = (data: any) => { };

   toggleFavSaiHandler = (data: any) => {
      const postId = data?.body?.post_id;
      const message = data?.data?.message;

      const location = getCurrentRoute()?.name;

      const updater = location == "PostDetail" ? postInteractionsStore.userPostUpdater : postInteractionsStore.postUpdater;

      if (postId && updater) {
         if (message.includes('removed')) updater(postId, 'oldIsFav', false);
         else updater(postId, 'oldIsFav', true);
         postServiceStore.removePostFavId(postId);
      }

      postActionsStore.favPost = data;
   };

   toggleFavErrorHandler = (error: AxiosError<DefaultResponse>) => { };

   // DELETE POST HANDLERS

   deletePostSuccessHandler = (data: any) => {
      const notifySuccessData = getDeletePostSuccessNotifyData();

      showNotify("success", notifySuccessData);
   };

   deletePostErrorHandler = (_error: AxiosError<DefaultResponse>) => {
      const deletedPostData = this.deletePostFromPostsData();
      this.restoreDeletedPost(deletedPostData);

      const notifyData = getDeletePostNotifyData();

      showNotify("error", notifyData);
   };

   // TEMP DATA

   getPostTempData = (tempId: string) => {
      const { createPostForm: { values } } = postInteractionsStore;

      const res: Partial<GetPostFeedResponse> = {
         id: tempId,
         can_comment: true,
         isTemp: true,
         title: values.title,
         content: values.content, // TODO: Поменять когда изменю формат текстового редактора
         original_content: values.content,
         hashtags: values.hashtags,
         tags: values.tags,
         images: []
      };

      return res;
   };

   addTempPost = (tempData: Partial<GetPostFeedResponse>) => {
      if (!postActionsStore.userPosts.data) return;

      postActionsStore.userPosts.data.list = [...[tempData as GetPostFeedResponse], ...postActionsStore.userPosts.data.list];
   };

   removeTempPost = (tempId: number | string) => {
      if (!postActionsStore.userPosts.data) return;

      postActionsStore.userPosts.data.list = postActionsStore.userPosts.data.list.filter(t => t.id !== tempId);
   };
}

export const postServiceStore = new PostServiceStore();
