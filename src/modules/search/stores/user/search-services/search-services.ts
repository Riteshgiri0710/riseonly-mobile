import { DefaultResponse } from '@config/types';
import { logger } from '@lib/helpers';
import { formatDiffData } from '@lib/text';
import { AxiosError } from 'axios';
import { makeAutoObservable } from 'mobx';
import { useMobxUpdate } from 'mobx-toolbox';
import { searchActionsStore } from '../search-actions/search-actions';
import { searchInteractionsStore } from '../search-interactions/search-interactions';


class SearchServiceStore {
	constructor() { makeAutoObservable(this); };

	// GET SEARCH USERS HANDLERS

	getSearchUsersSuccessHandler = (data: any) => {
		const { setSearchUserUpdater } = searchInteractionsStore;

		logger.debug("search service store", formatDiffData(data));

		setSearchUserUpdater(useMobxUpdate(() => searchActionsStore?.users?.data?.list || []));
	};

	getSearchUsersErrorHandler = (error: AxiosError<DefaultResponse>) => {
		// showNotify("error", {
		// 	message: i18next.t("get_search_posts_error_text")
		// })
	};
}

export const searchServiceStore = new SearchServiceStore();