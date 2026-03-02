import { makeAutoObservable, runInAction } from 'mobx';
import { NestedKeyOf, UpdaterT, mobxState } from 'mobx-toolbox';
import { logger } from '../../helpers';

const SCROLL_FETCH_VERBOSE = __DEV__ && false; // Set true for scroll fetch debug
import { isEqual } from '../../obj';
import { formatDiffData, formatId } from '../../text';
import { MobxUpdater, UpdateCache } from '../useMobxUpdate';
import { defaultWsOptions } from './const';
import { globalWebSocketManager } from './global-ws-manager';
import { ExtractArrayElement, MobxSaiWsInstance, MobxSaiWsOptions } from './types';

export class MobxSaiWs<T> {
	constructor(options?: Partial<MobxSaiWsOptions>) {
		this.options = {
			...this.options,
			...defaultWsOptions,
			...options,
			cacheSystem: {
				...this.options.cacheSystem,
				...defaultWsOptions.cacheSystem,
				...options?.cacheSystem
			},
			dataScope: {
				...this.options.dataScope,
				...defaultWsOptions.dataScope,
				...options?.dataScope
			},
			fetchAddTo: {
				...this.options.fetchAddTo,
				...defaultWsOptions.fetchAddTo,
				...options?.fetchAddTo
			}
		};

		const originalOnError = this.options.onError;
		this.options.onError = (error: any, fetchParams?: any) => {
			if (this.options.preData?.enabled && this.options.preData.onRevert) {
				this.options.preData.onRevert(this.preDataSnapshot, error);
			}
			if (originalOnError) originalOnError(error, fetchParams);
		};

		const originalOnSuccess = this.options.onSuccess;
		this.options.onSuccess = (data: any, fetchParams?: any) => {
			this.preDataSnapshot = null; // Clean up snapshot on success
			if (originalOnSuccess) originalOnSuccess(data, fetchParams);
		};

		makeAutoObservable(this, {}, { autoBind: true });
		this.setupScrollTracking();

		if (!this.options.needPending) {
			this.status = "fulfilled";
		}

		this.isHaveMoreTop.setIsHaveMoreTop(this.options.dataScope?.startFrom !== 'top');
		this.isHaveMoreBot.setIsHaveMoreBot(this.options.dataScope?.startFrom !== 'bot');

		if (this.options.initialMessage) {
			this.lastFetchMessage = JSON.parse(JSON.stringify(this.options.initialMessage));
		}
	}

	isPending = false;
	isFulfilled = false;
	isRejected = false;

	isScopePending = false;
	isScopeFulfilled = false;
	isScopeRejected = false;

	status: "pending" | "fulfilled" | "rejected" = "pending";
	scopeStatus: "pending" | "fulfilled" | "rejected" | "" = "";
	data: T | null = null;
	error: Error | null = null;
	body: any = null;

	addedToEndCount = 0;
	addedToStartCount = 0;
	fetchedCount = 0;

	scrollProgress = 0;
	gettedToTop = mobxState(0)('gettedToTop');
	botStatus: "pending" | "fulfilled" | "rejected" | "" = "";
	topStatus: "pending" | "fulfilled" | "rejected" | "" = "";
	scrollCachedData = mobxState<any[]>([])('scrollCachedData');

	isBotPending = false;
	isBotRejected = false;
	isBotFulfilled = false;

	isTopPending = false;
	isTopRejected = false;
	isTopFulfilled = false;

	topError: Error | null = null;
	botError: Error | null = null;

	isHaveMoreBot = mobxState(false)('isHaveMoreBot');
	isHaveMoreTop = mobxState(false)('isHaveMoreTop');

	// Debounce and cooldown for scroll fetches
	private scrollDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	private fetchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	private lastScrollFetchTime = 0;
	private readonly SCROLL_FETCH_COOLDOWN = 500; // 500ms cooldown after each fetch

	private preDataSnapshot: any = null;
	private lastFetchMessage: any = null;

	private oldOptions: MobxSaiWsOptions | null = null;
	messageOrFunction: any = null;

	options: MobxSaiWsOptions = defaultWsOptions;

