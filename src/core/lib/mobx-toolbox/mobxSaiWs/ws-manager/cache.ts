import { formatId } from '@lib/text';
import type { CacheEntry, MobxSaiWsInstance, MobxSaiWsOptions } from '../types';

export function removeDuplicates<T = any>(array: T[], idKey: string = 'id'): T[] {
	const seen = new Set();
	return array.filter((item: any) => {
		const id = item[idKey];
		if (seen.has(id)) return false;
		seen.add(id);
		return true;
	});
}

export function getPathValue(obj: any, path: string): any {
	return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
}

export function setPathValue(obj: any, path: string, value: any): void {
	const keys = path.split('.');
	let temp = obj;
	for (let i = 0; i < keys.length - 1; i++) {
		if (!temp[keys[i]]) temp[keys[i]] = {};
		temp = temp[keys[i]];
	}
	temp[keys[keys.length - 1]] = value;
}

export function setRequestToIdMap(m: any, requestId: string, id: string, options: MobxSaiWsOptions): void {
	m.requestToIdMap.set(requestId, id);
	if (m.requestToIdMap.size > (options.maxCacheData || m.maxCacheSize)) {
		pruneRequestToIdMap(m);
	}
}

export function pruneRequestToIdMap(m: { requestToIdMap: Map<string, string>; maxCacheSize: number; }): void {
	const keys = Array.from(m.requestToIdMap.keys());
	const keysToDelete = keys.slice(0, keys.length - m.maxCacheSize);
	keysToDelete.forEach((key) => m.requestToIdMap.delete(key));
}

export function updateCache(
	m: any,
	stateId: string | undefined,
	data: Partial<MobxSaiWsInstance<any>>,
	message: any,
	options: MobxSaiWsOptions
): void {
	if (!stateId || !options.id) return;

	const existingEntry = m.requestCache.get(formatId(options.id));
	const fromLocalStorage = existingEntry?.fromLocalStorage || false;

	console.log(`[updateCache] 💾 Caching data for ${formatId(options.id)}:`, {
		hasData: !!data.data,
		status: data.status,
		fromLocalStorage,
		preservedFromExisting: !!existingEntry?.fromLocalStorage,
		dataLength: Array.isArray(data.data) ? data.data.length : 'not array',
	});

	const cacheEntry: CacheEntry = {
		timestamp: Date.now(),
		data: { ...data },
		options,
		fromLocalStorage,
	};

	m.requestCache.set(formatId(options.id), cacheEntry);


	if (data.data != null) {
		const mockData = {
			data: typeof data.data === 'object' && data.data !== null ? JSON.parse(JSON.stringify(data.data)) : data.data,
			status: 'fulfilled' as const,
			isPending: false,
			isFulfilled: true,
			isRejected: false,
			error: null as Error | null,
		};
		const ts = Date.now();
		const mockEntry: CacheEntry = { timestamp: ts, data: mockData, options, fromLocalStorage: false };
		m.mockCache.set(formatId(options.id), mockEntry);
		m.saveToLocalStorageMock(formatId(options.id), { timestamp: ts, data: mockData }).catch((e: any) =>
			console.error('[updateCache] saveToLocalStorageMock:', e)
		);
		console.log(`[updateCache] 🎭 mockCache + ws_mock_: stored for ${formatId(options.id)}`);
	}

	const storageCache = options.storageCache !== undefined ? options.storageCache : false;
	console.log(`[updateCache] 🔍 Checking localStorage save:`, {
		storageCache,
		maxLocalStorageCache: options.maxLocalStorageCache,
		hasData: !!data.data,
		willSave: storageCache && data.data,
	});

	if (storageCache && data.data) {
		m.saveToLocalStorage(formatId(options.id), data.data);
	}

	if (options.maxCacheData && options.id) {
		pruneCacheByPrefix(m, formatId(options.id), options.maxCacheData);
	}

	if (m.requestCache.size > m.maxCacheSize) {
		pruneCache(m);
	}
}

export function pruneCacheByPrefix(m: { requestCache: Map<string, CacheEntry>; }, cacheId: string, maxCacheData: number): void {
	const prefix = cacheId.split('-')[0];
	if (!prefix) return;

	const prefixEntries: Array<[string, CacheEntry]> = [];
	for (const [key, value] of m.requestCache.entries()) {
		if (key.startsWith(prefix + '-') || key === prefix) prefixEntries.push([key, value]);
	}

	if (prefixEntries.length <= maxCacheData) return;

	prefixEntries.sort((a, b) => a[1].timestamp - b[1].timestamp);
	const entriesToRemove = prefixEntries.slice(0, prefixEntries.length - maxCacheData);
	entriesToRemove.forEach(([key]) => {
		m.requestCache.delete(key);
		console.log(`[pruneCacheByPrefix] 🗑️ Removed old cache entry: ${key}`);
	});
	if (entriesToRemove.length > 0) {
		console.log(`[pruneCacheByPrefix] Pruned ${entriesToRemove.length} entries for prefix "${prefix}" (limit: ${maxCacheData})`);
	}
}

export function pruneCache(m: { requestCache: Map<string, CacheEntry>; maxCacheSize: number; }): void {
	if (m.requestCache.size <= m.maxCacheSize) return;

	const entries = Array.from(m.requestCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
	const entriesToRemove = entries.slice(0, entries.length - m.maxCacheSize);
	entriesToRemove.forEach(([key]) => m.requestCache.delete(key));
	console.log(`Pruned ${entriesToRemove.length} entries from cache`);
}
