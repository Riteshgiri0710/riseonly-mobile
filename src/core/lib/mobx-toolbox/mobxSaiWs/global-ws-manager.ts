import { SECURITY_CONFIG } from '@core/config/security.config';
import { logger } from '@lib/helpers';
import { extractDataByPath } from '@lib/obj';
import { clearE2EEncryption, getE2EEncryption, getHmacSigner, nonceManager } from '@lib/security';
import { formatId } from '@lib/text';
import { makeAutoObservable, runInAction } from 'mobx';
import { CacheUpdateHistory } from './cache-update-history';
import { defaultWsOptions } from './const';
import { DebugHistory } from './debug-history';
import { EventsHistory } from './event-history';
import { CacheEntry, FileUploadState, MobxSaiWsInstance, MobxSaiWsOptions, WebSocketMessage, WebSocketResponse } from './types';
import { getAuthServiceStore } from './ws-manager/getters';
import * as wsCache from './ws-manager/cache';
import * as wsConnection from './ws-manager/connection';
import * as wsEvents from './ws-manager/events';
import * as wsE2e from './ws-manager/e2e';
import * as wsMock from './ws-manager/mock';
import * as wsOptimistic from './optimistic';
import * as wsShadow from './ws-manager/shadow';
import * as wsStorage from './ws-manager/storage';
import { UpdateCache } from '../useMobxUpdate';

export class GlobalWebSocketManager {
	constructor() { makeAutoObservable(this); }

	private websocket: WebSocket | null = null;
	public requestCache: Map<string, CacheEntry> = new Map();
	public localStorageCache: Map<string, { timestamp: number; data: any; }> = new Map();

	public mockCache: Map<string, CacheEntry> = new Map();
	public mockMode = false;
	public mockModeRestoredAtStartup = false;

	setMockMode(value: boolean) {
		wsMock.setMockMode(this, value);
	}

	clearMockModeRestoredAtStartup() {
		wsMock.clearMockModeRestoredAtStartup(this);
	}
	public requestToIdMap: Map<string, string> = new Map();
	public requestParamsMap: Map<string, any> = new Map();
	public pendingRequests = new Map<string, boolean>();
	public scrollFetchRequests = new Map<string, { fromWhere: 'fromScroll', fetchWhat: 'top' | 'bot'; }>();
	private processedRequests: Map<string, boolean> = new Map();
	private requestQueue: Array<{
		message: WebSocketMessage,
		data: Partial<MobxSaiWsInstance<any>>,
		options: MobxSaiWsOptions,
		resolve: (result: boolean | undefined) => void,
		requestId?: string;
		tempId?: string;
		retryCount?: number;
	}> = [];
	private isProcessingQueue = false;
	private processingRequestId: string | null = null;

	private removeDuplicates = <T = any>(array: T[], idKey: string = 'id') => wsCache.removeDuplicates(array, idKey);

	private tempDataMap = new Map<string, { tempId: string; tempData: any; options: MobxSaiWsOptions; }>();
	private tempIdCounter = 0;
	private fileUploadTracking = new Map<string, {
		uploadIds: string[];
		fileStates: FileUploadState[];
		checkInterval?: ReturnType<typeof setInterval>;
		requestId: string;
		tempData: any;
		options: MobxSaiWsOptions;
		realMessageSent?: boolean;
		data?: Partial<MobxSaiWsInstance<any>>;
	}>();
	private pendingRealDataReplacements = new Map<string, { realData: any; data: Partial<MobxSaiWsInstance<any>>; options: MobxSaiWsOptions; }>();
	private fileUploadRequestIdMap = new Map<string, string>();
	private restoreOptimisticDataMap = new Map<string, { data: Partial<MobxSaiWsInstance<any>>; options: MobxSaiWsOptions; }>();
	private patchRestoreMap = new Map<string, {
		matchId: string | number;
		matchIdKey: string;
		patchPaths: string[];
		snapshot: Record<string, any>;
		pathToArray: string;
		targetCacheId: string | string[] | any[] | undefined;
		updateCache?: UpdateCache;
	}>();

	private eventHandlers: Map<string, (data: any) => void> = new Map();

	private keyExchangePromise: Promise<void> | null = null;
	private keyExchangeResolver: (() => void) | null = null;

	private token = "";
	private user_id = "";
	private session_id = "";

	wsIsConnected = false;
	wsIsConnecting = true;
	wsIsError = false;
	isLogined = false;
	isReconnecting = false;

	private wsUrl = "";
	private accessToken = "";
	private reconnectTimeout = 5000;
	private maxReconnectAttempts = 5;
	private reconnectAttempts = 0;
	private connectionTimeout = 10000;
	private withoutAuth = false;
	private withoutHeartbeat = false;
	private pingRequest = { type: "ping" };
	private e2eEnabled = false;
	private isReconnectStop = false;

	private heartbeatInterval: NodeJS.Timeout | number | null = null;
	private maxCacheSize = 100;
	private maxLocalStorageCacheSize = 100;
	private pendingMessagesQueue: Array<{
		message: WebSocketMessage | null;
		data: Partial<MobxSaiWsInstance<any>>;
		options: Partial<MobxSaiWsOptions>;
		messageProps?: any;
		fromWhere?: 'fromScroll' | null;
		fetchWhat?: 'top' | 'bot' | null;
		resolve?: (result: boolean | undefined) => void;
	}> = [];

	private wsName = "";

	public debugHistory = new DebugHistory();
	public eventsHistory = new EventsHistory();
	public cacheUpdateHistory = new CacheUpdateHistory();

	public isFirstRequestInSession = true;
	public shadowRequestSent: Set<string> = new Set();
	private appStateListeners: Array<{ remove: () => void; }> = [];
	private visibilityChangeListener: (() => void) | null = null;

	private shadowRequestRegistry = new Map<string, {
		messageProps: any;
		data: Partial<MobxSaiWsInstance<any>>;
		options: Partial<MobxSaiWsOptions>;
	}>();

	initialize(options: {
		wsUrl: string;
		reconnectTimeout?: number;
		maxReconnectAttempts?: number;
		connectionTimeout?: number;
		withoutAuth?: boolean;
		withoutHeartbeat?: boolean;
		pingRequest?: any;
		wsName: string;
		accessToken?: string;
	}) {
		this.wsUrl = options.wsUrl;
		this.accessToken = options.accessToken || "";
		this.reconnectTimeout = options.reconnectTimeout || SECURITY_CONFIG.RECONNECT_TIMEOUT;
		this.maxReconnectAttempts = options.maxReconnectAttempts || SECURITY_CONFIG.MAX_RECONNECT_ATTEMPTS;
		this.connectionTimeout = options.connectionTimeout || 10000;
		this.withoutAuth = options.withoutAuth || false;
		this.withoutHeartbeat = options.withoutHeartbeat || false;
		this.pingRequest = options.pingRequest || { type: "ping" };
		this.wsName = options.wsName || "GlobalWebSocketManager";
		this.e2eEnabled = SECURITY_CONFIG.E2E_ENCRYPTION_ENABLED;

		this.loadLocalStorageCache();
		this.initializeWebSocket();
		this.setupAppStateTracking();
	}

	private setupAppStateTracking = () => wsShadow.setupAppStateTracking(this);

	private resendShadowRequests = () => wsShadow.resendShadowRequests(this);

	resetFirstRequestFlag = () => wsShadow.resetFirstRequestFlag(this);

	unregisterShadowRequest = (cacheId: string | string[] | number) => wsShadow.unregisterShadowRequest(this, cacheId);

	getRegisteredShadowRequests = () => wsShadow.getRegisteredShadowRequests(this);

	private checkShadowRequestRoute = (shadowRequest?: { enabled: boolean; route?: string | string[]; routeParams?: Record<string, any> | Record<string, Record<string, any>>; }) =>
		wsShadow.checkShadowRequestRoute(this, shadowRequest);

	/**
	 * Registers a handler for server-initiated events.
	 *
	 * Server-initiated events are push notifications from the server that arrive
	 * without a prior request (typing indicators, online status, new messages, etc.).
	 *
	 * Unlike request-response (we send → get response → onSuccess/onError),
	 * server-initiated: server sends event → handle via event handler.
	 *
	 * @param type - Event type from server (e.g. "message_typing", "user_online_status_changed")
	 * @param handler - Event handler function
	 *
	 * @example
	 * globalWebSocketManager.registerEventHandler("message_typing", (data) => {
	 *   console.log('User is typing:', data);
	 *   updateTypingIndicator(data);
	 * });
	 */
	registerEventHandler = (type: string, handler: (data: any) => void) => wsEvents.registerEventHandler(this, type, handler);

	registerEventHandlers = (handlers: Array<{ type: string; handler: (data: any) => void; }>) => wsEvents.registerEventHandlers(this, handlers);

	getEventHandler = (type: string) => wsEvents.getEventHandler(this, type);

	unregisterEventHandler = (type: string) => wsEvents.unregisterEventHandler(this, type);

	clearAllEventHandlers = () => wsEvents.clearAllEventHandlers(this);

	getRegisteredEventTypes = () => wsEvents.getRegisteredEventTypes(this);