	setupScrollTracking() {
		if (!this.options.dataScope?.class && !this.options.dataScope?.scrollRef) return;

		if (this.options.dataScope?.class && typeof document !== 'undefined') {
			const element = document.querySelector(`.${this.options.dataScope.class}`);
			if (!element) {
				console.warn("Scroll tracking element not found.");
				return;
			}

			const updateScrollProgress = () => {
				const { scrollTop, scrollHeight, clientHeight } = element;
				this.handleScrollUpdate(scrollTop, scrollHeight, clientHeight);
			};

			element.addEventListener("scroll", updateScrollProgress);
		}

		// React Native
		else if (this.options.dataScope?.scrollRef) {
			const handleScroll = (event: any) => {
				const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
				const scrollTop = contentOffset.y;
				const scrollHeight = contentSize.height;
				const clientHeight = layoutMeasurement.height;

				this.handleScrollUpdate(scrollTop, scrollHeight, clientHeight);
			};

			this.options.dataScope.onScroll = handleScroll;
		}
	}

	handleScrollUpdate(scrollTop: number, scrollHeight: number, clientHeight: number) {
		if (this.scrollDebounceTimer) {
			clearTimeout(this.scrollDebounceTimer);
		}

		this.scrollProgress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);

		this.scrollDebounceTimer = setTimeout(() => {
			this.performScrollFetch(scrollTop, scrollHeight, clientHeight);
		}, 100);
	}

	private performScrollFetch(scrollTop: number, scrollHeight: number, clientHeight: number) {
		const now = Date.now();
		if (now - this.lastScrollFetchTime < this.SCROLL_FETCH_COOLDOWN) {
			if (SCROLL_FETCH_VERBOSE) logger.info("[performScrollFetch]", `Cooldown active`);
			return;
		}

		const { topPercentage, botPercentage, startFrom } = this.options.dataScope!;
		const {
			gettedToTop: { gettedToTop, setGettedToTop },
			isHaveMoreBot: { isHaveMoreBot, setIsHaveMoreBot },
			isHaveMoreTop: { isHaveMoreTop, setIsHaveMoreTop },
			isTopPending,
			isBotPending,
		} = this;

		const {
			relativeParamsKey,
			upOrDownParamsKey,
			howMuchGettedToTop
		} = this.options.dataScope || {};

		if (SCROLL_FETCH_VERBOSE) logger.info("top", JSON.stringify({ topPercentage, scrollProgress: 100 - this.scrollProgress }));

		// === FETCH TOP ===
		if (
			topPercentage !== null &&
			(100 - this.scrollProgress) <= topPercentage! &&
			!isTopPending &&
			isHaveMoreTop
		) {
			if (startFrom == 'top' && gettedToTop >= -(howMuchGettedToTop! - 1)) return;

			if (SCROLL_FETCH_VERBOSE) logger.info("PerformScrollFetch", `FETCH TOP`);

			setGettedToTop(p => {
				let res = p + 1;

				if (!howMuchGettedToTop) {
					logger.info("PerformScrollFetch", `No howMuchGettedToTop provided`);
				}

				if (howMuchGettedToTop && (res >= howMuchGettedToTop)) setIsHaveMoreBot(true);

				return res;
			});
			this.setTopPending();

			// @ts-ignore
			const findedData = this?.data?.[this?.options?.fetchAddTo?.path]?.[0]?.id;

			if (!findedData || findedData == null || findedData == undefined) {
				logger.warning("PerformScrollFetch", `We can't find your relative_id. path: ${this?.options?.fetchAddTo?.path} finded data: ${formatDiffData(findedData)}`);
				return;
			}

			this.oldOptions = this.options;
			const topAddTo = startFrom === 'bot' ? 'end' : 'start';
			this.options = {
				...this.options,
				isSetData: true,
				fetchAddTo: {
					...this.options.fetchAddTo,
					addTo: topAddTo
				}
			};

			this.options.dataScope!.setParams!((prev: any) => {
				const newParams = prev;

				// TODO: hardcoded
				if (!newParams.feed_session_id) {
					// @ts-ignore
					if (relativeParamsKey) {
						const path = this.options.fetchAddTo!.path;
						const data = this.data as Array<T>;

						if (!path || !data) return;

						const arr = data[path as unknown as keyof typeof data] as Array<T>;

						const firstIndex = this.options.dataScope?.relativeIdSelectStrategy === 'reversed' ? arr.length - 1 : 0;
						// @ts-ignore
						const newRelativeId = arr[firstIndex].id;

						newParams[relativeParamsKey] = newRelativeId;
						if (this.messageOrFunction) {
							this.messageOrFunction[relativeParamsKey] = newRelativeId;
						}
					}
				}

				if (upOrDownParamsKey) {
					if (this.options.dataScope?.upStrategy === 'reversed') {
						newParams[upOrDownParamsKey] = true;
					} else {
						newParams[upOrDownParamsKey] = false;
					}
				}
				// @ts-ignore
				if (this.messageOrFunction) {
					if (this.options.dataScope?.upStrategy === 'reversed') {
						// @ts-ignore
						this.messageOrFunction[upOrDownParamsKey] = true;
					} else {
						// @ts-ignore
						this.messageOrFunction[upOrDownParamsKey] = false;
					}
				}
				return newParams;
			});

			if (this.messageOrFunction) {
				this.lastScrollFetchTime = Date.now();
				this.fetch(this.messageOrFunction, 'fromScroll', 'top');
			}
		}

		if (SCROLL_FETCH_VERBOSE) logger.info("bot", JSON.stringify({ botPercentage, scrollProgress: 100 - this.scrollProgress }));

		// === FETCH BOT ===
		if (
			botPercentage !== null &&
			(100 - this.scrollProgress) >= botPercentage! &&
			!isBotPending &&
			this.data &&
			this.options.fetchAddTo!.path &&
			// @ts-ignore
			this.data[this.options.fetchAddTo!.path!] &&
			this.options.dataScope!.setParams &&
			isHaveMoreBot &&
			howMuchGettedToTop
		) {
			if (startFrom == 'bot' && gettedToTop < howMuchGettedToTop) return;

			// CRITICAL: Save relative_id RIGHT NOW, before any other operations!
			// @ts-ignore
			const dataArray = this.data[this.options.fetchAddTo!.path!];

			if (!dataArray || dataArray.length === 0) {
				console.warn(`[BOT FETCH] Empty data array, aborting`);
				return;
			}

			const first3 = dataArray?.slice(0, 3).map((m: any) => typeof m.id === 'string' ? m.id?.substring(0, 8) : m.id).join(', ');
			const last3 = dataArray?.slice(-3).map((m: any) => typeof m.id === 'string' ? m.id?.substring(0, 8) : m.id).join(', ');
			if (SCROLL_FETCH_VERBOSE) logger.info("[handleScrollUpdate]", `BOT FETCH snapshot`);

			const relativePost = dataArray[dataArray.length - 1];
			const savedRelativeId = relativePost?.id;

			if (!savedRelativeId) {
				console.warn(`[BOT FETCH] Can't find relative Id in last element`);
				return;
			}

			if (SCROLL_FETCH_VERBOSE) logger.info("[handleScrollUpdate]", `SAVED relative_id for BOT`);

			setGettedToTop(p => {
				let res = p - 1;

				if (SCROLL_FETCH_VERBOSE && !howMuchGettedToTop) logger.info("PerformScrollFetch", `No howMuchGettedToTop`);
				if (howMuchGettedToTop && (res < howMuchGettedToTop)) setIsHaveMoreTop(true);

				return res;
			});
			this.setBotPending();

			this.oldOptions = this.options;
			const botAddTo = startFrom === 'bot' ? 'start' : 'end';
			this.options = {
				...this.options,
				isSetData: true,
				fetchAddTo: {
					...this.options.fetchAddTo,
					addTo: botAddTo
				}
			};

			if (this.messageOrFunction && relativeParamsKey) {
				this.messageOrFunction[relativeParamsKey] = savedRelativeId;
				if (SCROLL_FETCH_VERBOSE) logger.info("[handleScrollUpdate]", `Set messageOrFunction`);
			}

			this.options.dataScope!.setParams!((prev: any) => {
				const newParams = prev;

				// TODO: hardcoded
				if (!newParams.feed_session_id) {
					if (SCROLL_FETCH_VERBOSE) logger.info("[handleScrollUpdate]", `Using SAVED relative_id for BOT`);
					if (relativeParamsKey) newParams[relativeParamsKey] = savedRelativeId;
				} else if (SCROLL_FETCH_VERBOSE) {
					logger.info("[handleScrollUpdate]", `Using feed_session_id`);
				}

				if (upOrDownParamsKey) {
					if (this.options.dataScope?.upStrategy === 'reversed') {
						newParams[upOrDownParamsKey] = false;
					} else {
						newParams[upOrDownParamsKey] = true;
					}
				}
				return newParams;
			});

			if (SCROLL_FETCH_VERBOSE) logger.info("[performScrollFetch]", `Calling fetch for BOT`);
			if (this.messageOrFunction) {
				this.lastScrollFetchTime = Date.now();
				this.fetch(this.messageOrFunction, 'fromScroll', 'bot');
			}
		}
	}

	setIsPending = () => {
		this.status = "pending";
		this.isPending = true;
		this.isFulfilled = false;
		this.isRejected = false;
	};

	setIsFulfilled = () => {
		this.status = "fulfilled";
		this.isPending = false;
		this.isFulfilled = true;
		this.isRejected = false;
	};

	setIsRejected = () => {
		this.status = "rejected";
		this.isPending = false;
		this.isFulfilled = false;
		this.isRejected = true;
	};

	private setTopPending = () => {
		this.topStatus = 'pending';
		this.isTopPending = true;
		this.isTopRejected = false;
		this.isTopFulfilled = false;
	};

	private setTopRejected = (err: Error) => {
		this.topError = err;
		this.topStatus = 'rejected';
		this.isTopPending = false;
		this.isTopRejected = true;
		this.isTopFulfilled = false;
	};

	private setTopFulfilled = () => {
		this.topStatus = 'fulfilled';
		this.isTopPending = false;
		this.isTopRejected = false;
		this.isTopFulfilled = true;
	};

	private setBotPending = () => {
		this.botStatus = 'pending';
		this.isBotPending = true;
		this.isBotRejected = false;
		this.isBotFulfilled = false;
	};

	private setBotRejected = (err: Error) => {
		this.botError = err;
		this.botStatus = 'rejected';
		this.isBotPending = false;
		this.isBotRejected = true;
		this.isBotFulfilled = false;
	};

	private setBotFulfilled = () => {
		this.botStatus = 'fulfilled';
		this.isBotPending = false;
		this.isBotRejected = false;
		this.isBotFulfilled = true;
	};

	setScopePending = () => {
		this.scopeStatus = "pending";
		this.isScopePending = true;
		this.isScopeFulfilled = false;
		this.isScopeRejected = false;
	};

	setScopeFulfilled = () => {
		this.scopeStatus = "fulfilled";
		this.isScopePending = false;
		this.isScopeFulfilled = true;
		this.isScopeRejected = false;
	};

	setScopeRejected = () => {
		this.scopeStatus = "rejected";
		this.isScopePending = false;
		this.isScopeFulfilled = false;
		this.isScopeRejected = true;
	};

	private setAddedToEndCount = (which: '+' | '-' | number) => {
		this.setFetchedCount('+');
		if (typeof which == 'number') this.addedToEndCount = which;
		if (which == '+') this.addedToEndCount = this.addedToEndCount + 1;
		else this.addedToEndCount = this.addedToEndCount - 1;
	};

	private setAddedToStartCount = (which: '+' | '-' | number) => {
		this.setFetchedCount('+');
		if (typeof which == 'number') this.addedToStartCount = which;
		if (which == '+') this.addedToStartCount = this.addedToStartCount + 1;
		else this.addedToStartCount = this.addedToStartCount - 1;
	};

	private setFetchedCount = (which: '+' | '-' | number) => {
		if (typeof which == 'number') this.fetchedCount = which;
		if (which == '+') this.fetchedCount = this.fetchedCount + 1;
		else this.fetchedCount = this.fetchedCount - 1;
	};

	private getPathValue = (obj: any, path: string): any => {
		return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
	};

	private setPathValue = (obj: any, path: string, value: any) => {
		const keys = path.split(".");
		let temp = obj;
		for (let i = 0; i < keys.length - 1; i++) {
			if (!temp[keys[i]]) temp[keys[i]] = {};
			temp = temp[keys[i]];
		}
		temp[keys[keys.length - 1]] = value;
	};

	/**
	 * Updates data in the array or a specific array element.
	 *
	 * @param id - ID of the element to update. If null, the whole array is updated
	 * @param key - Path to the field to update or path to the array (if id === null)
	 * @param updater - Update function or new value
	 * @param idKey - Key to find element by ID (default 'id')
	 * @param cacheId - Request cache ID for sync (required)
	 * @param updateCache - Cache update type: 'localStorage', 'localCache', or 'both'
	 * @param options - fullData: if true, updater receives full this.data and returns new object
	 * 
	 * @example
	 * // Update whole array
	 * saiUpdater(null, "chats", (prev) => prev.map(...), "id", ["getChats", userId], "both");
	 * // Update specific element
	 * saiUpdater(chatId, "participant.more.is_online", true, "id", ["getChats", userId], "both");
	 */
	saiUpdater = <K extends NestedKeyOf<ExtractArrayElement<T> & { id: string | number; }>>(
		id: string | string[] | number | null,
		key: K | null,
		updater: UpdaterT<ExtractArrayElement<T> & { id: string | number; }, K> | ((prev: any[]) => any[]),
		idKey: string = 'id',
		cacheId?: string | string[] | number | null,
		updateCache?: UpdateCache,
		options?: { fullData?: boolean; }
	): void => {
		if (!updater) {
			console.warn('[saiUpdater] updater is not defined');
			return;
		}

		if (!cacheId) {
			console.warn('[saiUpdater] cacheId is not defined');
			return;
		}

		if (!this.data) {
			console.warn('[saiUpdater] No data available');
			return;
		}

		const targetCacheId = formatId(cacheId);

		if (id === null || key === null) {
			if (typeof updater !== 'function') {
				console.warn('[saiUpdater] updater must be a function when id === null or key === null');
				return;
			}

			if (options?.fullData) {
				const updaterFn = updater as (prev: T) => T;
				const newData = updaterFn(this.data as T);
				if (newData != null && typeof newData === 'object' && !Array.isArray(newData)) {
					runInAction(() => {
						this.data = newData;
					});
					this.syncCacheAfterUpdate(targetCacheId, updateCache);
				} else {
					console.warn('[saiUpdater] fullData: updater must return a plain object');
				}
				return;
			}
		}

		const pathToArray = this.options?.pathToArray || key;

		if (!pathToArray) {
			console.warn('[saiUpdater] pathToArray is not defined in options');
			return;
		}

		let arrayData;
		try {
			arrayData = this.getPathValue(this.data, pathToArray);
		} catch (error) {
			console.warn('[saiUpdater] Error getting path value', error);
			return;
		}

		if (!Array.isArray(arrayData)) {
			console.warn('[saiUpdater] Data at pathToArray is not an array');
			return;
		}

		if (id === null || key === null) {
			if (typeof updater !== 'function') {
				console.warn('[saiUpdater] updater must be a function when id === null or key === null');
				return;
			}

			const updaterFn = updater as (prev: any[]) => any[];

			const newArray = updaterFn(arrayData);

			if (!Array.isArray(newArray)) {
				console.warn('[saiUpdater] updater function must return an array');
				return;
			}

			runInAction(() => {
				arrayData.length = 0;
				arrayData.push(...newArray);

				const source = this.data;
				if (source != null && typeof source === 'object' && !Array.isArray(source)) {
					const pathParts = pathToArray.split('.');

					const newData = { ...source };
					let current: any = newData;

					for (let i = 0; i < pathParts.length - 1; i++) {
						const part = pathParts[i];
						const next = current[part];
						current[part] = next != null && typeof next === 'object' ? { ...next } : {};
						current = current[part];
					}

					current[pathParts[pathParts.length - 1]] = [...newArray];

					this.data = newData;
				}
			});

			this.syncCacheAfterUpdate(targetCacheId, updateCache);

			return;
		}

		const mobxUpdater = new MobxUpdater();

		mobxUpdater.updateState(
			arrayData,
			formatId(id),
			key,
			updater as any,
			idKey,
			formatId(cacheId),
			updateCache
		);

		runInAction(() => {
			if (this.data && typeof this.data === 'object') {
				this.data = { ...this.data };
			}
		});

		this.syncCacheAfterUpdate(targetCacheId, updateCache);
	};

	/**
	 * Applies scope limit to array data
	 * Removes excess elements based on startFrom strategy
	 */
	private applyScopeLimit(arrayData: any[]): void {
		const scopeLimit = this.options.dataScope?.scopeLimit;

		if (!scopeLimit || scopeLimit <= 0) {
			return;
		}

		if (arrayData.length <= scopeLimit) {
			return;
		}

		const excessCount = arrayData.length - scopeLimit;
		const startFrom = this.options.dataScope?.startFrom;

		runInAction(() => {
			if (startFrom === 'top') {
				arrayData.splice(arrayData.length - excessCount, excessCount);
				console.log(`[saiUpdater] 🔄 Applied scopeLimit (${scopeLimit}): removed ${excessCount} items from END (startFrom: top)`);
			} else {
				arrayData.splice(0, excessCount);
				console.log(`[saiUpdater] 🔄 Applied scopeLimit (${scopeLimit}): removed ${excessCount} items from START (startFrom: bot)`);
			}
		});
	}

	/**
	 * Syncs the current data state to cache (localStorage and/or localCache)
	 * based on the updateCache parameter
	 */
	private syncCacheAfterUpdate(targetCacheId?: string, updateCache?: UpdateCache): void {
		if (!targetCacheId || !updateCache) {
			return;
		}

		const dataToSync = JSON.parse(JSON.stringify(this.data));

		if (updateCache === 'localCache' || updateCache === 'both') {
			this.syncToLocalCache(targetCacheId, dataToSync);
		}

		if (updateCache === 'localStorage' || updateCache === 'both') {
			this.syncToLocalStorage(targetCacheId, dataToSync);
		}
	}

	/**
	 * Syncs data to local cache (in-memory)
	 */
	private syncToLocalCache(cacheId: string, data: T): void {
		try {
			const formattedId = this.formatCacheId(cacheId);
			const cachedEntry = globalWebSocketManager.requestCache.get(formattedId);

			if (cachedEntry && cachedEntry.data) {
				runInAction(() => {
					cachedEntry.data.data = data;
				});
				console.log(`[saiUpdater] ✅ Synced to localCache: ${cacheId}`);
			} else {
				console.warn(`[saiUpdater] ⚠️ LocalCache entry not found for: ${cacheId}`);
			}
		} catch (error) {
			console.error(`[saiUpdater] ❌ Error syncing to localCache for ${cacheId}:`, error);
		}
	}

	/**
	 * Syncs data to localStorage
	 */
	private async syncToLocalStorage(cacheId: string, data: T): Promise<void> {
		try {
			const formattedId = this.formatCacheId(cacheId);
			await globalWebSocketManager['saveToLocalStorage'](formattedId, data);
			console.log(`[saiUpdater] ✅ Synced to localStorage: ${cacheId}`);
		} catch (error) {
			console.error(`[saiUpdater] ❌ Error syncing to localStorage for ${cacheId}:`, error);
		}
	}

	/**
	 * Formats cache ID (helper method)
	 */
	private formatCacheId(id: string): string {
		return formatId(id);
	}

	/**
	 * Applies preData update to the specified cache.
	 */
	private applyPreData(): void {
		const { preData } = this.options;
		if (!preData || !preData.enabled) return;

		const { targetCacheId, updater, id, key, idKey = 'id', updateCache = 'both', onApply } = preData;

		if (onApply) {
			this.preDataSnapshot = onApply(this.body);
		}

		if (targetCacheId) {
			const formattedTargetId = formatId(targetCacheId as string | string[]);
			const targetInstance = globalWebSocketManager.requestCache.get(formattedTargetId)?.data as MobxSaiWsInstance<any> | undefined;

			if (targetInstance && targetInstance.saiUpdater) {
				console.log(`[MobxSaiWs] Applying preData update to ${formattedTargetId}`);
				const rawUpdater = updater || ((prev: any) => prev);
				const updaterWithBody = (prev: any) => rawUpdater(prev, this.body);
				targetInstance.saiUpdater(
					(id !== undefined ? id : null) as any,
					(key !== undefined ? key : null) as any,
					updaterWithBody as any,
					idKey,
					targetCacheId as any,
					updateCache
				);
			} else {
				console.warn(`[MobxSaiWs] Could not apply preData: target instance ${formattedTargetId} not found or has no saiUpdater`);
			}
		}
	}

	value = () => this.data;
	errorMessage = () => this.error?.message || null;

	fetch = (message: any, fromWhere: 'fromScroll' | null = null, fetchWhat: 'top' | 'bot' | null = null): this => {
		const opt = this.options.optimisticUpdate;
		const hasFilesToUpload = !!opt?.files;
		if (opt?.enabled && opt?.createTempData && this.options.id && !fromWhere && !(this as any).optimisticDataAlreadyAdded && !hasFilesToUpload) {
			const requestId = Date.now().toString();
			(globalWebSocketManager as any).createOptimisticData(message, this.options, requestId, this);
			(this as any).pendingOptimisticRequestId = requestId;
			(this as any).optimisticDataAlreadyAdded = true;
		}

		if (this.options.deepCompare && !fromWhere) {
			const messageSnapshot = JSON.parse(JSON.stringify(message));

			if (this.lastFetchMessage && isEqual(this.lastFetchMessage, messageSnapshot)) {
				if (this.fetchDebounceTimer) {
					clearTimeout(this.fetchDebounceTimer);
					this.fetchDebounceTimer = null;
				}
				return this;
			}

			if (!this.lastFetchMessage && this.options.initialMessage) {
				if (isEqual(this.options.initialMessage, messageSnapshot)) {
					this.lastFetchMessage = messageSnapshot;
					return this;
				}
			}
		}

		runInAction(() => {
			this.body = message;
			if (this.options.preData?.enabled && !fromWhere) {
				this.applyPreData();
			}
		});

		if (this.options.debounceMs && this.options.debounceMs > 0 && !fromWhere) {
			const opt = this.options.optimisticUpdate;
			const patchKey = this.options.id ? formatId(this.options.id) : '';
			const canApplyEarly = !!(
				opt?.patchInPlace &&
				opt?.createPatch &&
				opt?.createRollbackSnapshot &&
				opt?.patchPaths?.length &&
				patchKey
			);

			if (canApplyEarly) {
				const applied = (this as any).appliedPatchKeys ?? ((this as any).appliedPatchKeys = new Set<string>());
				if (!applied.has(patchKey)) {
					applied.add(patchKey);
					(globalWebSocketManager as any).applyPatchInPlaceEarly?.(this, message, patchKey, opt.context);
				}
			}

			console.log(`[MobxSaiWs.fetch] ⏳ Debouncing for ${this.options.debounceMs}ms...`);
			if (this.fetchDebounceTimer) {
				clearTimeout(this.fetchDebounceTimer);
			}

			this.fetchDebounceTimer = setTimeout(() => {
				runInAction(() => {
					this.executeFetch(message, fromWhere, fetchWhat);
				});
			}, this.options.debounceMs);

			return this;
		}

		return this.executeFetch(message, fromWhere, fetchWhat);
	};

	private executeFetch = (message: any, fromWhere: 'fromScroll' | null = null, fetchWhat: 'top' | 'bot' | null = null): this => {
		this.lastFetchMessage = JSON.parse(JSON.stringify(message));

		logger.info(`[MobxSaiWs.fetch]`, JSON.stringify({
			fromWhere,
			fetchWhat,
			isPending: this.isPending,
			isBotPending: this.isBotPending,
			isTopPending: this.isTopPending,
			hasData: !!this.data
		}));

		const {
			gettedToTop: { gettedToTop },
			isHaveMoreBot: { setIsHaveMoreBot, isHaveMoreBot },
			isHaveMoreTop: { setIsHaveMoreTop, isHaveMoreTop }
		} = this;
		const {
			fetchIfPending,
			fetchIfHaveData,
			needPending
		} = this.options;

		if (!fetchIfPending && this.isPending) {
			const optimistic = this.options.optimisticUpdate;
			if (optimistic?.enabled && this.options.id) {
				const tempRequestId = `pending-optimistic-${Date.now()}-${Math.random()}`;

				if (optimistic.deleteMode) {
					const linkIdFromMessage = message?.link_id || message?.data?.link_id;
					const deleteId = linkIdFromMessage || optimistic.deleteId;
					if (deleteId) {
						console.log(`[OptimisticUpdate] Executing optimistic delete while skipping request (isPending): deleteId=${deleteId}`);
						(globalWebSocketManager as any).deleteOptimisticData(deleteId, this as any, this.options, tempRequestId);
					}
				} else if (optimistic.updateMode && optimistic.updateId && optimistic.updateTempData) {
					const linkIdFromMessage = message?.link_id || message?.data?.link_id;
					const updateId = linkIdFromMessage || optimistic.updateId;
					if (updateId) {
						console.log(`[OptimisticUpdate] Executing optimistic update while skipping request (isPending): updateId=${updateId}`);
						(globalWebSocketManager as any).updateOptimisticData(updateId, message, this as any, this.options, tempRequestId);
					}
				} else if (optimistic.createTempData) {
					console.log(`[OptimisticUpdate] Executing optimistic create while skipping request (isPending)`);
					(globalWebSocketManager as any).createOptimisticData(message, this.options, tempRequestId, this as any);
				}
			}
			logger.info("WebSocket request", "already pending and fetchIfPending is false - SKIPPING");
			return this;
		}

		if (!fetchIfHaveData && this.data && !fromWhere) {
			logger.info("Data already exists", "and fetchIfHaveData is false - SKIPPING");
			return this;
		}

		if (fetchWhat === 'bot' && !isHaveMoreBot) {
			logger.info("Skipping BOT fetch", "because isHaveMoreBot is false");
			return this;
		}

		if (fetchWhat === 'top' && !isHaveMoreTop) {
			logger.info("Skipping TOP fetch", "because isHaveMoreTop is false");
			return this;
		}

		if (fromWhere == null && fetchWhat == null) {
			if (needPending) {
				this.setIsPending();
			}
			this.error = null;
		} else {
			this.setScopePending();
		}

		this.body = message;
		this.messageOrFunction = message;

		logger.info(`[MobxSaiWs.fetch]`, `✅ Calling sendMessage for ${fetchWhat || 'initial'} fetch`);

		const modifiedOptions = fromWhere === 'fromScroll'
			? { ...this.options, fetchIfHaveData: true, needPending: false }
			: this.options;

		logger.info(`[MobxSaiWs.fetch] Options check:`, JSON.stringify({
			fetchAddToPath: modifiedOptions.fetchAddTo?.path,
			fetchAddToAddTo: modifiedOptions.fetchAddTo?.addTo,
			isSetData: modifiedOptions.isSetData,
			fetchIfHaveData: modifiedOptions.fetchIfHaveData,
			fetchWhat,
			deleteId: modifiedOptions.optimisticUpdate?.deleteId,
			updateId: modifiedOptions.optimisticUpdate?.updateId
		}));

		globalWebSocketManager.sendMessage(message, this as any, modifiedOptions, fromWhere, fetchWhat);

		return this;
	};

	setScrollRef(scrollRef: any) {
		if (this.options.dataScope) {
			this.options.dataScope.scrollRef = scrollRef;

			const handleScroll = (event: any) => {
				const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
				const scrollTop = contentOffset.y;
				const scrollHeight = contentSize.height;
				const clientHeight = layoutMeasurement.height;

				this.handleScrollUpdate(scrollTop, scrollHeight, clientHeight);
			};

			this.options.dataScope.onScroll = handleScroll;
		}

		return this;
	}
}
