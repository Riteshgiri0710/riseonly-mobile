import { MobxSaiFetchCacheSystemOptions, MobxSaiFetchFetchAddToOptions, MobxStateWithGetterAndSetter } from 'mobx-toolbox';
import { NestedKeyOf, UpdateCache, UpdaterT } from '../useMobxUpdate';

// ============= BASE TYPES =============

/**
 * Strategy for choosing relative_id for scroll.
 * - 'default': take first element of array
 * - 'reversed': reverse array before taking first element
 * @default 'default'
 */
export type RelativeIdSelectStrategy = 'default' | 'reversed';

/**
 * Scroll direction strategy (up/down).
 * - 'default': standard direction
 * - 'reversed': reversed direction
 * @default 'default'
 */
export type UpStrategy = 'default' | 'reversed';

/**
 * Cache priority when loading data.
 * - 'localStorage': check localStorage first, then localCache
 * - 'localCache': check localCache (memory) first, then localStorage
 * @default 'localCache'
 */
export type CachePriority = 'localStorage' | 'localCache';

// ============= DATA SCOPE OPTIONS (infinite scroll) =============

/**
 * Options for infinite scroll.
 * Used for automatic data loading when scrolling the list.
 */
export interface MobxSaiWsDataScopeOptions {
   /** CSS class for scroll element (web). @default null @example '.messages-list' */
   class: string | null;

   /** Max number of items in the array. @default null @example 100 */
   scopeLimit: number | null;

   /** Where loading starts: 'bot' = from bottom (normal lists), 'top' = from top (inverted, e.g. chats). @required */
   startFrom: 'bot' | 'top';

   /** Ref to scroll component (React Native FlashList/FlatList). @default undefined */
   scrollRef?: any;

   /** Scroll event callback. Set by the library, do not pass manually. @internal */
   onScroll?: (event: any) => void;

   /** Scroll percentage to load more from top (0-100). null = disabled. @default null */
   topPercentage: number | null;

   /** Scroll percentage to load more from bottom (0-100). null = disabled. @default null */
   botPercentage: number | null;

   /** Request param key for relative_id (pagination relative to an element). @default null */
   relativeParamsKey: string | null;

   /** Strategy for choosing element for relative_id. @default 'default' */
   relativeIdSelectStrategy?: RelativeIdSelectStrategy;

   /** Load direction strategy (up/down). @default 'default' */
   upStrategy?: UpStrategy;

   /** Param key for load direction (up=true/down=false). @default null */
   upOrDownParamsKey: string | null;

   /** Key in server response indicating if more data is available. @default null */
   isHaveMoreResKey: string | null;

   /** How many scrolls up/down before trimming old data (memory optimization). @default 0 */
   howMuchGettedToTop: number;

   /** Function to update request params on scroll. @default null */
   setParams: null | ((newValue: any[] | ((prev: any[]) => any[])) => void) | any;
}

// ============= MAIN REQUEST OPTIONS =============

/**
 * Main options for WebSocket request via mobxSaiWs.
 * Base interface for MobxSaiWsOptions.
 */
export interface WsSendMessageOptions<T = unknown> {
   /**
    * Unique id for request caching. Recommended format: `{method}-{params}-{uniqueId}`.
    * If omitted, data will not be cached.
    */
   id?: string;

   /**
    * Path to the array in response data. Required for saiUpdater and optimistic updates.
    * @example 'messages' | 'data.items'
    */
   pathToArray?: string;

   /** @deprecated Unused */
   setData?: (data: T) => void;

   /** @experimental Not working in current version. State for page pagination (not virtual scroll). Use dataScope for virtual scroll. */
   page?: MobxStateWithGetterAndSetter<number, string> | null;

   /** @experimental Not working. Setter name for page. */
   pageSetterName?: string | null;

   /** Fetch type: 'default' | 'pagination'. @default 'default' @deprecated Use only 'default'. */
   fetchType?: "default" | "pagination";

   /**
    * Whether to set data in cache after response. If false, data is received but not stored in MobxSaiWsInstance.data.
    * @default true
    */
   isSetData?: boolean;

