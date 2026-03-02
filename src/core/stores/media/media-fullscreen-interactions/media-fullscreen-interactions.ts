import { MediaGridItem } from '@core/ui';
import { makeAutoObservable } from 'mobx';
import { mobxState } from 'mobx-toolbox';

class MediaFullscreenInteractionsStore {
	constructor() { makeAutoObservable(this); }

	visible = mobxState(false)("visible");
	items = mobxState<MediaGridItem[]>([])("items");
	initialIndex = mobxState(0)("initialIndex");
	reverseOrder = mobxState(false)("reverseOrder");

	open = (items: MediaGridItem[], initialIndex: number = 0, reverseOrder: boolean = false) => {
		const finalItems = reverseOrder ? [...items].reverse() : items;
		const finalIndex = reverseOrder ? finalItems.length - 1 - initialIndex : initialIndex;

		this.items.setItems(finalItems);
		this.initialIndex.setInitialIndex(finalIndex);
		this.reverseOrder.setReverseOrder(reverseOrder);
		this.visible.setVisible(true);
	};

	close = () => {
		this.visible.setVisible(false);
		this.items.setItems([]);
		this.initialIndex.setInitialIndex(0);
		this.reverseOrder.setReverseOrder(false);
	};
}

export const mediaFullscreenInteractionsStore = new MediaFullscreenInteractionsStore();

