import { formatId } from '../../text';
import { runInAction } from 'mobx';
import { defaultWsOptions } from './const';
import { globalWebSocketManager } from './global-ws-manager';
import { MobxSaiWs } from './mobx-sai-ws';
import { CacheEntry, MobxSaiWsInstance, MobxSaiWsOptions } from './types';

export * from './optimistic';

/**
 * Get WebSocket SAI instance by ID
 * 
 * @param id - ID instance
 * @returns MobxSaiWsInstance or null if not found
 */
export function getSaiInstanceById<T = any>(id: string): MobxSaiWsInstance<T> | null {
	const cachedEntry = globalWebSocketManager.requestCache.get(id);

	if (cachedEntry && cachedEntry.data) {
		return cachedEntry.data as MobxSaiWsInstance<T>;
	}

	return null;
}

/**
 * Update local cache (in-memory cache) data
 * 
 * @param cacheId - Cache ID
 * @param updater - Callback that receives current cache and returns updated cache
 * @returns Promise<boolean> - Returns true if update was successful
 */
export async function saiLocalCacheUpdater<T = any>(
	cacheId: string,
	updater: (currentCache: T | null) => T | null
): Promise<boolean> {
	try {
		const formattedId = formatId(cacheId);
		const cachedEntry = globalWebSocketManager.requestCache.get(formattedId);

		if (!cachedEntry || !cachedEntry.data) {
			console.warn(`[saiLocalCacheUpdater] ⚠️ No cache found for ${cacheId}`);
			globalWebSocketManager.cacheUpdateHistory.addUpdate(
				'saiLocalCacheUpdater',
				cacheId,
				{ details: 'Cache not found' },
				false,
				'Cache not found'
			);
			return false;
		}

		const currentData = cachedEntry.data.data as T;
		const updatedData = updater(currentData);

		if (updatedData === undefined || updatedData === null) {
			console.warn(`[saiLocalCacheUpdater] ⚠️ Updater returned ${updatedData} for ${cacheId}`);
			globalWebSocketManager.cacheUpdateHistory.addUpdate(
				'saiLocalCacheUpdater',
				cacheId,
				{ details: `Updater returned ${updatedData}` },
				false
			);
			return false;
		}

		const changes: any = {};

		if (Array.isArray(updatedData) && Array.isArray(currentData)) {
			const lengthDiff = updatedData.length - currentData.length;
			changes.totalCount = updatedData.length;
			changes.previousCount = currentData.length;
			if (lengthDiff > 0) {
				changes.arrayAdded = lengthDiff;
			} else if (lengthDiff < 0) {
				changes.arrayRemoved = Math.abs(lengthDiff);
			} else {
				changes.arrayModified = true;
			}
		} else if (typeof updatedData === 'object' && typeof currentData === 'object') {
			const newKeys = Object.keys(updatedData);
			const oldKeys = Object.keys(currentData || {});
			const changedKeys = newKeys.filter(key =>
				JSON.stringify((updatedData as any)[key]) !== JSON.stringify((currentData as any)?.[key])
			);
			const addedKeys = newKeys.filter(key => !oldKeys.includes(key));
			const removedKeys = oldKeys.filter(key => !newKeys.includes(key));

			if (changedKeys.length > 0) changes.keysChanged = changedKeys;
			if (addedKeys.length > 0) changes.keysAdded = addedKeys;
			if (removedKeys.length > 0) changes.keysRemoved = removedKeys;
		}

		cachedEntry.data.data = updatedData;
		console.log(`[saiLocalCacheUpdater] ✅ Updated local cache for ${cacheId}`, changes);

		globalWebSocketManager.cacheUpdateHistory.addUpdate(
			'saiLocalCacheUpdater',
			cacheId,
			changes,
			true
		);
		return true;
	} catch (error) {
		console.error(`[saiLocalCacheUpdater] ❌ Error updating cache for ${cacheId}:`, error);
		globalWebSocketManager.cacheUpdateHistory.addUpdate(
			'saiLocalCacheUpdater',
			cacheId,
			{ details: String(error) },
			false,
			String(error)
		);
		return false;
	}
}

/**
 * Update localStorage cache data
 * 
 * @param cacheId - Cache ID
 * @param updater - Callback that receives current cache and returns updated cache
 * @returns Promise<boolean> - Returns true if update was successful
 */