   /** Cache system options for large lists. @see MobxSaiFetchCacheSystemOptions */
   cacheSystem?: Partial<MobxSaiFetchCacheSystemOptions>;

   /** Infinite scroll options. @see MobxSaiWsDataScopeOptions */
   dataScope?: Partial<MobxSaiWsDataScopeOptions>;

   /** Options for adding data to array (start/end/reset). @see MobxSaiFetchFetchAddToOptions */
   fetchAddTo?: Partial<MobxSaiFetchFetchAddToOptions>;

   /**
    * Whether to request when data already exists in localCache.
    * true = request anyway; false = use cache, no request. @default true
    */
   fetchIfHaveData?: boolean;

   /**
    * Whether to request when there is already a pending request with same id.
    * true = create another request; false = skip, use existing pending. @default false
    */
   fetchIfPending?: boolean;

   /**
    * Whether to request when data exists in localStorage. true = request anyway (refresh); false = use localStorage, no request.
    * @default false. Requires storageCache true. @see takeCachePriority
    */
   fetchIfHaveLocalStorage?: boolean;

   /** Cache check priority: 'localCache' (memory first) | 'localStorage'. @default 'localCache' */
   takeCachePriority?: CachePriority;

   /**
    * Shadow request options with current route check. route: string = that route only; array = current route must be in array.
    * routeParams: undefined = check route name only; Record = params for current route; Record<route, params> = params per route.
    * Requires fetchIfHaveData and fetchIfHaveLocalStorage true for shadow requests.
    */
   shadowRequest?: {
      enabled: boolean;
      route?: string | string[];
      routeParams?: Record<string, any> | Record<string, Record<string, any>>;
   };

   /** Whether to save data to localStorage after response. Applied automatically. @default false. @see fetchIfHaveLocalStorage, maxLocalStorageCache */
   storageCache?: boolean;

   /** Whether to set 'pending' status before sending. Affects MobxSaiWsInstance.status and isPending. @default true */
   needPending?: boolean;

   /** @deprecated Unused */
   stateId?: string;

   /** Whether to check and clear stale pending statuses; also checks real pending via requestToIdMap. @default true */
   needStates?: boolean;

   /**
    * Bypass request queue
    * true = send immediately, bypass queue; false = add to queue (if queueStrategy.enabled).
    * @default true
    * @see queueStrategy.enabled must be true for queue to work
    */
   bypassQueue?: boolean;

   /** Max cached requests in memory. Old entries removed (FIFO). @default 100 */
   maxCacheData?: number;

   /** Max entries in localStorage. Old entries removed (FIFO). @default 100. Requires storageCache true. */
   maxLocalStorageCache?: number;

   /** WebSocket service name. @required for sending. @example 'message' | 'user' */
   service?: string;

   /** WebSocket method name. @required for sending. @example 'create_message' | 'get_messages' */
   method?: string;
}

// ============= OPTIMISTIC UPDATES =============

/**
 * Options for optimistic updates: UI updates immediately, then syncs with server.
 * Used for messages, likes, comments, etc.
 * @example optimisticUpdate: { enabled: true, createTempData: (body) => ({...}), extractRealData: (r) => r.message }
 */
export interface SaiFile {
   uri: string;
   type?: string;
   name?: string;
   filename?: string;
   size?: number;
   file?: any;
   _rawAsset?: any;
}

export interface FileUploadState {
   id: string;
   upload_id: string;
   progress: number;
   status: "pending" | "compressing" | "uploading" | "error" | "completed";
   error?: { message: string; };
   result?: any;
   file?: SaiFile;

   // Compression progress
   compressionProgress?: number;
   compressionStage?: 'loading' | 'compressing' | 'completed' | 'error';
   originalSize?: number;
   compressedSize?: number;

   // Upload progress
   uploadProgress?: number;
   uploadedBytes?: number;
   totalBytes?: number;
   uploadedChunks?: number;
   totalChunks?: number;

   // Overall progress
   overallProgress?: number;
   currentStage?: 'compressing' | 'uploading' | 'completing' | 'completed' | 'error';

   // Enriched fields for ImageGridUi compatibility
   url?: string;
   media_type?: string;
   width?: number;
   height?: number;
   duration?: number;
   thumbnail_url?: string;
   file_url?: string;
   isUploading?: boolean;
   isCompressing?: boolean;
}

