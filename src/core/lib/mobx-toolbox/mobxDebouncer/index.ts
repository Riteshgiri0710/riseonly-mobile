import { makeAutoObservable, runInAction } from 'mobx';
import { DebouncedAction } from 'mobx-toolbox';

export interface DebouncedActionOptions {
	/** Delay in milliseconds @default 500 */
	delay?: number;

	/** Group key to combine different action types @default 'default' */
	groupKey?: string;

	/**
	 * Max cached debounce entries per prefix (groupKey)
	 * 
	 * @default 10
	*/
	maxCacheData?: number;
}

/**
 * Result of calling debouncedAction. Use as type for store variable
 * 
 * @example
 * class MyStore {
 *   tagDebounce: MobxDebouncerInstance = null;
 *   
 *   onTagChange = (tag: string) => {
 *     this.tagDebounce = debouncedAction('tag', () => checkTag(tag), { delay: 500 });
 *     console.log(this.tagDebounce.isDebouncing); // true
 *   }
 * }
 */
export interface DebouncedActionResult {
	/** Whether debounce is active for this key */
	isDebouncing: boolean;
	/** Debounce key */
	key: string;
	/** Cancel debounce without running action */
	cancel: () => void;
	/** Run action immediately */
	flush: () => void;
}

/**
 * Type for storing debouncedAction result in store. Use to init with {}.
 * 
 * @example
 * class TagInteractionsStore {
 *   tagDebounce: MobxDebouncerInstance = {};
 *   
 *   onTagChange = (tag: string) => {
 *     this.tagDebounce = debouncedAction('onTagChange', () => {
 *       checkTagExistAction(tag);
 *     }, { delay: 500, groupKey: 'tag' });
 *   }
 *   
 *   get isTagDebouncing() {
 *     return this.tagDebounce?.isDebouncing ?? false;
 *   }
 * }
 */
export type MobxDebouncerInstance = Partial<DebouncedActionResult>;

/**
 * Manages deferred actions in MobX. Groups and delays execution.
 */
class MobxDebouncer {
	constructor() { makeAutoObservable(this, {}, { autoBind: true }); }

	private debouncedActions: Map<string, DebouncedAction & { timestamp: number; }> = new Map();
	private actionRegistry: Map<string, Set<() => void>> = new Map();
	debouncingState: Map<string, boolean> = new Map();

	isDebouncing = (key: string | number, groupKey: string = 'default'): boolean => {
		const actionKey = `${groupKey}_${key}`;
		return this.debouncingState.get(actionKey) || false;
	};

