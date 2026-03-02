import { debouncedAction } from '@lib/mobx-toolbox/mobxDebouncer';
import { tagActionsStore } from '@stores/tag';
import { makeAutoObservable } from 'mobx';
import { mobxState } from 'mobx-toolbox';
import { searchActionsStore as searchPostActionsStore } from 'src/modules/search/stores/post';
import { SearchEntity } from './types';

class SearchInteractionsStore {
	constructor() { makeAutoObservable(this); };

	queryString = mobxState('')('queryString');
	searchEntity = mobxState<SearchEntity | null>(null)('searchEntity');

	onChangeQueryString = (value: string) => {
		const { getSearchPostsAction, getSearchPostsByHashtagAction } = searchPostActionsStore;
		const { searchGlobalEntitysAction } = tagActionsStore;
		this.queryString.setQueryString(value);
		let action: (...args: any) => void;

		if (value.startsWith('@')) {
			if (this.searchEntity.searchEntity !== 'USER') {
				this.searchEntity.setSearchEntity('USER');
			}
			action = searchGlobalEntitysAction;
		} else if (value.startsWith('#')) {
			if (this.searchEntity.searchEntity !== 'POST_HASHTAG') {
				this.searchEntity.setSearchEntity('POST_HASHTAG');
			}
			action = getSearchPostsByHashtagAction;
		} else {
			if (this.searchEntity.searchEntity !== 'POST') {
				this.searchEntity.setSearchEntity('POST');
			}
			action = getSearchPostsAction;
		}

		debouncedAction('queryStringDebouncer', () => action(), { delay: 500 });
	};
}

export const globalSearchInteractionsStore = new SearchInteractionsStore;