export interface OptimisticUpdateOptions<T = any> {
   /** Enable optimistic updates. @default false. @required for optimistic updates. */
   enabled: boolean;

   /** Callback when temp data is successfully added to the array. @param tempData - added temp data */
   onAddedTempData?: (tempData: T) => void;

   /** Cache update options after creating element from request. @see UpdateCache. Requires targetCacheId. */
   updateCache?: UpdateCache;

   /** Creates temp data from request body. Called BEFORE sending request. Returns temp data for UI. */
   createTempData?: (body: any, context?: any) => T;

   /** Key to identify temp data (find and replace temp with real). @default 'id' */
   tempIdKey?: string;

   /** Flag for temp data. Added automatically. @default 'isTemp' */
   tempFlag?: string;

   /** Strategy for adding temp data: 'start' | 'end'. @default 'start' */
   addStrategy?: 'start' | 'end';

   /** Insert new temp data after the last temp element. Useful for inverted lists (chats).
    * @default false
    * false: [temp1, temp2, real1, real2] + temp3 -> [temp3, temp1, temp2, real1, real2]
    * - true:  [temp1, temp2, real1, real2] -> добавляем temp3 -> [temp1, temp2, temp3, real1, real2]
    */
   insertAfterLastTemp?: boolean;

   /**
    * Callback при успешной замене temp → real данных
    * Called after server response
    * 
    * @param tempData - временные данные которые были в UI
    * @param realData - реальные данные полученные от сервера
    * 
    * @example
    * onSuccess: (tempData, realData) => {
    *   console.log('Message sent:', realData.id);
    * }
    */
   onSuccess?: (tempData: T, realData: any) => void;

   /**
    * Callback при ошибке отправки запроса
    * Decides whether to keep temp data in UI (for retry) or remove
    * 
    * @param tempData - временные данные которые были в UI
    * @param error - ошибка от сервера
    * @returns true = оставить temp данные (для retry), false = удалить из UI
    * 
    * @example
    * onError: (tempData, error) => {
    *   // Оставить сообщение при Flood Protection (будет retry)
    *   return error.message.includes('Flood protection');
    * }
    */
   onError?: (tempData: T, error: any) => boolean;

   /**
    * Extracts real data from server response (replaces temp with real)
    * 
    * @param response - полный ответ от сервера
    * @param context - контекст с информацией о временных данных (temp_id и т.д.)
    * @returns данные для замены temp элемента
    * 
    * @default (response) => response
    * @example (response) => response.message
    * @example (response, context) => { ...response.message, id: context.temp_id, server_id: response.message.id }
    */
   extractRealData?: (response: any, context?: { temp_id?: string; tempData?: any; }) => any;

   /** Keys to ignore when replacing temp with real (e.g. keep local file URLs). @default [] */
   extractIgnoreKeys?: string[];

   /** Compares temp and real for custom replace logic. Default: compare by tempId. */
   matchTempWithReal?: (tempData: T, realData: any) => boolean;

   /** Target cache ID for optimistic data (e.g. createMessage updates getMessages). Requires id and pathToArray. */
   targetCacheId?: string | string[] | any[];

   /** File upload options (data, maxUploads, pathInTempData, extractUploadedFiles, filesParamKey, etc.). */
   files?: OptimisticFilesUploadOptions;

   /** Delete mode. @default false. true = delete and auto-restore on request error */
   deleteMode?: boolean;

   /** ID of element to delete */
   deleteId?: string | number;

   /** Multiple IDs to delete (e.g. message_ids from request body) */
   deleteIds?: (string | number)[];

   /** Update mode. @default false. true = optimistically update existing data */
   updateMode?: boolean;

   /** ID of element to update */
   updateId?: string | number;

   /** Creates updated data from request body. Called BEFORE sending. Returns updated data for UI. */
   updateTempData?: (body: any, currentData: any, context?: any) => T;

   /**
    * Patch existing array item in place: update only specific keys on the matched element.
    * Use for reactions, likes, etc. — no new item added, only nested fields updated.
    */
   patchInPlace?: boolean;