export async function saiLocalStorageUpdater<T = any>(
	cacheId: string,
	updater: (currentCache: T | null) => T | null
): Promise<boolean> {
	try {
		const formattedId = formatId(cacheId);
		const currentData = await globalWebSocketManager.getFromLocalStorage(formattedId) as T;
		const updatedData = updater(currentData);

		if (updatedData === undefined || updatedData === null) {
			console.warn(`[saiLocalStorageUpdater] ⚠️ Updater returned ${updatedData} for ${cacheId}`);
			globalWebSocketManager.cacheUpdateHistory.addUpdate(
				'saiLocalStorageUpdater',
				cacheId,
				{ details: `Updater returned ${updatedData}` },
				false
			);
			return false;
		}

		const changes: any = {};

		if (Array.isArray(updatedData) && Array.isArray(currentData)) {
			const lengthDiff = updatedData.length - currentData.length;
			changes.totalCount = updatedData.length;
			changes.previousCount = currentData.length;
			if (lengthDiff > 0) {
				changes.arrayAdded = lengthDiff;
			} else if (lengthDiff < 0) {
				changes.arrayRemoved = Math.abs(lengthDiff);
			} else {
				changes.arrayModified = true;
			}
		} else if (typeof updatedData === 'object' && typeof currentData === 'object') {
			const newKeys = Object.keys(updatedData);
			const oldKeys = Object.keys(currentData || {});
			const changedKeys = newKeys.filter(key =>
				JSON.stringify((updatedData as any)[key]) !== JSON.stringify((currentData as any)?.[key])
			);
			const addedKeys = newKeys.filter(key => !oldKeys.includes(key));
			const removedKeys = oldKeys.filter(key => !newKeys.includes(key));

			if (changedKeys.length > 0) changes.keysChanged = changedKeys;
			if (addedKeys.length > 0) changes.keysAdded = addedKeys;
			if (removedKeys.length > 0) changes.keysRemoved = removedKeys;
		}

		await globalWebSocketManager['saveToLocalStorage'](formattedId, updatedData);
		console.log(`[saiLocalStorageUpdater] ✅ Updated localStorage cache for ${cacheId}`, changes);

		globalWebSocketManager.cacheUpdateHistory.addUpdate(
			'saiLocalStorageUpdater',
			cacheId,
			changes,
			true
		);
		return true;
	} catch (error) {
		console.error(`[saiLocalStorageUpdater] ❌ Error updating localStorage cache for ${cacheId}:`, error);
		globalWebSocketManager.cacheUpdateHistory.addUpdate(
			'saiLocalStorageUpdater',
			cacheId,
			{ details: String(error) },
			false,
			String(error)
		);
		return false;
	}
}

/**
 * Update both local and localStorage cache data simultaneously
 * 
 * @param cacheId - Cache ID
 * @param updater - Callback that receives current cache and returns updated cache
 * @returns Promise<{ localCache: boolean; localStorage: boolean }> - Returns status of both updates
 */
export async function saiCacheUpdater<T = any>(
	cacheId: string,
	updater: (currentCache: T | null) => T | null
): Promise<{ localCache: boolean; localStorage: boolean; }> {
	const results = {
		localCache: false,
		localStorage: false
	};

	try {
		results.localCache = await saiLocalCacheUpdater(cacheId, updater);

		results.localStorage = await saiLocalStorageUpdater(cacheId, updater);

		console.log(`[saiCacheUpdater] Updated caches for ${cacheId}:`, results);

		globalWebSocketManager.cacheUpdateHistory.addUpdate(
			'saiCacheUpdater',
			cacheId,
			{ details: `LocalCache: ${results.localCache}, localStorage: ${results.localStorage}` },
			results.localCache || results.localStorage
		);
		return results;
	} catch (error) {
		console.error(`[saiCacheUpdater] Error updating caches for ${cacheId}:`, error);
		globalWebSocketManager.cacheUpdateHistory.addUpdate(
			'saiCacheUpdater',
			cacheId,
			{ details: String(error) },
			false,
			String(error)
		);
		return results;
	}
}

// ========================== HELPER FUNCTIONS ==============================

/**
 * Checks whether the current route matches shadowRequest conditions.
 */
