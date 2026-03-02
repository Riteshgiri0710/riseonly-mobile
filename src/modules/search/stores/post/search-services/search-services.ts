import { DefaultResponse } from '@config/types';
import { AxiosError } from 'axios';
import { makeAutoObservable } from 'mobx';
import { useMobxUpdate } from 'mobx-toolbox';
import { searchInteractionsStore } from '../search-interactions/search-interactions';


class SearchServiceStore {
	constructor() { makeAutoObservable(this); };

	// GET SEARCH POSTS HANDLERS

	getSearchPostsSuccessHandler = (data: any) => {
		const { setSearchPostUpdater } = searchInteractionsStore;

		setSearchPostUpdater(useMobxUpdate(() => data.list));
	};

	getSearchPostsErrorHandler = (error: AxiosError<DefaultResponse>) => {
		// showNotify("error", {
		// 	message: i18next.t("get_search_posts_error_text")
		// })
	};
}

export const searchServiceStore = new SearchServiceStore();