   /**
    * Key on array items to match (e.g. 'id' for messages).
    * @default 'id'
    */
   matchIdKey?: string;

   /**
    * Resolve match id from request body (e.g. body.message_id for reactions).
    */
   matchIdFromRequest?: (body: any) => string | number;

   /**
    * Optional custom matcher: (item, matchId) => true if item is the one to patch.
    * By default when matchIdKey === 'id' uses getServerId(item) === matchId (temp id → server_id).
    */
   matchItem?: (item: any, matchId: string | number) => boolean;

   /**
    * Keys to update on the matched item. Only these paths are patched and rolled back.
    * @example ['reactions', 'reacted_by', 'has_reactions']
    */
   patchPaths?: string[];

   /**
    * Build patch object for patchPaths. Called before send.
    * @param body - request body
    * @param currentItem - matched array item
    * @param context - optional context (e.g. profile)
    */
   createPatch?: (body: any, currentItem: any, context?: any) => Record<string, any>;

   /**
    * Build rollback snapshot for patchPaths. Called before apply.
    * @param body - request body
    * @param currentItem - matched array item
    */
   createRollbackSnapshot?: (body: any, currentItem: any) => Record<string, any>;

   /**
    * Optional. On success, merge this into patchPaths (e.g. strip _temp).
    * If null/undefined, no change. Receives (body, currentItem, response).
    */
   confirmPatch?: (body: any, currentItem: any, response: any) => Record<string, any> | null;

   /**
    * Optional context for createPatch (e.g. profile for reactions).
    */
   context?: any;
}

/**
 * Options for optimistic update of existing data (pre-data)
 */
export interface PreDataUpdateOptions {
   /**
    * Enable preData update
    */
   enabled: boolean;

   /**
    * ID целевого кэша для обновления (списка)
    */
   targetCacheId?: string | string[] | any[];

   /**
    * Cache update function. Called immediately. On repeated calls (same instance, different body) current body is passed as second arg.
    */
   updater?: (currentData: any, currentBody?: any) => any;

   /**
    * ID конкретного элемента в кэше для обновления (если updater не задан)
    */
   id?: string | string[] | number | null;

   /**
    * Cache object key to update
    */
   key?: string | null;

   /**
    * Key to identify element (if array). Default 'id'.
    */
   idKey?: string;

   /**
    * Cache update type
    * @default 'both'
    */
   updateCache?: UpdateCache;

   /**
    * Callback для обновления дополнительных состояний (например, selectedChat)
    * May return data passed to onRevert on error
    */
   onApply?: (body: any) => any | void;

   /**
    * Callback для отката дополнительных состояний при ошибке
    */
   onRevert?: (snapshot: any, error: any) => void;
}

export interface OptimisticFilesUploadOptions {
   /**
    * File upload data
    * 
    * @example
    * data: [file1, file2]
    */
   data: SaiFile | SaiFile[];

   /**
    * Max number of files to upload
    * 
    * @example
    * maxUploads: 10
    */
   maxUploads?: number;

   /**
    * Callback для отслеживания прогресса загрузки файлов
    * 
    * @example
    * onProgress: (progress: number, uploadId: string, fileStates: FileUploadState[]) => {}
    */
   onProgress?: (progress: number, uploadId: string, fileStates: FileUploadState[]) => void;

   /**
    * Callback для обработки успешной загрузки файла
    * 
    * @example
    * onFileSuccess: (result: any, uploadId: string) => {}
    */
   onFileSuccess?: (result: any, uploadId: string) => void;

   /**
    * Callback для обработки ошибки загрузки файла
    * 
    * @example
    * onFileError: (error: { message: string; }, uploadId: string) => {}
    */
   onFileError?: (error: { message: string; }, uploadId: string) => void;

   /**
    * Path in temp data for file upload state
    * 
    * @example
    * pathInTempData: 'fileUploadStates'
    */
   pathInTempData?: string;

   /**
    * Extracts uploaded files from upload state
    * 
    * @example
    * extractUploadedFiles: (fileStates: FileUploadState[], requestBody?: any) => {}
    */
   extractUploadedFiles?: (fileStates: FileUploadState[], requestBody?: any) => any;

