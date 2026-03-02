import { VirtualList } from '@config/types';
import { checker } from '@lib/helpers';
import { mobxSaiWs } from '@lib/mobx-toolbox/mobxSaiWs';
import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';
import { globalSearchInteractionsStore } from '@stores/global-interactions';
import { makeAutoObservable } from 'mobx';
import { mobxState } from 'mobx-toolbox';
import { GetPostsByHashtagParams, GetPostsParams } from 'src/modules/post/stores';
import { searchInteractionsStore } from '../search-interactions/search-interactions';
import { searchServiceStore } from '../search-services/search-services';
import { SearchPost } from '../types';


class SearchActionsStore {
	constructor() { makeAutoObservable(this); }

	// GET SEARCH POSTS

	posts: MobxSaiWsInstance<VirtualList<SearchPost[]>> = {};
	SEARCH_POSTS_LIMIT = 21;

	getSearchPostsAction = async (fetchIfHaveData = false, needAddToArr = true, newFeed = false, needPending = true) => {
		const { queryString: { queryString } } = globalSearchInteractionsStore;
		const { getSearchPostsSuccessHandler, getSearchPostsErrorHandler } = searchServiceStore;
		const { searchPostScrollRef: { searchPostScrollRef } } = searchInteractionsStore;

		checker(searchPostScrollRef, "getSearchPostsAction: searchPostScrollRef is not loaded yet");

		const params = mobxState<GetPostsParams>({
			relative_id: null,
			limit: this.SEARCH_POSTS_LIMIT,
			page: 1,
			new_feed: newFeed,
			up: false,
			q: queryString,
		})("params");

		this.posts = mobxSaiWs(
			params.params,
			{
				id: `getSearchAction-${params.params.q}`,
				fetchIfHaveData,
				needPending,
				method: "search_posts",
				service: 'post',
				onSuccess: getSearchPostsSuccessHandler,
				onError: getSearchPostsErrorHandler,
				dataScope: {
					startFrom: "top",
					scrollRef: searchPostScrollRef,
					botPercentage: 80,
					setParams: params.setParams,
					isHaveMoreResKey: "isHaveMore",
					upOrDownParamsKey: "up",
					howMuchGettedToTop: 10000
				},
				cacheSystem: {
					limit: this.SEARCH_POSTS_LIMIT
				},
				fetchAddTo: fetchIfHaveData ? {} : {
					path: "list",
					addTo: needAddToArr ? "end" : undefined
				}
			}
		);
	};

	// GET SEARCH POSTS BY HASHTAG

	postsByHasthag: MobxSaiWsInstance<VirtualList<SearchPost[]>> = {};

	getSearchPostsByHashtagAction = async (fetchIfHaveData = false, needAddToArr = true, newFeed = false, needPending = true) => {
		const { queryString: { queryString } } = globalSearchInteractionsStore;
		const { getSearchPostsSuccessHandler, getSearchPostsErrorHandler } = searchServiceStore;
		const { searchPostScrollRef: { searchPostScrollRef } } = searchInteractionsStore;

		checker(searchPostScrollRef, "getSearchPostsByHashtagAction: searchPostScrollRef is not loaded yet");

		const params = mobxState<GetPostsByHashtagParams>({
			relative_id: null,
			limit: this.SEARCH_POSTS_LIMIT,
			page: 1,
			new_feed: newFeed,
			up: false,
			hashtag: queryString.slice(1),
		})("params");

		console.log('[params]:', params);

		this.postsByHasthag = mobxSaiWs(
			params.params,
			{
				id: `getSearchPostsByHashtagAction-${params.params.hashtag}`,
				fetchIfHaveData,
				method: "search_posts_by_hashtag",
				service: 'post',
				needPending,
				onSuccess: getSearchPostsSuccessHandler,
				onError: getSearchPostsErrorHandler,
				dataScope: {
					startFrom: "top",
					scrollRef: searchPostScrollRef,
					botPercentage: 80,
					setParams: params.setParams,
					isHaveMoreResKey: "isHaveMore",
					upOrDownParamsKey: "up",
					howMuchGettedToTop: 10000
				},
				cacheSystem: {
					limit: this.SEARCH_POSTS_LIMIT
				},
				fetchAddTo: fetchIfHaveData ? {} : {
					path: "list",
					addTo: needAddToArr ? "end" : undefined
				}
			}
		);
	};

}

export const searchActionsStore = new SearchActionsStore;