function checkShadowRequestRoute(shadowRequest?: { enabled: boolean; route?: string | string[]; routeParams?: Record<string, any> | Record<string, Record<string, any>>; }): boolean {
	if (!shadowRequest || !shadowRequest.enabled) {
		return false;
	}

	if (!shadowRequest.route) {
		return true;
	}

	try {
		const { getCurrentRoute } = require('@lib/navigation');
		const currentRoute = getCurrentRoute();

		if (!currentRoute) {
			console.log(`[checkShadowRequestRoute] No current route found, shadow request not allowed`);
			return false;
		}

		const currentRouteName = currentRoute.name;
		const routes = Array.isArray(shadowRequest.route) ? shadowRequest.route : [shadowRequest.route];

		if (!routes.includes(currentRouteName)) {
			console.log(`[checkShadowRequestRoute] Route mismatch: current="${currentRouteName}", required one of: [${routes.join(', ')}]`);
			return false;
		}

		if (shadowRequest.routeParams && Object.keys(shadowRequest.routeParams).length > 0) {
			const currentParams = currentRoute.params || {};
			const paramKeys = Object.keys(shadowRequest.routeParams);

			const isNestedParams = paramKeys.length > 0 &&
				paramKeys.every(key => routes.includes(key)) &&
				paramKeys.every(key => {
					const value = shadowRequest.routeParams![key];
					return typeof value === 'object' && value !== null && !Array.isArray(value);
				});

			if (isNestedParams) {
				const routeParamsForCurrentRoute = shadowRequest.routeParams[currentRouteName] as Record<string, any> | undefined;
				if (routeParamsForCurrentRoute) {
					for (const [key, value] of Object.entries(routeParamsForCurrentRoute)) {
						if (currentParams[key] !== value) {
							console.log(`[checkShadowRequestRoute] Route param mismatch for route "${currentRouteName}": key="${key}", current="${currentParams[key]}", required="${value}"`);
							return false;
						}
					}
				}
			} else {
				for (const [key, value] of Object.entries(shadowRequest.routeParams)) {
					if (currentParams[key] !== value) {
						console.log(`[checkShadowRequestRoute] Route param mismatch: key="${key}", current="${currentParams[key]}", required="${value}"`);
						return false;
					}
				}
			}
		}

		const routeDisplay = Array.isArray(shadowRequest.route) ? `[${routes.join(', ')}]` : shadowRequest.route;
		console.log(`[checkShadowRequestRoute] ✅ Route check passed for ${routeDisplay}`);
		return true;
	} catch (error) {
		console.error(`[checkShadowRequestRoute] Error checking route:`, error);
		return false;
	}
}

// ========================== EXPORT FUNCTION ==============================