   /**
    * Request param key for files
    * 
    * @example
    * filesParamKey: 'file_urls'
    */
   filesParamKey?: string;
}

// ============= QUEUE STRATEGY (стратегия очереди запросов) =============

/**
 * Request queue options. Sequential sending (e.g. messages) and auto retry on errors.
 * 
 * @example
 * queueStrategy: {
 *   enabled: true,
 *   sequential: true,
 *   delay: 100,
 *   retry: {
 *     maxAttempts: 3,
 *     backoff: 'exponential',
 *     retryOn: (error) => error.message.includes('Flood')
 *   }
 * }
 */
export interface QueueStrategyOptions {
   /**
    * Enable request queue. If true, requests are processed sequentially
    * 
    * @default false
    * @required для работы очереди
    * 
    * @example
    * enabled: true // запросы будут отправляться один за другим
    */
   enabled: boolean;

   /**
    * Sequential processing. If true, next request is sent only after previous response
    * 
    * @default true
    * @example true // строгая последовательность (для сообщений)
    */
   sequential?: boolean;

   /**
    * Delay between requests in ms. Applied after response before sending next
    * 
    * @default 100
    * @example 100 // 100мс задержка между запросами
    */
   delay?: number;

   /**
    * Auto retry on error. Works with optimisticUpdate.onError
    */
   retry?: {
      /**
       * Max send attempts. After exceed, request is considered failed
       * 
       * @required для работы retry
       * @example 3 // максимум 3 попытки
       */
      maxAttempts: number;

      /**
       * Backoff strategy (delay increase between attempts)
       * - 'linear': задержка увеличивается линейно (delay * attempt)
       * - 'exponential': задержка увеличивается экспоненциально (delay * 2^attempt)
       * 
       * @default 'linear'
       * @example 'exponential' // 1s, 2s, 4s, 8s...
       */
      backoff?: 'linear' | 'exponential';

      /**
       * Base delay for backoff in ms
       * 
       * @default 1000
       * @example 1000 // 1 секунда базовая задержка
       * 
       * Calculation examples:
       * - linear: 1000ms, 2000ms, 3000ms...
       * - exponential: 1000ms, 2000ms, 4000ms, 8000ms...
       */
      baseDelay?: number;

      /**
       * Whether to retry on this error. If not set, all errors are retried
       * 
       * @param error - ошибка от сервера
       * @returns true = повторить запрос, false = не повторять
       * 
       * @default undefined (повторять все ошибки)
       * @example
       * retryOn: (error) => {
       *   // Повторять только при Flood Protection
       *   return error.message.includes('Flood protection');
       * }
       * 
       * @see optimisticUpdate.onError - работает совместно для решения оставить ли temp данные
       */
      retryOn?: (error: any) => boolean;
   };
}

// ============= MAIN OPTIONS =============

// ============= ФИНАЛЬНЫЙ ИНТЕРФЕЙС =============

/**
 * Full options for mobxSaiWs request. Base options + specific settings.
 * 
 * @example Простой GET запрос
 * ```ts
 * mobxSaiWs(
 *   { chat_id: 'chat123' },
 *   {
 *     id: 'getMessages-chat123',
 *     service: 'message',
 *     method: 'get_messages',
 *     pathToArray: 'messages',
 *     storageCache: true
 *   }
 * )
 * ```
 * 
 * @example POST с optimistic updates
 * ```ts
 * mobxSaiWs(
 *   { content: 'Hello!' },
 *   {
 *     id: 'createMessage-chat123',
 *     service: 'message',
 *     method: 'create_message',
 *     pathToArray: 'messages',
 *     bypassQueue: false,
 *     optimisticUpdate: {
 *       enabled: true,
 *       createTempData: (body) => ({ ...body, id: 'temp_123', isTemp: true }),
 *       targetCacheId: 'getMessages-chat123'
 *     },
 *     queueStrategy: {
 *       enabled: true,
 *       sequential: true,
 *       delay: 100
 *     }
 *   }
 * )
 * ```
 */
