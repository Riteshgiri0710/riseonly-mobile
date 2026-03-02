import { VirtualList } from '@config/types';
import { checker } from '@lib/helpers';
import { mobxSaiWs } from '@lib/mobx-toolbox/mobxSaiWs';
import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';
import { globalSearchInteractionsStore } from '@stores/global-interactions';
import { makeAutoObservable } from 'mobx';
import { mobxState } from 'mobx-toolbox';
import { SearchUsersParams } from 'src/modules/user/stores/profile';
import { searchInteractionsStore } from '../search-interactions/search-interactions';
import { searchServiceStore } from '../search-services/search-services';
import { SearchUser } from '../types';
class SearchActionsStore {
	constructor() { makeAutoObservable(this); }

	// GET SEARCH USERS

	users: MobxSaiWsInstance<VirtualList<SearchUser[]>> = {};
	SEARCH_USERS_LIMIT = 15;

	getSearchUsersAction = async (fetchIfHaveData = false, needAddToArr = true, needPending = true) => {
		const { queryString: { queryString } } = globalSearchInteractionsStore;
		const { getSearchUsersSuccessHandler, getSearchUsersErrorHandler } = searchServiceStore;
		const { searchUserScrollRef: { searchUserScrollRef } } = searchInteractionsStore;

		checker(searchUserScrollRef, "getSearchUsersAction: searchUserScrollRef is not loaded yet");

		const params = mobxState<SearchUsersParams>({
			relativeId: null,
			limit: this.SEARCH_USERS_LIMIT,
			page: 1,
			up: false,
			query: queryString.slice(1)
		})("params");

		const q = params.params.query || "empty";

		this.users = mobxSaiWs(
			params.params,
			{
				id: `getSearchUsersAction-${q}`,
				fetchIfHaveData,
				method: 'search_users',
				service: 'user',
				maxCacheData: 50,
				needPending,
				onSuccess: getSearchUsersSuccessHandler,
				onError: getSearchUsersErrorHandler,
				dataScope: {
					startFrom: "top",
					scrollRef: searchUserScrollRef,
					botPercentage: 80,
					setParams: params.setParams,
					isHaveMoreResKey: "isHaveMore",
					upOrDownParamsKey: "up",
					howMuchGettedToTop: 10000
				},
				cacheSystem: {
					limit: this.SEARCH_USERS_LIMIT
				},
				fetchAddTo: fetchIfHaveData ? {} : {
					path: "list",
					addTo: needAddToArr ? "end" : undefined
				}
			}
		);
	};
}

export const searchActionsStore = new SearchActionsStore();