export function mobxSaiWs<T>(
	message: any,
	options: Partial<MobxSaiWsOptions> = {}
): MobxSaiWsInstance<T> {
	const { id, fetchIfPending = false, fetchIfHaveData = true } = options;

	console.log(`[mobxSaiWs] Called with id: ${id}, fetchIfPending: ${fetchIfPending}, fetchIfHaveData: ${fetchIfHaveData}`);

	if (id) {
		const formattedId = formatId(id as string | string[]);

		if (globalWebSocketManager.mockMode) {
			const skipMockForOptimisticCreate = options.method === 'create_message' && options.optimisticUpdate?.enabled && options.optimisticUpdate?.createTempData;
			const mockCached = !skipMockForOptimisticCreate ? globalWebSocketManager.mockCache.get(formattedId) : null;
			if (mockCached?.data?.data != null) {
				let instance = (globalWebSocketManager.requestCache.get(formattedId)?.data) as MobxSaiWsInstance<T> | undefined;
				if (!instance) {
					instance = new MobxSaiWs<T>({ ...defaultWsOptions, ...options }) as MobxSaiWsInstance<T>;
					const entry: CacheEntry = {
						timestamp: Date.now(),
						data: instance,
						options: { ...defaultWsOptions, ...options }
					};
					runInAction(() => {
						globalWebSocketManager.requestCache.set(formattedId, entry);
					});
				}
				runInAction(() => {
					instance!.options = {
						...instance!.options,
						...defaultWsOptions,
						...options,
						cacheSystem: { ...instance!.options!.cacheSystem, ...defaultWsOptions.cacheSystem, ...options.cacheSystem },
						dataScope: { ...instance!.options!.dataScope, ...defaultWsOptions.dataScope, ...options.dataScope },
						fetchAddTo: { ...instance!.options!.fetchAddTo, ...defaultWsOptions.fetchAddTo, ...options.fetchAddTo }
					};
					instance!.data = mockCached.data.data as T;
					instance!.status = "fulfilled";
					instance!.isPending = false;
					instance!.isFulfilled = true;
					instance!.isRejected = false;
					instance!.error = null;
				});
				globalWebSocketManager.debugHistory.addCachedRequest(
					message,
					options.service,
					options.method,
					formattedId,
					mockCached.data.data,
					false,
					options.fetchIfHaveData,
					options.needPending,
					options.takePath,
					true
				);
				if (options.onCacheUsed) {
					try {
						options.onCacheUsed(mockCached.data.data as T, message, 'localCache');
					} catch (e) {
						console.error('[mobxSaiWs] onCacheUsed (mock):', e);
					}
				}
				console.log(`[mobxSaiWs] 🎭 mockMode: using mockCache for ${formattedId}, skipping request`);
				return instance;
			}
		}

		const cachedEntry = globalWebSocketManager.requestCache.get(formattedId);

		const skipCacheForOptimistic = Boolean(fetchIfHaveData && options.optimisticUpdate?.enabled);

		console.log(`[mobxSaiWs] 🔍 Looking for cache entry for ${formatId(id)}:`, {
			found: !!cachedEntry,
			hasData: !!cachedEntry?.data,
			fromLocalStorage: cachedEntry?.fromLocalStorage,
			skipCacheForOptimistic,
		});

		if (cachedEntry && cachedEntry.data && !skipCacheForOptimistic) {
			const instance = cachedEntry.data as MobxSaiWsInstance<T>;
			const { isPending, data } = instance;

			const mergedOptimisticUpdate = options.optimisticUpdate || instance.options!.optimisticUpdate || defaultWsOptions.optimisticUpdate ? {
				...instance.options!.optimisticUpdate,
				...defaultWsOptions.optimisticUpdate,
				...options.optimisticUpdate,
				...(options.optimisticUpdate?.deleteId !== undefined && { deleteId: options.optimisticUpdate.deleteId }),
				...(options.optimisticUpdate?.updateId !== undefined && { updateId: options.optimisticUpdate.updateId })
			} as any : undefined;

			instance.options = {
				...instance.options,
				...defaultWsOptions,
				...options,
				cacheSystem: {
					...instance.options!.cacheSystem,
					...defaultWsOptions.cacheSystem,
					...options.cacheSystem
				},
				dataScope: {
					...instance.options!.dataScope,
					...defaultWsOptions.dataScope,
					...options.dataScope
				},
				fetchAddTo: {
					...instance.options!.fetchAddTo,
					...defaultWsOptions.fetchAddTo,
					...options.fetchAddTo
				},
				optimisticUpdate: mergedOptimisticUpdate
			};

			const hasTruePendingRequest = Array.from(globalWebSocketManager.requestToIdMap.entries())
				.some(([reqId, cacheId]) => cacheId === formattedId && globalWebSocketManager.pendingRequests.has(reqId));

			if (!fetchIfPending && isPending && hasTruePendingRequest) {
				console.warn(`[MobxSaiWs] Request ${id} is actually pending and fetchIfPending is false. Returning existing instance with data:`, !!data);
				return instance;
			}

			if (isPending && !hasTruePendingRequest) {
				console.log(`[mobxSaiWs] Clearing stale pending state for ${id}`);
				instance.status = "fulfilled";
				instance.isPending = false;
				instance.isFulfilled = true;
				instance.isRejected = false;
			}

			if (!data && cachedEntry.data?.data) {
				instance.data = cachedEntry.data.data as T;
				console.log(`[mobxSaiWs] ✅ Loaded cached data into instance.data for ${id}`);
			}

			if (!fetchIfHaveData && data) {
				const cachedTakePath = instance.options?.takePath;
				const newTakePath = options.takePath;

				if (cachedTakePath !== newTakePath) {
					console.log(`[mobxSaiWs] takePath changed from "${cachedTakePath}" to "${newTakePath}", need to re-fetch`);
				} else {
					const isFromLocalStorage = cachedEntry.fromLocalStorage || false;
					console.warn(`[MobxSaiWs] Data already exists for ${id} and fetchIfHaveData is false. Using cached data (fromLocalStorage: ${isFromLocalStorage}).`);
					globalWebSocketManager.debugHistory.addCachedRequest(
						message,
						options.service,
						options.method,
						formattedId,
						data,
						isFromLocalStorage,
						options.fetchIfHaveData,
						options.needPending,
						options.takePath
					);

					if (options.onCacheUsed) {
						try {
							const cachePriority = isFromLocalStorage ? 'localStorage' : 'localCache';
							options.onCacheUsed(data as T, message, cachePriority);
						} catch (callbackError) {
							console.error('[mobxSaiWs] Error in onCacheUsed callback:', callbackError);
						}
					}

					return instance;
				}
			}

			const shadowRequestEnabled = options.shadowRequest?.enabled && checkShadowRequestRoute(options.shadowRequest);
			const isFirstRequest = globalWebSocketManager.isFirstRequestInSession;
			const cacheId = formatId(id);

			const shadowRequestAlreadySent = globalWebSocketManager.shadowRequestSent?.has(cacheId) || false;

			if (fetchIfHaveData && data && shadowRequestEnabled && shadowRequestAlreadySent && !isFirstRequest) {
				const cachedTakePath = instance.options?.takePath;
				const newTakePath = options.takePath;

				if (cachedTakePath !== newTakePath) {
					console.log(`[mobxSaiWs] takePath changed from "${cachedTakePath}" to "${newTakePath}", need to re-fetch`);
				} else {
					const isFromLocalStorage = cachedEntry.fromLocalStorage || false;
					console.log(`[mobxSaiWs] Using cached data without request (shadowRequest enabled, shadow request already sent for ${cacheId} in this session, fromLocalStorage: ${isFromLocalStorage})`);
					globalWebSocketManager.debugHistory.addCachedRequest(
						message,
						options.service,
						options.method,
						cacheId,
						data,
						isFromLocalStorage,
						options.fetchIfHaveData,
						options.needPending,
						options.takePath
					);

					if (options.onCacheUsed) {
						try {
							const cachePriority = isFromLocalStorage ? 'localStorage' : 'localCache';
							options.onCacheUsed(data as T, message, cachePriority);
						} catch (callbackError) {
							console.error('[mobxSaiWs] Error in onCacheUsed callback:', callbackError);
						}
					}

					return instance;
				}
			}

			console.log(`[mobxSaiWs] Sending new request for existing instance ${id} (fetchIfHaveData: ${fetchIfHaveData}, shadowRequestEnabled: ${shadowRequestEnabled}, isFirstRequest: ${isFirstRequest})`);
			instance.fetch!(message);
			return instance;
		} else {
			const takeCachePriority = options.takeCachePriority || defaultWsOptions.takeCachePriority || 'localCache';
			const storageCache = options.storageCache !== undefined ? options.storageCache : defaultWsOptions.storageCache;

			if (storageCache && takeCachePriority === 'localStorage') {
				globalWebSocketManager.getFromLocalStorage(formattedId).then((localStorageData) => {
					if (localStorageData) {
						runInAction(() => {
							const instance = getSaiInstanceById<T>(formattedId);
							if (instance && !instance.data) {
								instance.data = localStorageData as T;
								instance.status = "fulfilled";
								instance.isPending = false;
								instance.isFulfilled = true;
								instance.isRejected = false;
								console.log(`[mobxSaiWs] ✅ Loaded data from localStorage for ${id}`);
							}
						});
					}
				}).catch(() => {
					console.error(`[mobxSaiWs] Error loading data from localStorage for ${id}`);
				});
			}

			console.log(`[mobxSaiWs] No cached entry found for ${id}, creating new instance`);
		}
	}

	const instance = (new MobxSaiWs<T>(options)) as MobxSaiWsInstance<T>;
	console.log(`[mobxSaiWs] Created new instance for ${id || 'no-id'}`);

	if (id) {
		const formattedId = formatId(id as string | string[]);
		const cacheEntry: CacheEntry = {
			timestamp: Date.now(),
			data: instance,
			options: { ...defaultWsOptions, ...options }
		};
		runInAction(() => {
			globalWebSocketManager.requestCache.set(formattedId, cacheEntry);
		});
		console.log(`[mobxSaiWs] Cached new instance with id: ${id}`);
	}

	instance.fetch!(message);

	return instance;
}