	// ========== Optimistic Updates Methods ==========

	private createOptimisticData = (body: any, options: MobxSaiWsOptions, requestId: string, data: Partial<MobxSaiWsInstance<any>>) =>
		wsOptimistic.createOptimisticData(this, body, options, requestId, data);

	private deleteOptimisticData = (deleteId: string | number, data: Partial<MobxSaiWsInstance<any>>, options: MobxSaiWsOptions, requestId: string) =>
		wsOptimistic.deleteOptimisticData(this, deleteId, data, options, requestId);

	private deleteOptimisticDataMultiple = (deleteIds: (string | number)[], data: Partial<MobxSaiWsInstance<any>>, options: MobxSaiWsOptions, requestId: string) =>
		wsOptimistic.deleteOptimisticDataMultiple(this, deleteIds, data, options, requestId);

	private updateOptimisticData = (updateId: string | number, body: any, data: Partial<MobxSaiWsInstance<any>>, options: MobxSaiWsOptions, requestId: string) =>
		wsOptimistic.updateOptimisticData(this, updateId, body, data, options, requestId);

	private updateOptimisticDataWithReal = (requestId: string, realData: any, data: Partial<MobxSaiWsInstance<any>>, options: MobxSaiWsOptions) =>
		wsOptimistic.updateOptimisticDataWithReal(this, requestId, realData, data, options);

	private replaceOptimisticDataWithReal = (requestId: string, realData: any, data: Partial<MobxSaiWsInstance<any>>, options: MobxSaiWsOptions) =>
		wsOptimistic.replaceOptimisticDataWithReal(this, requestId, realData, data, options);

	private restoreOptimisticData = (requestId: string, restoreEntry: { data: any; options: MobxSaiWsOptions; }, data: Partial<MobxSaiWsInstance<any>>, options: MobxSaiWsOptions) =>
		wsOptimistic.restoreOptimisticData(this, requestId, restoreEntry, data, options);

	private removeOptimisticData = (requestId: string, error: any, data: Partial<MobxSaiWsInstance<any>>, options: MobxSaiWsOptions) =>
		wsOptimistic.removeOptimisticData(this, requestId, error, data, options);

	applyPatchInPlaceEarly = (instance: any, body: any, patchKey: string, context?: any) => {
		const options = instance?.options;
		if (!options?.optimisticUpdate?.patchInPlace) return;
		wsOptimistic.applyPatchInPlace(this, body, patchKey, instance, options, context);
	};

	private loadLocalStorageCache = () => wsStorage.loadLocalStorageCache(this);

	async initMockFromStorage() {
		await wsStorage.initMockFromStorage(this);
	}

	saveToLocalStorageMock = (cacheId: string, dataObj: { timestamp: number; data: any; }) =>
		wsStorage.saveToLocalStorageMock(cacheId, dataObj);

	getFromLocalStorageMock = (cacheId: string) => wsStorage.getFromLocalStorageMock(cacheId);

	saveToLocalStorage = (cacheId: string, data: any) => wsStorage.saveToLocalStorage(this, cacheId, data);

	getFromLocalStorage = (cacheId: string) => wsStorage.getFromLocalStorage(this, cacheId);

	private getOrCreateDeviceId = () => wsStorage.getOrCreateDeviceId();

	reconnect = () => wsConnection.reconnect(this);
	disconnect = () => wsConnection.disconnect(this);

	private initializeWebSocket = async () => wsConnection.initializeWebSocket(this);

	private connectWebSocket = (url: string) => wsConnection.connectWebSocket(this, url);

	onSocketOpen = async () => wsConnection.onSocketOpen(this);

	sendMessage = async (
		messageProps: any,
		data: Partial<MobxSaiWsInstance<any>>,
		optionsProps?: Partial<MobxSaiWsOptions>,
		fromWhere: 'fromScroll' | null = null,
		fetchWhat: 'top' | 'bot' | null = null,
		skipOptimistic: boolean = false
	): Promise<boolean | undefined> => {
		const options: MobxSaiWsOptions = {
			...defaultWsOptions,
			...optionsProps
		};

		const skipOptimisticUpdate = skipOptimistic;

		data.body = messageProps;

		const pendingRequestId = (data as any).pendingOptimisticRequestId;
		if (pendingRequestId) {
			(data as any).pendingOptimisticRequestId = undefined;
		}
		const timestampMs = pendingRequestId ? Number(pendingRequestId) : Date.now();
		const timestamp = Math.floor(timestampMs / 1000);
		const nonce = SECURITY_CONFIG.NONCE_VALIDATION_ENABLED
			? nonceManager.generateNonce()
			: undefined;

		const message: WebSocketMessage = {
			id: timestampMs,
			type: "service_call",
			service: options.service,
			method: options.method,
			data: messageProps,
			timestamp,
			metadata: {
				auth_required: false,
				headers: {},
				correlation_id: null,
			}
		};

		if (nonce) {
			(message as any).nonce = nonce;
		}

		if (SECURITY_CONFIG.HMAC_SIGNING_ENABLED) {
			const hmacSigner = getHmacSigner();
			if (hmacSigner) {
				const messageString = JSON.stringify(messageProps);
				const signature = hmacSigner.signMessage(messageString, timestamp);
				if (signature) {
					message.metadata = message.metadata || {};
					message.metadata.headers = message.metadata.headers || {};
					message.metadata.headers['X-Signature'] = signature;
				}
			}
		}

		const requestId = message.id.toString();

		this.requestParamsMap.set(requestId, messageProps);

		if (fromWhere === 'fromScroll' && fetchWhat) {
			this.scrollFetchRequests.set(requestId, { fromWhere, fetchWhat });
		}

		let tempId: string | undefined;
		const optimisticAlreadyAddedInFetch = (data as any).optimisticDataAlreadyAdded;
		if (optimisticAlreadyAddedInFetch) {
			(data as any).optimisticDataAlreadyAdded = false;
		}
		if (options.optimisticUpdate?.enabled && options.id && !skipOptimisticUpdate && !optimisticAlreadyAddedInFetch) {
			const optimistic = options.optimisticUpdate;

			if (optimistic.deleteMode) {
				const idsToDelete = optimistic.deleteIds ?? (messageProps?.message_ids ?? (optimistic.deleteId != null ? [optimistic.deleteId] : []));
				if (idsToDelete.length > 1) {
					console.log(`[OptimisticUpdate] deleteIds (multiple): ${idsToDelete.length} items`);
					this.deleteOptimisticDataMultiple(idsToDelete, data, options, requestId);
				} else if (idsToDelete.length === 1) {
					const deleteId = idsToDelete[0];
					console.log(`[OptimisticUpdate] deleteId: ${deleteId}`);
					this.deleteOptimisticData(deleteId, data, options, requestId);
				} else {
					console.warn(`[OptimisticUpdate] deleteId/deleteIds not found in options or message body`);
				}
			} else if (optimistic.updateMode && optimistic.updateTempData) {
				const linkIdFromMessage = messageProps?.link_id || messageProps?.data?.link_id;
				const updateId = linkIdFromMessage || optimistic.updateId;
				if (updateId) {
					console.log(`[OptimisticUpdate] updateId from options: ${optimistic.updateId || 'not in options'}, link_id from message: ${linkIdFromMessage || 'not found'}, using: ${updateId}`);
					this.updateOptimisticData(updateId, messageProps, data, options, requestId);
				} else {
					console.warn(`[OptimisticUpdate] updateId not found in options or message body`);
				}
			} else if (optimistic.patchInPlace && optimistic.createPatch && optimistic.createRollbackSnapshot && optimistic.patchPaths?.length) {
				const patchKey = formatId(options.id);
				const applied = (data as any).appliedPatchKeys;
				if (applied?.has(patchKey)) {
					applied.delete(patchKey);
				} else {
					wsOptimistic.applyPatchInPlace(this, messageProps, patchKey, data, options, optimistic.context);
				}
			} else {
				const optimisticResult = this.createOptimisticData(messageProps, options, requestId, data);
				if (optimistic.files) {
					if (!optimisticResult) {
						console.error(`[sendMessage] Files expected but createOptimisticData failed; not sending request`);
						if (data) {
							runInAction(() => {
								data.status = "rejected";
								data.isPending = false;
								data.isFulfilled = false;
								data.isRejected = true;
								data.error = new Error("Failed to prepare message with media");
							});
						}
					} else {
						tempId = optimisticResult.tempId;
						console.log(`[sendMessage] Files detected, waiting for uploads before sending request`);
					}
					return;
				}
				if (optimisticResult) {
					tempId = optimisticResult.tempId;
				}
			}
		}

		if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
			console.warn(`[sendMessage] ⚠️ WebSocket is not connected (state: ${this.websocket?.readyState}). Queueing request...`);

			if (options.needPending && data) {
				runInAction(() => {
					data.status = "pending";
					data.isPending = true;
					data.isFulfilled = false;
					data.isRejected = false;
				});
			}

			return new Promise<boolean | undefined>((resolve) => {
				this.pendingMessagesQueue.push({
					message: null as any,
					data,
					options: { ...options },
					messageProps,
					fromWhere,
					fetchWhat,
					resolve
				});

				console.log(`[sendMessage] 📝 Queued request for ${options.service}.${options.method}. Queue size: ${this.pendingMessagesQueue.length}`);

				if (!this.wsIsConnecting && !this.isReconnecting) {
					console.log(`[sendMessage] 🔄 Initiating reconnection...`);
					this.initializeWebSocket();
				}
			});
		}