export interface MobxSaiWsOptions<T = any> extends Omit<WsSendMessageOptions, 'id'> {
   /**
    * Unique ID or array of IDs for caching. Array = link multiple caches
    * 
    * @override Расширяет WsSendMessageOptions.id для поддержки массива
    * @example 'getMessages-chat123'
    * @example ['getMessages-chat123', 'chatList'] // обновить оба кэша
    */
   id?: string | string[];

   /**
    * WebSocket service name
    * @required для отправки запроса
    * @override Дублирует WsSendMessageOptions.service для явности
    */
   service?: string;

   /**
    * WebSocket method name
    * @required для отправки запроса
    * @override Дублирует WsSendMessageOptions.method для явности
    */
   method?: string;

   /**
    * Whether to check pending states
    * @override Дублирует WsSendMessageOptions.needStates для явности
    */
   needStates?: boolean;

   /**
    * Bypass queue
    * @override Дублирует WsSendMessageOptions.bypassQueue для явности
    */
   bypassQueue?: boolean;

   /**
    * In-memory cache limit
    * @override Дублирует WsSendMessageOptions.maxCacheData для явности
    * 
    * @default 100
    * @example 50 // для экономии памяти
    * 
    */
   maxCacheData?: number;

   /**
    * URL WebSocket сервера
    * If not set, uses global from GlobalWebSocketManager
    * 
    * @default берется из конфига GlobalWebSocketManager
    * @example 'wss://api.example.com/ws'
    */
   wsUrl?: string;

   /**
    * Reconnect timeout in ms
    * 
    * @default 3000
    * @example 5000 // 5 секунд
    */
   reconnectTimeout?: number;

   /**
    * Max reconnect attempts
    * 
    * @default 5
    * @example 10 // 10 попыток
    */
   maxReconnectAttempts?: number;

   /**
    * Connection timeout in ms
    * 
    * @default 5000
    * @example 10000 // 10 секунд
    */
   connectionTimeout?: number;

   /**
    * Send request without auth (no token)
    * 
    * @default false
    * @example true // для публичных endpoints
    */
   withoutAuth?: boolean;

   /**
    * Disable heartbeat/ping for this connection
    * 
    * @default false
    * @example true // для коротких соединений
    */
   withoutHeartbeat?: boolean;

   /**
    * Custom ping request instead of default
    * 
    * @default { type: 'ping' }
    * @example { service: 'system', method: 'ping' }
    */
   pingRequest?: any;

   /**
    * Path to extract data from server response
    * 
    * @example 'data.result' // берет { data: { result: [...] } } → [...]
    * @example 'message' // берет { message: {...} } → {...}
    * 
    * Differs from pathToArray:
    * - takePath: извлекает данные из ответа для data состояния
    * - pathToArray: указывает где массив для saiUpdater
    */
   takePath?: string;

   /**
    * @experimental НЕ РАБОТАЕТ в текущей версии
    * State for page pagination
    * @override Дублирует WsSendMessageOptions.page
    */
   page?: MobxStateWithGetterAndSetter<number, string> | null;

   /**
    * @experimental НЕ РАБОТАЕТ в текущей версии
    * Setter name for page
    * @override Дублирует WsSendMessageOptions.pageSetterName
    */
   pageSetterName?: string | null;


   /**
    * Data fetch type
    * @deprecated pagination не работает, используйте только 'default'
    * @override Дублирует WsSendMessageOptions.fetchType
    */
   fetchType?: "default" | "pagination";

   /**
    * Optimistic update options. Update UI immediately before server response
    * 
    * @see OptimisticUpdateOptions
    * @example { enabled: true, createTempData: (body) => tempMessage }
    */
   optimisticUpdate?: OptimisticUpdateOptions;

   /**
    * Request queue options. Sequential sending with retry logic
    * 
    * @see QueueStrategyOptions
    * @example { enabled: true, sequential: true, delay: 100 }
    */
   queueStrategy?: QueueStrategyOptions;

   /**
    * Delay before sending in ms. If another fetch with same id is called in this time, previous is cancelled.
    * 
    * @example 1000 // ждать 1 секунду
    */
   debounceMs?: number;

   /**
    * Initial message for comparison on first call. If new message matches initialMessage, first request is not sent.
    */
   initialMessage?: any;