// ========================== WEBSOCKET MANAGER INITIALIZATION ==============================

export function initializeWebSocketManager(options: {
	wsUrl: string;
	reconnectTimeout?: number;
	maxReconnectAttempts?: number;
	connectionTimeout?: number;
	wsName: string;
	withoutAuth?: boolean;
	withoutHeartbeat?: boolean;
	pingRequest?: any;
	accessToken?: string;
}) {
	globalWebSocketManager.initialize(options);
	return globalWebSocketManager;
}

// ========== Server-Initiated Events API ==========

/**
 * Registers a handler for server-initiated event
 * 
 * Server-initiated события - это push notifications от сервера, которые приходят
 * Without our request (typing indicators, online status, new messages, etc.)
 * 
 * @param type - Тип события от сервера
 * @param handler - Функция-обработчик события
 * 
 * @example
 * registerEventHandler("message_typing", (data) => {
 *   console.log('User is typing:', data);
 * });
 */
export function registerEventHandler(type: string, handler: (data: any) => void) {
	return globalWebSocketManager.registerEventHandler(type, handler);
}

/**
 * Registers multiple event handlers at once
 * 
 * @param handlers - Массив объектов { type, handler }
 * 
 * @example
 * registerEventHandlers([
 *   { type: "message_typing", handler: onTyping },
 *   { type: "user_online_status_changed", handler: onStatusChanged }
 * ]);
 */
