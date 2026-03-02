import { ImageData, MediaItem } from '@core/ui';
import { getCurrentRoute } from '@lib/navigation';
import { makeAutoObservable, runInAction } from 'mobx';
import { MobxUpdateInstance, mobxDebouncer, mobxState, useMobxForm } from 'mobx-toolbox';
import { RefObject } from 'react';
import { CreatePostSchema } from 'src/modules/post/shared/schemas/postSchema';
import { postActionsStore } from '../post-actions/post-actions';
import { GetPostFeedResponse } from '../post-actions/types';

class PostInteractionsStore {
   constructor() { makeAutoObservable(this); }

   // STATES

   selectedPost: GetPostFeedResponse | null = null;
   setSelectedPost = (post: GetPostFeedResponse | null) => this.selectedPost = post;

   userPostsToShow = mobxState<GetPostFeedResponse[]>([])("userPostsToShow");
   selectedUserPost = mobxState<GetPostFeedResponse | null>(null)("selectedUserPost");

   // UPDATERS

   postUpdater: MobxUpdateInstance<GetPostFeedResponse> | null = null;
   setPostUpdater = (updater: MobxUpdateInstance<GetPostFeedResponse>) => this.postUpdater = updater;

   userPostUpdater: MobxUpdateInstance<GetPostFeedResponse> | null = null;
   setUserPostUpdater = (updater: MobxUpdateInstance<GetPostFeedResponse>) => this.userPostUpdater = updater;

   // REFS

   userPostsScrollRef = mobxState<RefObject<null> | null>(null)('userPostsScrollRef');

   // USER POSTS

   onFinishGetUserPosts: null | (() => void) = null;
   setOnFinishGetUserPosts = (callback: () => void) => this.onFinishGetUserPosts = callback;

   // DEBOUNCERS

   toggleLikePost = (postId: number, post: GetPostFeedResponse) => {
      const { likePostAction } = postActionsStore;
      const { setSelectedUserPost } = this.selectedUserPost;

      if (isNaN(postId)) return;
      this.setSelectedPost(post);
      setSelectedUserPost(post);

      const route = getCurrentRoute()?.name;
      const updater = route == "PostDetail" ? this.userPostUpdater : this.postUpdater;

      let newIsLiked: boolean;

      runInAction(() => {
         if (!updater) return;
         updater(postId, "likes_count", (prev: number) => prev + (post?.is_liked ? -1 : 1));
         updater(postId, "is_liked", (prev: boolean) => {
            const res = !prev;
            newIsLiked = res;
            return newIsLiked;
         });
      });

      mobxDebouncer.debouncedAction(postId, () => likePostAction(postId, newIsLiked), 1000);
   };

   toggleFavPost = (postId: number, post: GetPostFeedResponse) => {
      const { favPostAction } = postActionsStore;
      const { setSelectedUserPost } = this.selectedUserPost;

      if (isNaN(postId)) return;
      this.setSelectedPost(post);
      setSelectedUserPost(post);

      const route = getCurrentRoute()?.name;
      const updater = route == "PostDetail" ? this.userPostUpdater : this.postUpdater;

      let newIsFav: boolean;

      runInAction(() => {
         if (!updater) return;
         updater(postId, "favorites_count", (prev: number) => prev + (post?.is_favorited ? -1 : 1));
         updater(postId, "is_favorited", (prev: boolean) => {
            const res = !prev;
            newIsFav = res;
            return res;
         });
      });

      mobxDebouncer.debouncedAction(postId + 1, () => favPostAction(postId, newIsFav), 1000);
   };

   // IMAGE VIEWER

   imageOpen = mobxState(false)('imageOpen');
   imageData: ImageData[] = [];

   setImageData = (images: string[]) => {
      const res = images.map((img, index) => ({
         url: img,
         id: index.toString(),
      }));
      this.imageData = res;
   };

   // POST DETAIL

   getAfterBeforePosts = (arr: GetPostFeedResponse[], effectivePostId: number) => {
      if (!arr || !effectivePostId) return { postsAfter: [], postsBefore: [] };

      const selectedIndex = arr.findIndex(item => item.id === effectivePostId);
      if (selectedIndex === -1) return { postsAfter: arr, postsBefore: [] };

      const postsAfter = arr.slice(selectedIndex + 1);
      const postsBefore = arr.slice(0, selectedIndex);

      return { postsAfter, postsBefore };
   };

   // MODALS

   postDeleteModalOpen = mobxState(false)('postDeleteModalOpen');

   // SCROLL

   postScrollRef = mobxState<RefObject<null> | null>(null)("postScrollRef");

   // CREATE POST

   inpHashtags = mobxState("")("inpHashtags");
   selectedMedias = mobxState<MediaItem[]>([])("selectedMedias");

   createPostForm = useMobxForm({
      canComment: true,
      title: "",
      content: "",
      originalContent: "",
      hashtags: [],
      tags: [],
      images: []
   }, CreatePostSchema, { instaValidate: true, resetErrIfNoValue: false });

   toggleTag = (tag: string) => {
      const { values, setValue } = this.createPostForm;
      const currentTags = [...values.tags];

      if (currentTags.includes(tag as never)) {
         setValue("tags", currentTags.filter(t => t !== tag) as never[]);
      } else {
         setValue("tags", [...currentTags, tag] as never[]);
      }
   };

   createPostHandler = () => {
      const { createPostAction } = postActionsStore;

      createPostAction();
   };

   onHashtagInput = (value: string) => {
      const { inpHashtags: { inpHashtags, setInpHashtags } } = this;

      const arr = value.split(' ');
      const realArr = inpHashtags.split(' ');
      if (realArr.some((str: string) => str == '#' && (!/^#([^#]+|$)/.test(str) || str == '#'))) {
         setInpHashtags(arr.filter(t => t[0] == '#').join(' '));
         return;
      }

      if (arr.some(str => str[0] !== '#' && arr.length > 1 && arr[arr.length - 1] !== '')) {
         setInpHashtags(arr.filter(t => t[0] == '#').join(' '));
         return;
      }
      if (arr.some(str => !/^[а-яА-Яa-zA-Z0-9#]+$/.test(str) && str !== '')) return;
      if (
         arr.some(str => !/^#?(?!.*#)[а-яА-Яa-zA-Z0-9#]+$/.test(str) && str !== '' && str !== '#') &&
         inpHashtags.length !== 0
      ) return;
      if (arr.some(str => str[0] !== '#' && str.length > 1)) {
         if (arr.filter(t => t[0] == '#')) {
            setInpHashtags(`#${value}`);
            return;
         }
         setInpHashtags(arr.filter(t => t[0] == '#').join(' '));
         return;
      }
      if (arr[arr.length - 1] == '#') {
         arr.pop();
         setInpHashtags(arr.join(' '));
         return;
      }
      if (/ $/.test(value)) {
         setInpHashtags(prev => prev + ' #');
         return;
      }
      setInpHashtags(value);
   };

}

export const postInteractionsStore = new PostInteractionsStore();