	/**
	 * Build complex debounce flows in one line with any operations.
	 * Telegram: https://t.me/nics51
	 *
	 * @example
	 * // some-store.ts
	 * class PostInteractionsStore {
	 * 	constructor() {
	 * 		makeAutoObservable(this)
	 * 	}
	 * 
	 * 	postUpdater: null | any = null
	 * 	setPostUpdater = (updater: any) => this.postUpdater = updater
	 * 
	 * 	toggleLikePost = (postId: number, post: GetPostFeedResponse) => {
	 * 		if (!this.postUpdater) return
	 * 
	 * 		runInAction(() => {
	 * 			this.postUpdater(postId, "likesCount", (prev: number) => prev + (post?.isLiked ? -1 : 1))
	 * 			this.postUpdater(postId, "isLiked", (prev: boolean) => !prev)
	 * 		})
	 * 
	 * 		const result = mobxDebouncer.debouncedAction(
	 * 			postId,
	 * 			() => console.log("КОЛЛБЭК"),
	 * 			{ delay: 1000, groupKey: 'like-fav', maxCacheData: 10 }
	 * 		)
	 * 		console.log(result.isDebouncing) // true
	 * 	}
	 * }
	 * 
	 * Each call to toggleLikePost or toggleFavPost resets the timer; callback runs 1s after calls stop
	 * 
	 * @param key - Уникальный идентификатор объекта (например, ID поста)
	 * @param action - Функция, которую нужно выполнить
	 * @param options - Опции (delay, groupKey, maxCacheData) или число для delay (обратная совместимость)
	 * @param groupKeyLegacy - Ключ группировки (для обратной совместимости)
	 * @returns DebouncedActionResult с isDebouncing, cancel и flush методами
	 */
	debouncedAction = (
		key: string | number,
		action: () => void,
		options: DebouncedActionOptions | number = {},
		groupKeyLegacy?: string
	): DebouncedActionResult => {
		const opts: DebouncedActionOptions = typeof options === 'number'
			? { delay: options, groupKey: groupKeyLegacy || 'default' }
			: options;

		const delay = opts.delay || 500;
		const groupKey = opts.groupKey || 'default';
		const maxCacheData = opts.maxCacheData || 10;

		const actionKey = `${groupKey}_${key}`;

		this.actionRegistry.set(actionKey, new Set([action]));

		const currentState = this.debouncedActions.get(actionKey);
		if (currentState?.timerId) {
			clearTimeout(currentState.timerId);
		}

		runInAction(() => {
			this.debouncingState.set(actionKey, true);
		});

		const timerId: any = setTimeout(() => {
			runInAction(() => {
				const actions = this.actionRegistry.get(actionKey);
				if (actions) {
					actions.forEach(act => act());
					this.actionRegistry.delete(actionKey);
				}
				this.debouncedActions.delete(actionKey);
				this.debouncingState.set(actionKey, false);
			});
		}, delay);

		this.debouncedActions.set(actionKey, {
			timerId,
			pendingActions: Array.from(this.actionRegistry.get(actionKey)!),
			timestamp: Date.now()
		});

		if (maxCacheData) {
			this.pruneCacheByPrefix(groupKey, maxCacheData);
		}

		return {
			get isDebouncing() {
				return mobxDebouncer.debouncingState.get(actionKey) || false;
			},
			key: actionKey,
			cancel: () => this.cancelDebouncedActions(key, groupKey),
			flush: () => this.flushDebouncedActions(key, groupKey)
		};
	};

	/**
	 * Removes old debounce entries by prefix (groupKey). Same idea as pruneCacheByPrefix in mobxSaiWs.
	 */
	private pruneCacheByPrefix = (groupKey: string, maxCacheData: number) => {
		const prefix = `${groupKey}_`;

		const prefixEntries: Array<[string, DebouncedAction & { timestamp: number; }]> = [];
		for (const [key, value] of this.debouncedActions.entries()) {
			if (key.startsWith(prefix)) {
				prefixEntries.push([key, value]);
			}
		}

		if (prefixEntries.length <= maxCacheData) return;

		prefixEntries.sort((a, b) => a[1].timestamp - b[1].timestamp);

		const entriesToRemove = prefixEntries.slice(0, prefixEntries.length - maxCacheData);
		entriesToRemove.forEach(([key, value]) => {
			if (value.timerId) {
				clearTimeout(value.timerId);
			}
			this.actionRegistry.delete(key);
			this.debouncedActions.delete(key);
			this.debouncingState.delete(key);
			console.log(`[MobxDebouncer] Removed old debounce entry: ${key}`);
		});

		if (entriesToRemove.length > 0) {
			console.log(`[MobxDebouncer] Pruned ${entriesToRemove.length} entries for group "${groupKey}" (limit: ${maxCacheData})`);
		}
	};

	/**
	 * Runs all pending actions for the given key immediately
	 * 
	 * @param key - Идентификатор объекта
	 * @param groupKey - Ключ группировки
	 */
	flushDebouncedActions = (key: string | number, groupKey: string = 'default'): void => {
		const actionKey = `${groupKey}_${key}`;

		const currentState = this.debouncedActions.get(actionKey);
		if (currentState?.timerId) {
			clearTimeout(currentState.timerId);
		}

		const actions = this.actionRegistry.get(actionKey);
		if (actions) {
			runInAction(() => {
				actions.forEach(action => action());
				this.debouncingState.set(actionKey, false);
			});

			this.actionRegistry.delete(actionKey);
		}

		this.debouncedActions.delete(actionKey);
	};