export function registerEventHandlers(handlers: Array<{ type: string; handler: (data: any) => void; }>) {
	return globalWebSocketManager.registerEventHandlers(handlers);
}

/**
 * Removes handler for event type
 * @param type - тип события
 */
export function unregisterEventHandler(type: string) {
	return globalWebSocketManager.unregisterEventHandler(type);
}

/**
 * Clears all event handlers
 */
export function clearAllEventHandlers() {
	return globalWebSocketManager.clearAllEventHandlers();
}

/**
 * Returns all registered event types
 * @returns массив типов событий
 */
export function getRegisteredEventTypes(): string[] {
	return globalWebSocketManager.getRegisteredEventTypes();
}

/**
 * Checks if WebSocket is connected.
 *
 * IMPORTANT: This function returns a snapshot and is NOT reactive!
 * For reactive use in components use:
 * websocketApiStore.wsApi.wsIsConnected or globalWebSocketManager.wsIsConnected
 *
 * @returns true if connected, false otherwise
 */
export function isWebSocketConnected(): boolean {
	return globalWebSocketManager.wsIsConnected;
}

/**
 * Checks if WebSocket is in the process of connecting.
 *
 * IMPORTANT: This function returns a snapshot and is NOT reactive!
 * For reactive use in components use:
 * websocketApiStore.wsApi.wsIsConnecting or globalWebSocketManager.wsIsConnecting
 *
 * @returns true if connecting, false otherwise
 */
export function isWebSocketConnecting(): boolean {
	return globalWebSocketManager.wsIsConnecting;
}

/**
 * Waits for WebSocket to connect before proceeding.
 *
 * @param timeout - Max wait time in ms (default 5000)
 * @returns Promise that resolves when WebSocket is connected, or rejects on timeout
 */
export async function waitForWebSocketConnection(timeout: number = 5000): Promise<void> {
	const startTime = Date.now();

	if (globalWebSocketManager.wsIsConnected) {
		return Promise.resolve();
	}

	if (!globalWebSocketManager.wsIsConnecting && !globalWebSocketManager.isReconnecting) {
		console.log('[waitForWebSocketConnection] 🔄 WebSocket not connected, initiating reconnection...');
		globalWebSocketManager.reconnect();
	}

	return new Promise((resolve, reject) => {
		const checkInterval = setInterval(() => {
			const elapsed = Date.now() - startTime;

			if (globalWebSocketManager.wsIsConnected) {
				clearInterval(checkInterval);
				console.log('[waitForWebSocketConnection] ✅ WebSocket connected');
				resolve();
				return;
			}

			if (elapsed >= timeout) {
				clearInterval(checkInterval);
				console.warn('[waitForWebSocketConnection] ⚠️ Timeout waiting for WebSocket connection');
				reject(new Error('WebSocket connection timeout'));
				return;
			}
		}, 100);
	});
}

/**
 * Returns the number of messages in the pending queue.
 * @returns Number of messages in the queue
 */
export function getPendingMessagesCount(): number {
	return (globalWebSocketManager as any).pendingMessagesQueue?.length || 0;
}

/**
 * Unregisters a shadow request.
 * Use when the component is unmounted or the request is no longer needed.
 *
 * @param cacheId - Cache ID of the request to unregister
 *
 * @example
 * unregisterShadowRequest(["getChats", userId]);
 */
