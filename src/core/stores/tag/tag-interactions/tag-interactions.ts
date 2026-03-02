import { MobxDebouncerInstance, debouncedAction } from '@lib/mobx-toolbox/mobxDebouncer';
import { makeAutoObservable } from "mobx";
import { tagActionsStore } from '../tag-actions/tag-actions';
import { CheckTagExistResponse } from '../tag-actions/types';

class TagInteractionsStore {
	constructor() { makeAutoObservable(this); }

	isDebouncing = false;
	setIsDebouncing = (value: boolean) => this.isDebouncing = value;

	// DEBOUNCES

	tagDebounce: MobxDebouncerInstance = {};

	onTagChange = (tag: string, addictionSuccessHandler: (data: CheckTagExistResponse) => void) => {
		const { checkTagExistAction } = tagActionsStore;

		if (tag.length <= 2) return;

		this.tagDebounce = debouncedAction(
			'onTagChange',
			() => checkTagExistAction(tag, addictionSuccessHandler),
			{ delay: 1000 }
		);
	};
}

export const tagInteractionsStore = new TagInteractionsStore();