		logger.info(`[sendMessage] 🟢 Sending request:`, JSON.stringify({
			requestId,
			service: options.service,
			method: options.method,
			cacheId: options.id,
			bypassQueue: options.bypassQueue,
			messageType: message.type,
			fromWhere,
			fetchWhat
		}));

		if (options.id) {
			if (this.mockMode) {
				let mockCached = this.mockCache.get(formatId(options.id));
				if (!mockCached?.data?.data) {
					const fromStorage = await this.getFromLocalStorageMock(formatId(options.id));
					if (fromStorage?.data) {
						const entry: CacheEntry = { timestamp: fromStorage.timestamp, data: fromStorage.data, options: {}, fromLocalStorage: true };
						mockCached = entry;
						this.mockCache.set(formatId(options.id), entry);
					}
				}
				if (mockCached?.data?.data != null) {
					if (data) {
						data.data = mockCached.data.data;
						data.status = "fulfilled";
						data.isPending = false;
						data.isFulfilled = true;
						data.isRejected = false;
						data.error = null;
					}
					if (options.onCacheUsed) {
						try {
							options.onCacheUsed(mockCached.data.data, messageProps, 'localCache');
						} catch (e) {
							console.error('[sendMessage] onCacheUsed (mock):', e);
						}
					}
					this.debugHistory.addCachedRequest(
						messageProps,
						options.service,
						options.method,
						formatId(options.id),
						mockCached.data.data,
						false,
						options.fetchIfHaveData,
						options.needPending,
						options.takePath,
						true
					);
					console.log(`[sendMessage] 🎭 mockMode: using mockCache for ${formatId(options.id)}, skipping request`);
					return Promise.resolve(undefined);
				}
			}

			this.setRequestToIdMap(requestId, formatId(options.id), options);

			const takeCachePriority = options.takeCachePriority || 'localCache';
			const fetchIfHaveLocalStorage = options.fetchIfHaveLocalStorage !== undefined ? options.fetchIfHaveLocalStorage : false;
			const storageCache = options.storageCache !== undefined ? options.storageCache : false;

			console.log(`[sendMessage] 🔍 Cache check for ${formatId(options.id)}:`, {
				takeCachePriority,
				fetchIfHaveLocalStorage,
				storageCache,
				fetchIfHaveData: options.fetchIfHaveData
			});

			const memoryCachedEntry = this.requestCache.get(formatId(options.id));

			if (fromWhere === 'fromScroll' && memoryCachedEntry) {
				memoryCachedEntry.options = { ...options };
				this.requestCache.set(formatId(options.id), memoryCachedEntry);
				console.log(`[sendMessage] 🔄 Updated cache options for scroll fetch (${fetchWhat}), fetchAddTo.addTo: ${options.fetchAddTo?.addTo}`);
			}

			let localStorageData: any = null;
			const isScrollFetch = fromWhere === 'fromScroll';

			if (storageCache && !isScrollFetch) {
				localStorageData = await this.getFromLocalStorage(formatId(options.id));
			}

			let cachedEntry: CacheEntry | null = null;
			let isFromLocalStorage = false;

			if (isScrollFetch) {
				console.log(`[sendMessage] 🔄 Scroll fetch detected - skipping cache, will fetch fresh data`);
			} else if (takeCachePriority === 'localStorage') {
				if (localStorageData) {
					cachedEntry = {
						timestamp: Date.now(),
						data: {
							data: localStorageData,
							status: "fulfilled",
							isPending: false,
							isFulfilled: true,
							isRejected: false,
							error: null,
							body: null
						},
						options: { ...options },
						fromLocalStorage: true,
						fetchParams: messageProps
					};
					isFromLocalStorage = true;
					console.log(`[sendMessage] ✅ Using localStorage cache (priority: localStorage)`);
				} else if (memoryCachedEntry) {
					cachedEntry = memoryCachedEntry;
					console.log(`[sendMessage] ✅ Using memory cache (localStorage not found)`);
				}
			} else {
				if (memoryCachedEntry) {
					cachedEntry = memoryCachedEntry;
					console.log(`[sendMessage] ✅ Using memory cache (priority: localCache)`);
				} else if (localStorageData) {
					cachedEntry = {
						timestamp: Date.now(),
						data: {
							data: localStorageData,
							status: "fulfilled",
							isPending: false,
							isFulfilled: true,
							isRejected: false,
							error: null,
							body: null
						},
						options: { ...options },
						fromLocalStorage: true,
						fetchParams: messageProps
					};
					isFromLocalStorage = true;
					console.log(`[sendMessage] ✅ Using localStorage cache (memory not found)`);
				}
			}

			if (cachedEntry && cachedEntry.data?.data && !isScrollFetch) {

				const cachedTakePath = cachedEntry.options?.takePath;
				const newTakePath = options.takePath;
				let cacheCallbackCalled = false;

				if (cachedTakePath !== newTakePath) {
					console.log(`[sendMessage] takePath changed from "${cachedTakePath}" to "${newTakePath}", need to re-fetch`);
				} else {
					if (data && !data.data) {
						data.data = cachedEntry.data.data;
						data.status = "fulfilled";
						data.isPending = false;
						data.isFulfilled = true;
						data.isRejected = false;

						if (options.onCacheUsed) {
							try {
								const cachePriority = isFromLocalStorage ? 'localStorage' : 'localCache';
								options.onCacheUsed(cachedEntry.data.data, messageProps, cachePriority);
								cacheCallbackCalled = true;
							} catch (callbackError) {
								console.error('[sendMessage] Error in onCacheUsed callback:', callbackError);
							}
						}
					}

					if (isFromLocalStorage && !memoryCachedEntry) {
						this.requestCache.set(formatId(options.id), cachedEntry);
						console.log(`[sendMessage] 💾 Saved localStorage data to memory cache`);
					}

					const shouldSkipRequest =
						!options.fetchIfHaveData &&
						(!isFromLocalStorage || !fetchIfHaveLocalStorage);

					if (shouldSkipRequest) {
						this.debugHistory.addCachedRequest(
							messageProps,
							options.service,
							options.method,
							formatId(options.id),
							cachedEntry.data?.data,
							isFromLocalStorage,
							options.fetchIfHaveData,
							!options.needPending,
							options.takePath
						);

						if (options.onCacheUsed && !cacheCallbackCalled && data && data.data) {
							try {
								const cachePriority = isFromLocalStorage ? 'localStorage' : 'localCache';
								options.onCacheUsed(cachedEntry.data?.data, messageProps, cachePriority);
							} catch (callbackError) {
								console.error('[sendMessage] Error in onCacheUsed callback:', callbackError);
							}
						}

						return Promise.resolve(undefined);
					} else {
						const shadowRequestEnabled = options.shadowRequest?.enabled && this.checkShadowRequestRoute(options.shadowRequest);
						const isShadowRequest = shadowRequestEnabled && this.isFirstRequestInSession;

						if (isShadowRequest) {
							console.log(`[sendMessage] 🔄 Cache loaded, making shadow background request (first in session, status remains fulfilled):`, {
								fetchIfHaveData: options.fetchIfHaveData,
								isFromLocalStorage,
								fetchIfHaveLocalStorage,
								needPending: options.needPending,
								shadowRequestEnabled: true
							});
						} else {
							console.log(`[sendMessage] 🔄 Cache loaded, making background request:`, {
								fetchIfHaveData: options.fetchIfHaveData,
								isFromLocalStorage,
								fetchIfHaveLocalStorage,
								needPending: options.needPending,
								shadowRequestEnabled: shadowRequestEnabled,
								isFirstRequest: this.isFirstRequestInSession
							});
						}
					}
				}
			}

			if (cachedEntry) {

				if (options.needStates) {
					const hasTruePendingRequest = Array.from(this.requestToIdMap.entries())
						.some(([reqId, cacheId]) => cacheId === options.id && this.pendingRequests.has(reqId));

					if (!options.fetchIfPending && cachedEntry.data?.status === "pending" && cachedEntry.data?.isPending && hasTruePendingRequest) {
						console.log(`[sendMessage] Skipping request ${requestId} because it's actually pending and fetchIfPending is false`);
						return Promise.resolve(false);
					}

					if (cachedEntry.data?.status === "pending" && cachedEntry.data?.isPending && !hasTruePendingRequest) {
						console.log(`[sendMessage] Clearing stale pending state for ${options.id}`);
						cachedEntry.data.status = "fulfilled";
						cachedEntry.data.isPending = false;
						cachedEntry.data.isFulfilled = true;
						cachedEntry.data.isRejected = false;
					}

					const shadowRequestEnabled = options.shadowRequest?.enabled && this.checkShadowRequestRoute(options.shadowRequest);
					const isShadowRequest = shadowRequestEnabled && this.isFirstRequestInSession;

					if (options.needPending && data && !data.data && !isShadowRequest) {
						console.log(`[sendMessage] Setting pending state for ${options.id} (no cache loaded, not shadow request)`);
						data.status = "pending";
						data.isPending = true;
						data.isFulfilled = false;
						data.isRejected = false;
					} else if (options.needPending && data && data.data) {
						console.log(`[sendMessage] Cache already loaded for ${options.id}, keeping status fulfilled (background request)`);
					} else if (isShadowRequest) {
						console.log(`[sendMessage] Shadow first request for ${options.id}, keeping status fulfilled (no pending)`);
					}
				}
			} else {
				console.log(`[sendMessage] No cache found for ${options.id}, will cache the passed data instance instead of creating empty one`);
				if (data) {
					const shadowRequestEnabled = options.shadowRequest?.enabled && this.checkShadowRequestRoute(options.shadowRequest);
					const isShadowRequest = shadowRequestEnabled && this.isFirstRequestInSession;

					if (options.needPending && !isShadowRequest) {
						data.status = "pending";
						data.isPending = true;
						data.isFulfilled = false;
						data.isRejected = false;
					} else if (isShadowRequest) {
						console.log(`[sendMessage] Shadow first request for ${options.id} (no cache), keeping status as is`);
					}
					this.updateCache(formatId(options.id), data, message, options);
				}
			}
		}