export function unregisterShadowRequest(cacheId: string | string[] | number): void {
	return globalWebSocketManager.unregisterShadowRequest(cacheId);
}

/**
 * Returns the list of all registered shadow requests.
 *
 * @returns Array of registered shadow request IDs
 *
 * @example
 * const registered = getRegisteredShadowRequests();
 * console.log("Registered shadow requests:", registered);
 */
export function getRegisteredShadowRequests(): string[] {
	return globalWebSocketManager.getRegisteredShadowRequests();
}

/**
 * Checks if cache exists in the specified places.
 *
 * @param cacheTypes - Cache types to check: ["data", "localCache", "localStorage"] or "all"
 * @param cacheIdOrInstance - Cache ID (string/array/number) or MobxSaiWsInstance
 * @returns true if cache is found in at least one place, false if array is empty or cache not found
 *
 * @example
 * hasSaiCache("all", ["getChats", userId]);
 * hasSaiCache(["data", "localCache"], ["getChats", userId]);
 * hasSaiCache(["data", "localStorage"], chatsInstance);
 */
export async function hasSaiCache(
	cacheTypes: ("data" | "localCache" | "localStorage")[] | "all",
	cacheIdOrInstance: string | string[] | number | MobxSaiWsInstance<any>
): Promise<boolean> {
	if (Array.isArray(cacheTypes) && cacheTypes.length == 0) false;

	const typesToCheck: ("data" | "localCache" | "localStorage")[] =
		cacheTypes === "all"
			? ["data", "localCache", "localStorage"]
			: cacheTypes;

	let cacheId: string | null = null;
	let instance: MobxSaiWsInstance<any> | null = null;

	const isInstance = cacheIdOrInstance &&
		typeof cacheIdOrInstance === 'object' &&
		'data' in cacheIdOrInstance &&
		!(Array.isArray(cacheIdOrInstance) || typeof cacheIdOrInstance === 'string' || typeof cacheIdOrInstance === 'number');

	if (isInstance) {
		instance = cacheIdOrInstance as MobxSaiWsInstance<any>;
		for (const [id, entry] of globalWebSocketManager.requestCache.entries()) {
			if (entry.data === instance) {
				cacheId = id;
				break;
			}
		}

		if (!cacheId && (instance as any).options?.id) {
			cacheId = formatId((instance as any).options.id);
		}
	} else {
		cacheId = formatId(cacheIdOrInstance as string | string[] | number);
		instance = getSaiInstanceById(cacheId);
	}

	if (!cacheId && !instance) {
		return false;
	}

	for (const cacheType of typesToCheck) {
		let hasCacheInType = false;

		switch (cacheType) {
			case "data":
				if (instance && instance.data !== null && instance.data !== undefined) {
					hasCacheInType = true;
				}
				break;

			case "localCache":
				if (cacheId) {
					const cachedEntry = globalWebSocketManager.requestCache.get(cacheId);
					if (cachedEntry && cachedEntry.data) {
						hasCacheInType = true;
					}
				}
				break;

			case "localStorage":
				if (cacheId) {
					const memoryCache = globalWebSocketManager.localStorageCache.get(cacheId);
					if (memoryCache && memoryCache.data !== null && memoryCache.data !== undefined) {
						hasCacheInType = true;
					} else {
						try {
							const localStorageData = await globalWebSocketManager.getFromLocalStorage(cacheId);
							if (localStorageData !== null && localStorageData !== undefined) {
								hasCacheInType = true;
							}
						} catch (error) {
							console.warn(`[hasSaiCache] Error checking localStorage cache for ${cacheId}:`, error);
						}
					}
				}
				break;
		}

		if (hasCacheInType) {
			return true;
		}
	}

	return false;
}

export type { FileUploadState, SaiFile } from './types';
export { globalWebSocketManager };

/**
 * Enables mock mode: all MobxSaiWs requests with id will use mockCache first (ignore fetchIfHaveData).
 * mockCache is filled on every successful response when id exists.
 */
export function switchToMockMode(): void {
	globalWebSocketManager.setMockMode(true);
}

/**
 * Sets mock mode on/off. When true, all requests with id use mockCache first.
 */
export function setMockMode(value: boolean): void {
	globalWebSocketManager.setMockMode(value);
}

