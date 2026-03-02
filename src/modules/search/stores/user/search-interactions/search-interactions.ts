import { makeAutoObservable } from 'mobx';
import { mobxState, MobxUpdateInstance } from 'mobx-toolbox';
import { MutableRefObject } from 'react';
import { SearchUser } from '../types';


class SearchInteractionsStore {
	constructor() { makeAutoObservable(this); };

	// UPDATERS

	searchUserUpdater: MobxUpdateInstance<SearchUser> | null = null;
	setSearchUserUpdater = (updater: MobxUpdateInstance<SearchUser>) => this.searchUserUpdater = updater;

	// SCROLL

	searchUserScrollRef = mobxState<MutableRefObject<null> | null>(null)("searchUserScrollRef");
}

export const searchInteractionsStore = new SearchInteractionsStore();