		if (options.bypassQueue) {
			console.log(`Bypassing queue for request ${requestId}`);
			this.pendingRequests.set(requestId, true);
			return this.sendDirectMessage(message, data, options);
		}

		return new Promise<boolean | undefined>((resolve) => {
			console.log(`Queuing request ${requestId}, queue length: ${this.requestQueue.length}`);
			this.requestQueue.push({
				message,
				data,
				options: { ...options },
				resolve,
				requestId,
				tempId,
				retryCount: 0
			});

			if (!this.isProcessingQueue) {
				this.processNextRequest();
			}
		});
	};

	private processNextRequest = () => {
		if (this.requestQueue.length === 0) {
			this.isProcessingQueue = false;
			this.processingRequestId = null;
			return;
		}

		if (this.processingRequestId && this.pendingRequests.has(this.processingRequestId)) {
			return;
		}

		this.isProcessingQueue = true;
		const queueItem = this.requestQueue.shift()!;
		const { message, data, options, resolve, requestId, tempId, retryCount } = queueItem;

		if (data && options.needPending) {
			data.status = "pending";
			data.isPending = true;
			data.isFulfilled = false;
			data.isRejected = false;
		}

		if (requestId) {
			this.processingRequestId = requestId;
			this.pendingRequests.set(requestId, true);

			setTimeout(() => {
				if (this.pendingRequests.has(requestId)) {
					console.warn(`Request ${requestId} timed out, continuing queue`);

					if (data) {
						data.status = "rejected";
						data.isPending = false;
						data.isRejected = true;
						data.isFulfilled = false;
						data.error = new Error("Request timed out");
					}

					this.pendingRequests.delete(requestId);
					if (this.processingRequestId === requestId) {
						this.processingRequestId = null;
						this.processNextRequest();
					}
				}
			}, 5000);
		}

		this.sendDirectMessage(message, data, options).then(resolve);
	};

	private sendDirectMessage = async (
		message: WebSocketMessage,
		data: Partial<MobxSaiWsInstance<any>>,
		options: Partial<MobxSaiWsOptions>
	): Promise<boolean | undefined> => {
		if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
			console.warn("Cannot send message, socket is not open. Adding to queue...");
			this.pendingMessagesQueue.push({ message, data, options });
			console.log(`[sendDirectMessage] Queued message. Queue size: ${this.pendingMessagesQueue.length}`);
			this.initializeWebSocket();
			return;
		}

		if (this.websocket.readyState === WebSocket.OPEN && !this.wsIsConnected) {
			console.log(`[sendDirectMessage] WebSocket is open but wsIsConnected is false, updating status`);
			runInAction(() => {
				this.wsIsConnecting = false;
				this.wsIsConnected = true;
				this.wsIsError = false;
			});
			console.log(`[sendDirectMessage] ✅ Updated wsIsConnected to true`);
		}

		try {
			if (this.e2eEnabled && message.type !== 'key_exchange') {
				const e2e = getE2EEncryption();

				if (e2e && e2e.isSessionEstablished()) {
					const plaintext = JSON.stringify(message);
					const sessionId = e2e.getSessionId();
					const timestamp = Math.floor(Date.now() / 1000);

					const sessionIdBytes = new TextEncoder().encode(sessionId!);
					const timestampBytes = new Uint8Array(8);
					const view = new DataView(timestampBytes.buffer);
					view.setBigUint64(0, BigInt(timestamp), false);

					const associatedData = `${sessionId}:${timestamp}`;

					if (message.method !== "ping") {
						console.log("🔐 [E2E] Encrypting:", {
							sessionId,
							timestamp,
							associatedData,
							messagePreview: plaintext.substring(0, 100) + "..."
						});
					}

					const encryptedData = await e2e.encryptMessage(plaintext, associatedData);
					const encryptedBytes = this.base64ToUint8Array(encryptedData);

					const binaryMessage = new Uint8Array(
						1 +
						1 + sessionIdBytes.length +
						8 +
						encryptedBytes.length
					);

					let offset = 0;
					binaryMessage[offset++] = 0x01;
					binaryMessage[offset++] = sessionIdBytes.length;
					binaryMessage.set(sessionIdBytes, offset);
					offset += sessionIdBytes.length;
					binaryMessage.set(timestampBytes, offset);
					offset += 8;
					binaryMessage.set(encryptedBytes, offset);

					if (message.method !== "ping") {
						console.log("🔒 [E2E] Binary frame:", {
							totalBytes: binaryMessage.length,
							sessionIdLen: sessionIdBytes.length,
							timestampBytes: Array.from(timestampBytes),
							encryptedLen: encryptedBytes.length
						});
					}

					this.debugHistory.addRequest(
						message.data,
						message.service,
						message.method,
						false,
						undefined,
						message.id.toString(),
						true,
						binaryMessage,
						options.fetchIfHaveData,
						options.needPending === false,
						options.takePath
					);
					this.websocket.send(binaryMessage);
					const shouldRegisterShadow = options.shadowRequest?.enabled && this.checkShadowRequestRoute(options.shadowRequest);
					if (shouldRegisterShadow) {
						if (!this.shadowRequestSent) {
							this.shadowRequestSent = new Set();
						}
						const cacheId = formatId(options.id || '');
						if (!this.shadowRequestSent.has(cacheId)) {
							this.shadowRequestSent.add(cacheId);
							console.log(`[sendDirectMessage] Shadow first request sent for ${cacheId}, marking as sent`);

							this.shadowRequestRegistry.set(cacheId, {
								messageProps: message.data,
								data,
								options
							});
							console.log(`[sendDirectMessage] ✅ Registered shadow request for ${cacheId} (total: ${this.shadowRequestRegistry.size})`);

							if (this.isFirstRequestInSession) {
								this.isFirstRequestInSession = false;
								console.log(`[sendDirectMessage] Reset isFirstRequestInSession to false after first shadow request`);
							}
						}
					}
					return true;
				} else {
					if (message.method !== "ping") {
						console.log("⚠️ E2E enabled but session not established, sending unencrypted");
					}
				}
			}

			const messageString = JSON.stringify(message);
			if (message.method !== "ping") {
				console.log("📤 [NETWORK] Sending WebSocket message:", messageString.substring(0, 200) + "...");
				this.debugHistory.addRequest(
					message.data,
					message.service,
					message.method,
					false,
					undefined,
					message.id.toString(),
					false,
					undefined,
					options.fetchIfHaveData,
					options.needPending === false,
					options.takePath
				);
			}
			this.websocket.send(messageString);
			const shouldRegisterShadow = (options.shadowRequest?.enabled && this.checkShadowRequestRoute(options.shadowRequest));
			if (shouldRegisterShadow) {
				if (!this.shadowRequestSent) {
					this.shadowRequestSent = new Set();
				}
				const cacheId = formatId(options.id || '');
				if (!this.shadowRequestSent.has(cacheId)) {
					this.shadowRequestSent.add(cacheId);
					console.log(`[sendDirectMessage] Shadow first request sent for ${cacheId}, marking as sent`);

					this.shadowRequestRegistry.set(cacheId, {
						messageProps: message.data,
						data,
						options
					});
					console.log(`[sendDirectMessage] ✅ Registered shadow request for ${cacheId} (total: ${this.shadowRequestRegistry.size})`);

					if (this.isFirstRequestInSession) {
						this.isFirstRequestInSession = false;
						console.log(`[sendDirectMessage] Reset isFirstRequestInSession to false after first shadow request`);
					}
				}
			}
			return true;
		} catch (error: any) {
			data.error = error;
			data.isRejected = true;
			data.isFulfilled = false;
			data.isPending = false;
			data.status = "rejected";
			console.error("Error sending message:", error);
			return false;
		}
	};

	getAuthSessionId = () => wsE2e.getAuthSessionId(this);

	performKeyExchange = async (forceNew?: boolean) => wsE2e.performKeyExchange(this, forceNew ?? false);

	uint8ArrayToBase64 = (bytes: Uint8Array) => wsE2e.uint8ArrayToBase64(bytes);

	base64ToUint8Array = (base64: string) => wsE2e.base64ToUint8Array(base64);

	onSocketClose = (event: CloseEvent) => wsConnection.onSocketClose(this, event);

	onSocketError = (error: Event) => wsConnection.onSocketError(this, error);

	private onSocketMessage = async (event: MessageEvent) => {
		if (!event.data) return;

		if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
			try {
				let arrayBuffer: ArrayBuffer;
				if (event.data instanceof Blob) {
					arrayBuffer = await event.data.arrayBuffer();
				} else {
					arrayBuffer = event.data;
				}

				const bytes = new Uint8Array(arrayBuffer);
				console.log("🔒 [E2E] Received binary message:", bytes.length, "bytes");

				if (bytes.length < 10 || bytes[0] !== 0x01) {
					console.error("Invalid binary message format");
					return;
				}

				let offset = 1;
				const sessionIdLength = bytes[offset++];
				const sessionIdBytes = bytes.slice(offset, offset + sessionIdLength);
				offset += sessionIdLength;

				const timestampBytes = bytes.slice(offset, offset + 8);
				offset += 8;

				const encryptedBytes = bytes.slice(offset);

				const sessionId = new TextDecoder().decode(sessionIdBytes);
				const timestampView = new DataView(timestampBytes.buffer, timestampBytes.byteOffset, 8);
				const timestamp = Number(timestampView.getBigUint64(0, false));

				const encryptedData = this.uint8ArrayToBase64(encryptedBytes);

				const e2e = getE2EEncryption();
				if (e2e) {
					const associatedData = `${sessionId}:${timestamp}`;
					const decryptedText = await e2e.decryptMessage(encryptedData, associatedData);
					const decryptedMessage = JSON.parse(decryptedText);

					console.log("🔓 [E2E] Decrypted binary message:", JSON.stringify(decryptedMessage).substring(0, 150) + "...");
					this.processIncomingMessage(decryptedMessage, true, bytes);
				}
			} catch (error) {
				console.error("❌ [E2E] Failed to decrypt binary message:", error);
			}
			return;
		}

		let message: WebSocketResponse;
		try {
			message = JSON.parse(event.data) as WebSocketResponse;
		} catch (error) {
			console.error("Failed to parse WebSocket message:", event.data);
			return;
		}

		this.processIncomingMessage(message);
	};

	private processIncomingMessage = async (message: WebSocketResponse, encrypted = false, encryptedData?: Uint8Array) => {
		logger.info(`[processIncomingMessage] 🔵 Received message:`, JSON.stringify({
			type: message.type,
			hasRequestId: !!message.request_id,
			requestId: message.request_id,
			hasData: !!message.data,
			hasResult: !!message.result,
			hasError: !!message.error,
			status: message.status
		}));

		if ((message as any).type === 'key_exchange_response') {
			try {
				const e2e = getE2EEncryption();
				const authSessionId = this.getAuthSessionId();

				if (e2e && authSessionId) {
					await e2e.completeKeyExchange(message as any, authSessionId);
					console.log('✅ [E2E] Key exchange completed and saved for session:', authSessionId);
					console.log('🔐 [E2E] E2E Session ID:', (message as any).session_id);
				} else if (!authSessionId) {
					console.error('❌ [E2E] Cannot complete key exchange: no auth session_id');
				}

				if (this.keyExchangeResolver) {
					console.log('✅ [E2E] Resolving key exchange promise');
					this.keyExchangeResolver();
					this.keyExchangeResolver = null;
					this.keyExchangePromise = null;
				}
			} catch (error) {
				console.error('❌ [E2E] Failed to complete key exchange:', error);
				if (this.keyExchangeResolver) {
					this.keyExchangeResolver();
					this.keyExchangeResolver = null;
					this.keyExchangePromise = null;
				}
			}
			return;
		}

		if ((message as any).type === 'encrypted_response') {
			try {
				const e2e = getE2EEncryption();
				if (e2e) {
					const encryptedData = (message as any).encrypted_data;
					const sessionId = (message as any).session_id;
					const timestamp = (message as any).timestamp;
					const associatedData = `${sessionId}:${timestamp}`;

					console.log('🔒 [E2E] Received encrypted response:', encryptedData.substring(0, 100) + "...");

					const decryptedText = await e2e.decryptMessage(encryptedData, associatedData);
					const decryptedMessage = JSON.parse(decryptedText);

					console.log('🔓 [E2E] Decrypted message:', JSON.stringify(decryptedMessage).substring(0, 150) + "...");
					message = decryptedMessage;
				}
			} catch (error) {
				console.error('❌ [E2E] Failed to decrypt message:', error);
				return;
			}
		}

		const shouldRecord = message.data?.message !== "pong" &&
			message.error !== "Unknown message type" &&
			message.request_id;

		if (shouldRecord && message.request_id) {
			const requestId = message.request_id.toString();
			this.debugHistory.addResponse(message, message.error, false, requestId, encrypted, encryptedData);
		}

		if (message?.error?.code === "AUTH_ERROR") {
			try {
				const authServiceStore = getAuthServiceStore();
				authServiceStore.fullClear();
			} catch (e) {
				console.error('[processIncomingMessage] Failed to clear auth:', e);
			}
			clearE2EEncryption();
		}

		const requestId = message.request_id ? message.request_id.toString() : null;
		let pendingCacheId = null;

		logger.info(`[processIncomingMessage] Checking pending requests:`, JSON.stringify({
			requestId,
			hasPendingRequest: requestId ? this.pendingRequests.has(requestId) : false,
			pendingRequestsCount: this.pendingRequests.size,
			allPendingIds: Array.from(this.pendingRequests.keys())
		}));

		if (requestId && this.pendingRequests.has(requestId)) {
			console.log(`Processing response for request ${requestId}, pending requests:`, Array.from(this.pendingRequests.keys()));

			if (this.pendingRequests.has(requestId)) {
				console.log(`Request ${requestId} completed, removing from queue`);

				const cacheId = this.requestToIdMap.get(requestId);

				pendingCacheId = cacheId;
				let cachedInstance: Partial<MobxSaiWsInstance<any>> | null = null;

				if (cacheId) {
					const cachedEntry = this.requestCache.get(cacheId);
					if (cachedEntry && cachedEntry.data) {
						cachedInstance = cachedEntry.data;
						console.log(`[processIncomingMessage] Found cached instance for ${cacheId}, will update its status`);
					}
				}

				let dataToUpdate: Partial<MobxSaiWsInstance<any>> | null = cachedInstance;
				if (!dataToUpdate) {
					const pendingQueueItem = this.requestQueue.find(req => req.requestId === requestId);
					if (pendingQueueItem) {
						dataToUpdate = pendingQueueItem.data;
					}
				}

				if (dataToUpdate) {
					const cachedEntry = cacheId ? this.requestCache.get(cacheId) : null;
					const options = cachedEntry?.options || { ...defaultWsOptions };

					const scrollFetchInfo = this.scrollFetchRequests.get(requestId);
					const isScrollFetch = !!scrollFetchInfo;

					if (!message.error && message.status !== 'error') {
						const isHaveMoreResKey = options.dataScope?.isHaveMoreResKey;
						if (isHaveMoreResKey) {
							const rawData = message.data || message.result;

							let isHaveMore: boolean | undefined;

							if (typeof rawData === 'object' && rawData !== null) {
								if (isHaveMoreResKey in rawData) {
									isHaveMore = (rawData as any)[isHaveMoreResKey] as boolean;
								} else {
									const takePath = options?.takePath;
									if (takePath) {
										const result = extractDataByPath(rawData, takePath);
										if (typeof result === 'object' && result !== null && isHaveMoreResKey in result) {
											isHaveMore = result[isHaveMoreResKey as keyof typeof result] as boolean;
										}
									}
								}
							}

							if (isHaveMore !== undefined) {
								if (scrollFetchInfo) {
									if (scrollFetchInfo.fetchWhat === 'bot') {
										(dataToUpdate as any).isHaveMoreBot?.setIsHaveMoreBot?.(isHaveMore);
										logger.info(`[processIncomingMessage]`, `Updated isHaveMoreBot to ${isHaveMore} for bot fetch`);
									} else if (scrollFetchInfo.fetchWhat === 'top') {
										(dataToUpdate as any).isHaveMoreTop?.setIsHaveMoreTop?.(isHaveMore);
										logger.info(`[processIncomingMessage]`, `Updated isHaveMoreTop to ${isHaveMore} for top fetch`);
									}
								} else {
									(dataToUpdate as any).isHaveMoreTop?.setIsHaveMoreTop?.(isHaveMore);
									logger.info(`[processIncomingMessage]`, `Updated isHaveMoreTop to ${isHaveMore} for regular request`);
								}
							} else {
								const fetchDirection = scrollFetchInfo?.fetchWhat || 'unknown';
								logger.warning(`[processIncomingMessage]`, `Could not find ${isHaveMoreResKey} in response for ${fetchDirection} fetch`);
							}
						}
					}

					if (message.error || message.status === 'error') {
						const errorMsg = message.error || message.message || 'Unknown error';

						const error = new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));

						// ========== Handle Optimistic Update Error ==========
						if (options.optimisticUpdate?.enabled) {
							const originalRequestId = this.fileUploadRequestIdMap.get(requestId) || requestId;

							const restoreEntry = this.restoreOptimisticDataMap.get(originalRequestId);
							if (restoreEntry) {
								console.log(`[OptimisticUpdate] Restoring optimistic data after error for request ${originalRequestId}`);
								this.restoreOptimisticData(originalRequestId, restoreEntry, dataToUpdate, options);
								this.restoreOptimisticDataMap.delete(originalRequestId);
							}

							const patchKey = this.requestToIdMap.get(originalRequestId) ?? originalRequestId;
							if (this.patchRestoreMap.has(patchKey)) {
								wsOptimistic.restorePatchInPlace(this, patchKey, dataToUpdate, options);
							}

							const shouldRetry = this.removeOptimisticData(originalRequestId, error, dataToUpdate, options);

							if (shouldRetry && options.queueStrategy?.retry) {
								const queueItem = this.requestQueue.find(item => item.requestId === requestId);
								const retryCount = queueItem?.retryCount || 0;
								const maxAttempts = options.queueStrategy.retry.maxAttempts || 3;

								if (retryCount < maxAttempts) {
									const shouldRetryError = options.queueStrategy.retry.retryOn
										? options.queueStrategy.retry.retryOn(error)
										: true;

									if (shouldRetryError) {
										console.log(`[OptimisticUpdate] Retrying request ${requestId}, attempt ${retryCount + 1}/${maxAttempts}`);

										const backoff = options.queueStrategy.retry.backoff || 'linear';
										const baseDelay = options.queueStrategy.retry.baseDelay || 1000;
										const delay = backoff === 'exponential'
											? baseDelay * Math.pow(2, retryCount)
											: baseDelay * (retryCount + 1);

										setTimeout(() => {
											if (queueItem) {
												queueItem.retryCount = retryCount + 1;
												this.requestQueue.unshift(queueItem);
												this.processNextRequest();
											}
										}, delay);

										return;
									}
								}
							}
						}

						if (isScrollFetch) {
							logger.info(`[processIncomingMessage]`, `Setting scopeStatus to rejected, has method: ${!!(dataToUpdate as any).setScopeRejected}`);
							(dataToUpdate as any).setScopeRejected?.();

							if (scrollFetchInfo?.fetchWhat === 'bot') {
								logger.info(`[processIncomingMessage]`, `Resetting isBotPending to false (error)`);
								(dataToUpdate as any).setBotRejected?.(error);
							} else if (scrollFetchInfo?.fetchWhat === 'top') {
								logger.info(`[processIncomingMessage]`, `Resetting isTopPending to false (error)`);
								(dataToUpdate as any).setTopRejected?.(error);
							}
						} else {
							dataToUpdate.status = "rejected";
							dataToUpdate.isPending = false;
							dataToUpdate.isRejected = true;
							dataToUpdate.isFulfilled = false;
						}
						dataToUpdate.error = error;

						// ========== Call onError callback ==========
						if (options.onError) {
							const fetchParams = requestId ? this.requestParamsMap.get(requestId) : undefined;
							try {
								options.onError(error, fetchParams);
							} catch (callbackError) {
								console.error('[processIncomingMessage] Error in onError callback:', callbackError);
							}
						}
					} else {
						// ========== Handle Optimistic Update Success ==========
						if (options.optimisticUpdate?.enabled) {
							const rawData = message.data || message.result;
							const originalRequestId = this.fileUploadRequestIdMap.get(requestId) || requestId;
							console.log(`[OptimisticUpdate] Using requestId for replacement: ${originalRequestId} (new: ${requestId})`);

							const tempEntry = this.tempDataMap.get(originalRequestId);
							const optionsToUse = tempEntry?.options || options;
							const opt = optionsToUse.optimisticUpdate;

							if (opt?.patchInPlace) {
								const patchKey = this.requestToIdMap.get(originalRequestId) ?? originalRequestId;
								if (opt.confirmPatch) {
									wsOptimistic.confirmPatchInPlace(
										this,
										patchKey,
										rawData,
										dataToUpdate,
										optionsToUse,
										this.requestParamsMap.get(originalRequestId)
									);
								} else {
									wsOptimistic.clearPatchRestore(this, patchKey);
								}
							} else if (opt?.updateMode && opt?.updateId) {
								this.updateOptimisticDataWithReal(originalRequestId, rawData, dataToUpdate, optionsToUse);
								this.restoreOptimisticDataMap.delete(originalRequestId);
							} else if (opt?.deleteMode) {
								this.restoreOptimisticDataMap.delete(originalRequestId);
								console.log(`[OptimisticUpdate] Delete mode - element already removed, cleaning up restore entry`);
							} else {
								this.restoreOptimisticDataMap.delete(originalRequestId);
								this.replaceOptimisticDataWithReal(originalRequestId, rawData, dataToUpdate, optionsToUse);
							}
						}

						if (isScrollFetch) {
							logger.info(`[processIncomingMessage]`, `Setting scopeStatus to fulfilled, has method: ${!!(dataToUpdate as any).setScopeFulfilled}`);
							(dataToUpdate as any).setScopeFulfilled?.();
							logger.info(`[processIncomingMessage]`, `scopeStatus after set: ${(dataToUpdate as any).scopeStatus}`);

							if (scrollFetchInfo?.fetchWhat === 'bot') {
								logger.info(`[processIncomingMessage]`, `Resetting isBotPending to false`);
								(dataToUpdate as any).setBotFulfilled?.();
							} else if (scrollFetchInfo?.fetchWhat === 'top') {
								logger.info(`[processIncomingMessage]`, `Resetting isTopPending to false`);
								(dataToUpdate as any).setTopFulfilled?.();
							}
						} else {
							dataToUpdate.status = "fulfilled";
							dataToUpdate.isPending = false;
							dataToUpdate.isRejected = false;
							dataToUpdate.isFulfilled = true;
						}

						if (message.data || message.result) {
							const rawData = message.data || message.result;
							const takePath = options?.takePath;
							const result = extractDataByPath(rawData, takePath);

							logger.info(`[processIncomingMessage] Processing data:`, JSON.stringify({
								hasTakePath: !!takePath,
								takePath,
								hasResult: !!result,
								resultType: typeof result,
								isResultArray: Array.isArray(result),
								currentDataIsNull: dataToUpdate.data === null,
								hasOptions: !!options,
								isSetData: options?.isSetData
							}));

							const fetchAddTo = options?.fetchAddTo;

							const fetchParams = requestId ? this.requestParamsMap.get(requestId) : undefined;
							const isInitialRequest = !isScrollFetch && fetchParams &&
								(fetchParams.relative_id === null || fetchParams.relative_id === undefined);

							logger.info(`[processIncomingMessage] fetchAddTo logic:`, JSON.stringify({
								hasFetchAddTo: !!fetchAddTo,
								fetchAddToPath: fetchAddTo?.path,
								fetchAddToAddTo: fetchAddTo?.addTo,
								hasExistingData: dataToUpdate.data !== null,
								isScrollFetch,
								scrollFetchInfo: scrollFetchInfo || null,
								isInitialRequest,
								fetchParams
							}));

							if (isInitialRequest && dataToUpdate.data !== null && fetchAddTo && fetchAddTo.path) {
								logger.info(`[processIncomingMessage]`, `🔄 Initial request detected with existing data. Replacing data instead of merging to prevent duplicates.`);

								(dataToUpdate as any).setFetchedCount?.('+');
								if (fetchAddTo?.setArrCallback) {
									if (fetchAddTo?.path) {
										fetchAddTo.setArrCallback(() => {
											// @ts-ignore
											return fetchAddTo?.isSetReversedArr ? result[fetchAddTo.path]?.reverse() : result[fetchAddTo.path];
										});
									} else {
										fetchAddTo.setArrCallback(result as []);
									}
								}
								if (options?.isSetData) {
									dataToUpdate.data = this.preserveMentionedYouFromCache(cacheId, result, dataToUpdate.data);
								}
							} else if (fetchAddTo && fetchAddTo.path && typeof dataToUpdate.data === "object" && dataToUpdate.data !== null) {
								// @ts-ignore
								if (Array.isArray(this.getPathValue(dataToUpdate.data, fetchAddTo.path)) && Array.isArray(result[fetchAddTo.path])) {
									// @ts-ignore
									const targetArray = this.getPathValue(dataToUpdate.data, fetchAddTo.path);

									logger.info(`[processIncomingMessage]`, `Array merge mode, addTo: ${fetchAddTo.addTo}, targetArrayLength: ${targetArray.length}, newArrayLength: ${result[fetchAddTo.path].length}`);

									switch (fetchAddTo.addTo) {
										case "start":
											(dataToUpdate as any).setAddedToStartCount?.('+');
											if (fetchAddTo.setArrCallback) {
												fetchAddTo.setArrCallback((prev: any) => {
													// @ts-ignore
													return fetchAddTo?.isSetReversedArr ? [...result[fetchAddTo.path], ...prev].reverse() : [...result[fetchAddTo.path], ...prev];
												});
											}
											if (!options?.isSetData) return;

											if (dataToUpdate && (dataToUpdate as any).saiUpdater && scrollFetchInfo?.fetchWhat === 'bot' && options.dataScope?.startFrom === 'bot') {
												const scopeLimit = options.dataScope?.scopeLimit;
												const gettedToTop = (dataToUpdate as any).gettedToTop?.gettedToTop || 0;
												const howMuchGettedToTop = options.dataScope?.howMuchGettedToTop;
												const updateCache = options.storageCache ? 'both' : 'localCache';
												// @ts-ignore
												const newMessages = result[fetchAddTo.path];
												const addedCount = newMessages.length;

												logger.info(`[BOT FETCH DEBUG]`, `result object keys: ${Object.keys(result).join(', ')}`);
												logger.info(`[BOT FETCH DEBUG]`, `fetchAddTo.path: ${fetchAddTo.path}`);
												logger.info(`[BOT FETCH DEBUG]`, `newMessages count: ${newMessages.length}`);
												logger.info(`[BOT FETCH DEBUG]`, `newMessages first 3 IDs: [${newMessages.slice(0, 3).map((m: any) => m.id?.substring(0, 8)).join(', ')}]`);
												logger.info(`[BOT FETCH DEBUG]`, `newMessages last 3 IDs: [${newMessages.slice(-3).map((m: any) => m.id?.substring(0, 8)).join(', ')}]`);

												(dataToUpdate as any).saiUpdater(
													null,
													null,
													(prev: any[]) => {
														logger.info(`[BOT FETCH MERGE]`, `Merging bot fetch: ${addedCount} new messages, ${prev.length} existing`);
														logger.info(`[BOT FETCH MERGE]`, `Prev first 3 IDs: [${prev.slice(0, 3).map((m: any) => m.id?.substring(0, 8)).join(', ')}]`);
														logger.info(`[BOT FETCH MERGE]`, `Prev last 3 IDs: [${prev.slice(-3).map((m: any) => m.id?.substring(0, 8)).join(', ')}]`);
														logger.info(`[BOT FETCH MERGE]`, `New messages first 3 IDs: [${newMessages.slice(0, 3).map((m: any) => m.id?.substring(0, 8)).join(', ')}]`);
														logger.info(`[BOT FETCH MERGE]`, `New messages last 3 IDs: [${newMessages.slice(-3).map((m: any) => m.id?.substring(0, 8)).join(', ')}]`);

														const concatenated = [...prev, ...newMessages];
														const newData = this.removeDuplicates(concatenated, 'id');
														const duplicatesRemoved = concatenated.length - newData.length;

														if (duplicatesRemoved > 0) {
															logger.info(`[BOT FETCH MERGE]`, `🔍 Removed ${duplicatesRemoved} duplicates`);
															console.warn("[BOT FETCH MERGE] Duplicates removed: ", duplicatesRemoved);
														}

														logger.info(`[BOT FETCH MERGE]`, `After concat first 3 IDs: [${newData.slice(0, 3).map((m: any) => m.id?.substring(0, 8)).join(', ')}]`);
														logger.info(`[BOT FETCH MERGE]`, `After concat last 3 IDs: [${newData.slice(-3).map((m: any) => m.id?.substring(0, 8)).join(', ')}]`);

														if (scopeLimit && newData.length > scopeLimit) {
															const toRemove = newData.length - scopeLimit;
															const finalData = newData.slice(-scopeLimit);
															logger.info(`[processIncomingMessage]`, `🔄 ATOMIC BOT: Added ${addedCount}, removed ${toRemove} from start (old messages). Final: ${finalData.length}`);
															logger.info(`[BOT FETCH MERGE]`, `Final first 3 IDs: [${finalData.slice(0, 3).map((m: any) => m.id?.substring(0, 8)).join(', ')}]`);
															logger.info(`[BOT FETCH MERGE]`, `Final last 3 IDs: [${finalData.slice(-3).map((m: any) => m.id?.substring(0, 8)).join(', ')}]`);
															return finalData;
														}
														logger.info(`[processIncomingMessage]`, `🔄 ATOMIC BOT: Added ${addedCount}. Final: ${newData.length}`);
														return newData;
													},
													'id',
													cacheId,
													updateCache
												);
												break;
											}

											if (dataToUpdate && (dataToUpdate as any).saiUpdater && scrollFetchInfo?.fetchWhat === 'top') {
												const scopeLimit = options.dataScope?.scopeLimit;
												const gettedToTop = (dataToUpdate as any).gettedToTop?.gettedToTop || 0;
												const howMuchGettedToTop = options.dataScope?.howMuchGettedToTop;

												if (scopeLimit && gettedToTop >= howMuchGettedToTop!) {
													const updateCache = options.storageCache ? 'both' : 'localCache';
													// @ts-ignore
													const addedCount = result[fetchAddTo.path].length;

													(dataToUpdate as any).saiUpdater(
														null,
														null,
														(prev: any[]) => {
															// @ts-ignore
															const concatenated = [...result[fetchAddTo.path], ...prev];
															const newData = this.removeDuplicates(concatenated, 'id');
															const duplicatesRemoved = concatenated.length - newData.length;

															if (duplicatesRemoved > 0) {
																logger.info(`[processIncomingMessage]`, `🔍 TOP FETCH: Removed ${duplicatesRemoved} duplicates`);
																console.warn("[TOP FETCH MERGE] Duplicates removed: ", duplicatesRemoved);
															}

															if (newData.length > scopeLimit) {
																const toRemove = newData.length - scopeLimit;
																const finalData = newData.slice(0, -toRemove);
																logger.info(`[processIncomingMessage]`, `🔄 ATOMIC TOP: Added ${addedCount}, removed ${toRemove} from bottom. Final: ${finalData.length}`);
																return finalData;
															}
															return newData;
														},
														'id',
														cacheId,
														updateCache
													);
													break;
												}
											}

											// @ts-ignore
											const mergedStartArray = this.removeDuplicates([...result[fetchAddTo.path], ...targetArray], 'id');
											logger.info(`[processIncomingMessage]`, `🔍 Deduplicated start array: ${result[fetchAddTo.path].length} + ${targetArray.length} = ${mergedStartArray.length} (removed ${result[fetchAddTo.path].length + targetArray.length - mergedStartArray.length} duplicates)`);
											this.setPathValue(dataToUpdate.data, fetchAddTo.path, mergedStartArray);
											break;
										case "end":
											(dataToUpdate as any).setAddedToEndCount?.('+');
											if (fetchAddTo.setArrCallback) {
												fetchAddTo.setArrCallback((prev: any) => {
													// @ts-ignore
													return fetchAddTo?.isSetReversedArr ? [...prev, ...result[fetchAddTo.path]].reverse() : [...prev, ...result[fetchAddTo.path]];
												});
											}
											if (!options?.isSetData) return;

											if (dataToUpdate && (dataToUpdate as any).saiUpdater && scrollFetchInfo?.fetchWhat === 'bot') {
												const scopeLimit = options.dataScope?.scopeLimit;
												const gettedToTop = (dataToUpdate as any).gettedToTop?.gettedToTop || 0;
												const howMuchGettedToTop = options.dataScope?.howMuchGettedToTop;

												if (scopeLimit && gettedToTop <= -howMuchGettedToTop!) {
													const updateCache = options.storageCache ? 'both' : 'localCache';
													// @ts-ignore
													const addedCount = result[fetchAddTo.path].length;

													(dataToUpdate as any).saiUpdater(
														null,
														null,
														(prev: any[]) => {
															// @ts-ignore
															const concatenated = [...prev, ...result[fetchAddTo.path]];
															const newData = this.removeDuplicates(concatenated, 'id');
															const duplicatesRemoved = concatenated.length - newData.length;

															if (duplicatesRemoved > 0) {
																logger.info(`[processIncomingMessage]`, `🔍 BOT FETCH (end): Removed ${duplicatesRemoved} duplicates`);
															}

															if (newData.length > scopeLimit) {
																const toRemove = newData.length - scopeLimit;
																const finalData = newData.slice(toRemove);
																logger.info(`[processIncomingMessage]`, `🔄 ATOMIC BOT: Added ${addedCount}, removed ${toRemove} from top. Final: ${finalData.length}`);
																return finalData;
															}
															return newData;
														},
														'id',
														cacheId,
														updateCache
													);
													break;
												}
											}

											// @ts-ignore
											const mergedEndArray = this.removeDuplicates([...targetArray, ...result[fetchAddTo.path]], 'id');
											logger.info(`[processIncomingMessage]`, `🔍 Deduplicated end array: ${targetArray.length} + ${result[fetchAddTo.path].length} = ${mergedEndArray.length} (removed ${targetArray.length + result[fetchAddTo.path].length - mergedEndArray.length} duplicates)`);
											this.setPathValue(dataToUpdate.data, fetchAddTo.path, mergedEndArray);
											break;
										case "reset":
										default:
											if (fetchAddTo.setArrCallback) {
												if (fetchAddTo.path) {
													// @ts-ignore
													fetchAddTo.setArrCallback(fetchAddTo?.isSetReversedArr ? [...result[fetchAddTo.path]]?.reverse() : result[fetchAddTo.path]);
												} else {
													fetchAddTo.setArrCallback(result as []);
												}
											}
											if (!options?.isSetData) return;
											this.setPathValue(dataToUpdate.data, fetchAddTo.path, result);
									}
								} else {
									(dataToUpdate as any).setFetchedCount?.('+');
									if (fetchAddTo.setArrCallback) {
										if (fetchAddTo?.path) {
											fetchAddTo.setArrCallback((prev: any) => {
												if (fetchAddTo?.isSetPrevArr) {
													if (fetchAddTo?.isSetReversedArr) {
														// @ts-ignore
														return fetchAddTo?.addTo == 'start' ? [...result[fetchAddTo.path], ...prev].reverse() : [...prev, ...result[fetchAddTo.path]].reverse();
													}
													// start = prepend new chunk; end = append new chunk. No reverse of result.
													// @ts-ignore
													return fetchAddTo?.addTo == 'start' ? [...result[fetchAddTo.path], ...prev] : [...prev, ...result[fetchAddTo.path]];
												}
												if (fetchAddTo?.isSetReversedArr) {
													// @ts-ignore
													return result[fetchAddTo.path]?.reverse();
												}
												// @ts-ignore
												return result[fetchAddTo.path];
											});
										} else {
											fetchAddTo.setArrCallback(result as []);
										}
									}
									if (!options?.isSetData) return;
									dataToUpdate.data = this.preserveMentionedYouFromCache(cacheId, result, dataToUpdate.data);
								}
							} else {
								logger.info(`[processIncomingMessage] First request or no existing data, setting data directly:`, JSON.stringify({
									hasFetchAddTo: !!fetchAddTo,
									fetchAddToPath: fetchAddTo?.path,
									hasSetArrCallback: !!fetchAddTo?.setArrCallback,
									isSetData: options?.isSetData,
									resultKeys: result ? Object.keys(result) : null
								}));

								(dataToUpdate as any).setFetchedCount?.('+');
								if (fetchAddTo?.setArrCallback) {
									if (fetchAddTo?.path) {
										fetchAddTo.setArrCallback((prev: any) => {
											if (fetchAddTo?.isSetPrevArr) {
												// @ts-ignore
												const arrCount = [...prev, ...[...result[fetchAddTo.path]]].length;
												if (fetchAddTo?.isSetReversedArr) {
													// @ts-ignore
													const newList = fetchAddTo?.addTo == 'start' ? [...prev, ...[...result[fetchAddTo.path]]?.reverse()] : [...[...result[fetchAddTo.path]]?.reverse(), ...prev];
													if (options.cacheSystem?.limit) {
														if (arrCount >= options.cacheSystem.limit && options.cacheSystem?.setCache) {
															// @ts-ignore
															options.cacheSystem.setCache(newList);
														}
													}
													return newList;
												}
												// @ts-ignore
												const newList = fetchAddTo?.addTo == 'start' ? [...prev, ...result[fetchAddTo.path]] : [...result[fetchAddTo.path], ...prev];
												if (options.cacheSystem?.limit) {
													if (arrCount >= options.cacheSystem.limit && options.cacheSystem?.setCache) {
														// @ts-ignore
														options.cacheSystem.setCache(newList);
													}
												}
												return newList;
											}
											// @ts-ignore
											const newList = result[fetchAddTo.path];
											const arrCount = newList?.length;
											if (options.cacheSystem?.limit) {
												if (arrCount >= options.cacheSystem.limit && options.cacheSystem?.setCache) {
													// @ts-ignore
													options.cacheSystem.setCache(fetchAddTo?.isSetReversedArr ? newList?.reverse() : newList);
												}
											}
											if (fetchAddTo?.isSetReversedArr) {
												return newList?.reverse();
											}
											return newList;
										});
									} else {
										fetchAddTo.setArrCallback(result as []);
									}
								}
								if (!options?.isSetData) {
									logger.info(`[processIncomingMessage]`, `⚠️ isSetData is false, NOT setting data`);
									return;
								}
								dataToUpdate.data = this.preserveMentionedYouFromCache(cacheId, result, dataToUpdate.data);
							}
						}
					}


					// ========== Call onSuccess callback ==========
					if (!message.error && message.status !== 'error' && options.onSuccess) {
						const fetchParams = requestId ? this.requestParamsMap.get(requestId) : undefined;
						const rawData = message.data || message.result;
						const takePath = options?.takePath;
						const result = extractDataByPath(rawData, takePath);

						try {
							options.onSuccess(result, fetchParams);
						} catch (callbackError) {
							console.error('[processIncomingMessage] Error in onSuccess callback:', callbackError);
						}
					}

					if (cacheId) {
						const cachedEntry = this.requestCache.get(cacheId);
						console.log(`[processIncomingMessage] 🔄 Updating cache for ${cacheId} with new data:`, {
							hasData: !!dataToUpdate.data,
							status: dataToUpdate.status,
							isPending: dataToUpdate.isPending,
							existingFromLocalStorage: cachedEntry?.fromLocalStorage,
							dataLength: Array.isArray(dataToUpdate.data) ? dataToUpdate.data.length : 'not array'
						});
						const originalOptions = cachedEntry?.options || { ...defaultWsOptions, id: cacheId };
						this.updateCache(cacheId, dataToUpdate, message, originalOptions);
					}
				}

				this.pendingRequests.delete(requestId);
				this.scrollFetchRequests.delete(requestId);

				if (this.processingRequestId === requestId) {
					this.processingRequestId = null;
					setTimeout(() => this.processNextRequest(), 0);
				}

				this.requestToIdMap.delete(requestId);
				this.processedRequests.set(requestId, true);
			}
		}

		// ========== Handle Server-Initiated Events (Push Notifications) ==========
		// Server events have no request_id, or request_id is not in pending (already processed)
		const eventType = message.type ?? message.data?.type;
		const isServerEvent = !requestId;
		const notPendingResponse = !requestId || !this.pendingRequests.has(requestId);
		if (eventType && (isServerEvent || notPendingResponse)) {
			const eventHandler = this.getEventHandler(eventType);

			if (eventHandler) {
				console.log(`[processIncomingMessage] Calling event handler for ${eventType}`);
				const raw = message.data ?? message.result ?? message;
				const eventData =
					raw != null && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {};
				try {
					runInAction(() => {
						eventHandler(eventData);
					});
				} catch (handlerError) {
					console.error(`[processIncomingMessage] Error in event handler for ${eventType}:`, handlerError);
				}
			} else {
				console.log(`[processIncomingMessage] No event handler registered for ${eventType}`);
			}
		}

		this.eventsHistory.addEvent(message);

		if (requestId) {
			this.requestParamsMap.delete(requestId);
		}
	};

	private setRequestToIdMap = (requestId: string, id: string, options: MobxSaiWsOptions) =>
		wsCache.setRequestToIdMap(this, requestId, id, options);

	private updateCache = (stateId: string | undefined, data: Partial<MobxSaiWsInstance<any>>, message: any, options: MobxSaiWsOptions) =>
		wsCache.updateCache(this, stateId, data, message, options);

	private pruneCacheByPrefix = (cacheId: string, maxCacheData: number) =>
		wsCache.pruneCacheByPrefix(this, cacheId, maxCacheData);

	/** Preserve is_mentioned_you from existing getMessages cache when backend returns false (e.g. after message_created we had true). */
	private preserveMentionedYouFromCache(cacheId: string | undefined, result: any, existingData: any): any {
		if (!cacheId || !String(cacheId).includes('getMessages')) return result;
		const incomingArr = Array.isArray(result?.messages) ? result.messages : result?.messages?.items;
		const existingArr = Array.isArray(existingData?.messages) ? existingData.messages : existingData?.messages?.items;
		if (!Array.isArray(incomingArr) || !Array.isArray(existingArr)) return result;
		const byId = new Map((existingArr as any[]).map((m: any) => [m.id, m]));
		const merged = incomingArr.map((m: any) => {
			const ex = byId.get(m.id);
			if (ex?.is_mentioned_you === true && !m.is_mentioned_you) return { ...m, is_mentioned_you: true };
			return m;
		});
		if (Array.isArray(result.messages)) {
			return { ...result, messages: merged };
		}
		return { ...result, messages: { ...result.messages, items: merged } };
	}

	private getPathValue = (obj: any, path: string) => wsCache.getPathValue(obj, path);

	private setPathValue = (obj: any, path: string, value: any) => wsCache.setPathValue(obj, path, value);
}

export const globalWebSocketManager = new GlobalWebSocketManager();