   /**
    * If true, deep compare new body with previous before sending. If unchanged, request is not sent.
    */
   deepCompare?: boolean;

   /**
    * When global mockMode (switchToMockMode) is on: if true, all requests with id check mockCache first. Default false.
    */
   mockMode?: boolean;

   /**
    * Options for optimistic update of existing data. Update cache immediately, before real request.
    * 
    * @see PreDataUpdateOptions
    */
   preData?: PreDataUpdateOptions;

   /**
    * Callback при успешном ответе от сервера
    * Called AFTER data is updated in cache
    * 
    * @param data - Данные ответа от сервера
    * @param fetchParams - Параметры запроса (body)
    * 
    * @example
    * onSuccess: (data, fetchParams) => {
    *   console.log('Success!', data);
    *   showNotification('Message sent');
    * }
    */
   onSuccess?: (data: T, fetchParams?: any) => void;

   /**
    * Callback при ошибке от сервера
    * Called AFTER status is set to rejected
    * 
    * @param error - Ошибка от сервера
    * @param fetchParams - Параметры запроса (body)
    * 
    * @example
    * onError: (error, fetchParams) => {
    *   console.error('Error!', error);
    *   showNotification('Error: ' + error.message);
    * }
    */
   onError?: (error: any, fetchParams?: any) => void;

   /**
    * Callback при использовании кэша
    * Called AFTER data was taken from cache
    * 
    * @param data - Данные из кэша
    * @param fetchParams - Параметры запроса (body)
    * 
    * @example
    * onCacheUsed: (data, fetchParams) => {
    *   console.log('Cache used!', data);
    * }
    */
   onCacheUsed?: (data: T, fetchParams?: any, takeCachePriority?: CachePriority) => void;
}

export type ExtractArrayElement<T> = T extends (infer U)[] ? U : T;

export type EnsureIdentifiable<T> = ExtractArrayElement<T> extends { id: string | number; }
   ? ExtractArrayElement<T>
   : ExtractArrayElement<T> & { id: string | number; };

export type MobxSaiWsInstance<T> = Partial<{
   status: "pending" | "fulfilled" | "rejected";
   scopeStatus: "pending" | "fulfilled" | "rejected";
   data: T | null;
   error: Error | null;
   body: any;

   isPending: boolean;
   isFulfilled: boolean;
   isRejected: boolean;

   isScopePending: boolean;
   isScopeFulfilled: boolean;
   isScopeRejected: boolean;

   setIsPending: () => void;
   setIsFulfilled: () => void;
   setIsRejected: () => void;

   setScopePending: () => void;
   setScopeFulfilled: () => void;
   setScopeRejected: () => void;

   options: MobxSaiWsOptions;

   addedToEndCount: number;
   addedToStartCount: number;
   fetchedCount: number;

   scrollProgress: number;
   gettedToTop: MobxStateWithGetterAndSetter<'gettedToTop', number>;
   botStatus: "pending" | "fulfilled" | "rejected" | "";
   topStatus: "pending" | "fulfilled" | "rejected" | "";
   scrollCachedData: MobxStateWithGetterAndSetter<'scrollCachedData', any[]>;

   isBotPending: boolean;
   isBotRejected: boolean;
   isBotFulfilled: boolean;

   isTopPending: boolean;
   isTopRejected: boolean;
   isTopFulfilled: boolean;

   topError: Error | null;
   botError: Error | null;

   isHaveMoreBot: MobxStateWithGetterAndSetter<'isHaveMoreBot', boolean>;
   isHaveMoreTop: MobxStateWithGetterAndSetter<'isHaveMoreTop', boolean>;

   /**
    * Updates data in array or a specific array element
    * 
    * @param id - ID элемента в массиве для обновления. Если null - обновляется весь массив
    * @param key - Путь к полю для обновления или путь к массиву (если id === null)
    * @param updater - Функция обновления или новое значение
    * @param idKey - Ключ для поиска элемента по ID (по умолчанию 'id')
    * @param cacheId - ID кэша запроса для синхронизации (обязательный параметр)
    * @param updateCache - Тип обновления кэша: 'localStorage', 'localCache' или 'both'
    * @param options - Опции: fullData - если true, в updater передаётся весь this.data, updater должен вернуть новый объект (не массив)
    * 
    * @example
    * // Обновить весь массив
    * saiUpdater(
    * 	null,
    * 	"chats",
    * 	(prev) => prev.map(...),
    * 	"id",
    * 	["getChats", userId], // или строка
    * 	"both"
    * );
    * 
    * // Обновить конкретный элемент
    * saiUpdater(
    * 	chatId,
    * 	"participant.more.is_online",
    * 	true,
    * 	"id",
    * 	["getChats", userId],
    * 	"both"
    * );
    */
   saiUpdater: <K extends NestedKeyOf<EnsureIdentifiable<T>>>(
      id: string | string[] | number | null,
      key: K | null,
      updater: UpdaterT<EnsureIdentifiable<T>, K> | ((prev: any[]) => any[]),
      idKey?: string,
      cacheId?: string | string[] | number | null,
      updateCache?: UpdateCache,
      options?: { fullData?: boolean }
   ) => void;

   value: () => T | null;
   errorMessage: () => string | null;
   fetch: (
      message: any,
      fromWhere?: "fromScroll" | null,
      fetchWhat?: "top" | "bot" | null
   ) => MobxSaiWsInstance<T>;
   setScrollRef: (scrollRef: any) => MobxSaiWsInstance<T>;
   reset: () => MobxSaiWsInstance<T>;
}>;

