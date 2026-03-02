import { makeAutoObservable } from 'mobx';
import { mobxState, MobxUpdateInstance } from 'mobx-toolbox';
import { MutableRefObject } from 'react';
import { SearchPost } from '../types';


class SearchInteractionsStore {
	constructor() { makeAutoObservable(this); };

	// STATES

	selectedPost = mobxState<SearchPost | null>(null)('selectedPost');

	// UPDATERS

	searchPostUpdater: MobxUpdateInstance<SearchPost> | null = null;
	setSearchPostUpdater = (updater: MobxUpdateInstance<SearchPost>) => this.searchPostUpdater = updater;

	// SCROLL

	searchPostScrollRef = mobxState<MutableRefObject<null> | null>(null)("searchPostScrollRef");
}

export const searchInteractionsStore = new SearchInteractionsStore();