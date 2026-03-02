import { MediaItem } from '@core/ui';
import { makeAutoObservable } from 'mobx';
import { mobxState } from 'mobx-toolbox';

class MediaInteractionsStore {
	constructor() { makeAutoObservable(this); }

	mediaOpen = mobxState(false)("mediaOpen");

	mediaResult = mobxState<MediaItem[]>([])("mediaResult");
}

export const mediaInteractionsStore = new MediaInteractionsStore();