	/**
	 * Cancels all pending actions for the given key without running them
	 * 
	 * @param key - Идентификатор объекта
	 * @param groupKey - Ключ группировки
	 */
	cancelDebouncedActions = (key: string | number, groupKey: string = 'default'): void => {
		const actionKey = `${groupKey}_${key}`;

		const currentState = this.debouncedActions.get(actionKey);
		if (currentState?.timerId) {
			clearTimeout(currentState.timerId);
		}

		this.actionRegistry.delete(actionKey);
		this.debouncedActions.delete(actionKey);
		runInAction(() => {
			this.debouncingState.set(actionKey, false);
		});
	};

	/**
	 * Cancels all pending actions in the group
	 * 
	 * @param groupKey - Ключ группировки
	 */
	cancelDebouncedActionsByGroup = (groupKey: string): void => {
		const keysToDelete: string[] = [];

		for (const [key, value] of this.debouncedActions.entries()) {
			if (key.startsWith(`${groupKey}_`)) {
				clearTimeout(value.timerId);
				keysToDelete.push(key);
			}
		}

		runInAction(() => {
			keysToDelete.forEach(key => {
				this.actionRegistry.delete(key);
				this.debouncedActions.delete(key);
				this.debouncingState.set(key, false);
			});
		});
	};

	/**
	 * Cancels all pending actions
	 * 
	 */
	cancelAllDebouncedActions = (): void => {
		for (const [_, value] of this.debouncedActions.entries()) {
			clearTimeout(value.timerId);
		}

		runInAction(() => {
			this.actionRegistry.clear();
			this.debouncedActions.clear();
			this.debouncingState.clear();
		});
	};

	getActiveKeysByGroup = (groupKey: string): string[] => {
		const keys: string[] = [];
		const prefix = `${groupKey}_`;

		for (const key of this.debouncedActions.keys()) {
			if (key.startsWith(prefix)) {
				keys.push(key.replace(prefix, ''));
			}
		}

		return keys;
	};

	getActiveCountByGroup = (groupKey: string): number => {
		let count = 0;
		const prefix = `${groupKey}_`;

		for (const key of this.debouncedActions.keys()) {
			if (key.startsWith(prefix)) {
				count++;
			}
		}

		return count;
	};
}

/**
 * Build complex debounce flows in one line. This store handles debounce logic; see functions from mobxDebouncer.
 * Telegram: https://t.me/nics51
 */
const mobxDebouncer = new MobxDebouncer();

/**
 * Wrapper to create a debounced action.
 *
 * @param key - Unique identifier
 * @param action - Function to run
 * @param options - Options or delay (for backward compatibility)
 * @param groupKeyLegacy - groupKey (for backward compatibility)
 * @returns DebouncedActionResult with isDebouncing, cancel, flush
 *
 * @example
 * const result = debouncedAction('myKey', () => console.log('done'), { delay: 1000, groupKey: 'search', maxCacheData: 5 });
 * result.cancel();
 * @example
 * debouncedAction('myKey', () => console.log('done'), 1000, 'search'); // legacy API
 */
export const debouncedAction = (
	key: string | number,
	action: () => void,
	options: DebouncedActionOptions | number = {},
	groupKeyLegacy?: string
): DebouncedActionResult => {
	return mobxDebouncer.debouncedAction(key, action, options, groupKeyLegacy);
};

export const isDebouncing = (key: string | number, groupKey: string = 'default'): boolean => {
	return mobxDebouncer.isDebouncing(key, groupKey);
};

export const flushDebouncedAction = (key: string | number, groupKey: string = 'default'): void => {
	mobxDebouncer.flushDebouncedActions(key, groupKey);
};

export const cancelDebouncedAction = (key: string | number, groupKey: string = 'default'): void => {
	mobxDebouncer.cancelDebouncedActions(key, groupKey);
};

export const cancelDebouncedActionsByGroup = (groupKey: string): void => {
	mobxDebouncer.cancelDebouncedActionsByGroup(groupKey);
};

export const cancelAllDebouncedActions = (): void => {
	mobxDebouncer.cancelAllDebouncedActions();
};

export { mobxDebouncer };