export interface WebSocketMessage {
   id: number;
   type: string;
   service?: string;
   method?: string;
   data: any;
   timestamp: number;
   metadata?: {
      headers?: any;
      correlation_id?: string | null;
      auth_required?: boolean;
      user_id?: string;
      session_id?: string;
      auth_token?: string;
   };
}

export interface WebSocketResponse {
   type: string;
   request_id?: string;
   error?: string | any;
   status?: string;
   message?: string;
   result?: any;
   data?: any;
}

export interface WebSocketManagerOptions {
   wsUrl: string;
   reconnectTimeout?: number;
   maxReconnectAttempts?: number;
   connectionTimeout?: number;
   withoutAuth?: boolean;
   withoutHeartbeat?: boolean;
   pingRequest?: any;
}

export interface AuthRequest {
   type: 'auth';
   token: string;
   device_id?: string;
}

export interface CacheEntry<T = any> {
   timestamp: number;
   data: Partial<MobxSaiWsInstance<T>>;
   options: MobxSaiWsOptions;
}

// EVENT HISTORY

export interface WebSocketEventItem {
   id: string;
   timestamp: number;
   data: any;
   type?: string;
   error?: any;
   request_id?: string;
}

// CACHE UPDATE HISTORY

export interface RequestHistoryItem {
   id: string;
   timestamp: number;
   type: 'request' | 'response';
   data: any;
   service?: string;
   method?: string;
   error?: any;
   cached?: boolean;
   cacheKey?: string;
   requestId?: string; // WebSocket request ID для сопоставления
   encrypted?: boolean; // E2E encrypted (binary data)
   encryptedData?: Uint8Array; // Raw encrypted binary data
}

export interface RequestResponsePair {
   id: string;
   request: RequestHistoryItem;
   response?: RequestHistoryItem;
   serviceMethod: string;
   timestamp: number;
   cached: boolean;
   localCached?: boolean;
   mockCached?: boolean;
   forceFetch?: boolean;
   noPending?: boolean;
   repeatCount: number;
   lastRepeatTimestamp: number;
   takePath?: string;
}

export interface CacheUpdateHistoryItem {
   id: string;
   timestamp: number;
   updateType: 'saiUpdater' | 'saiLocalCacheUpdater' | 'saiLocalStorageUpdater' | 'saiCacheUpdater';
   cacheId: string;
   changes: {
      keysChanged?: string[];
      arrayAdded?: number;
      arrayRemoved?: number;
      totalCount?: number;
      details?: string;
   };
   success: boolean;
   error?: string;
}

// OTHER

export interface CacheEntry<T = any> {
   timestamp: number;
   data: Partial<MobxSaiWsInstance<T>>;
   options: MobxSaiWsOptions;
   fetchParams?: any;
   fromLocalStorage?: boolean;
}
