import { localStorage } from '@storage/index';
import { runInAction } from 'mobx';
import { generateSimpleUUID } from '@lib/string';

export async function loadLocalStorageCache(m: any): Promise<void> {
	try {
		const keys = await localStorage.getAllKeys();
		const wsKeys = keys.filter((k: string) => k.startsWith('ws_cache_'));
		for (const key of wsKeys) {
			const cacheId = key.replace('ws_cache_', '');
			const cachedData = await localStorage.get(key) as { timestamp: number; data: any } | null;
			if (cachedData && cachedData.timestamp && cachedData.data) {
				m.localStorageCache.set(cacheId, cachedData);
			}
		}
		console.log(`[LocalStorageCache] Loaded ${wsKeys.length} cached entries from localStorage`);
	} catch (error) {
		console.error('[LocalStorageCache] Failed to load cache:', error);
	}
}

export async function loadMockCacheFromStorage(m: any): Promise<void> {
	try {
		const keys = await localStorage.getAllKeys();
		const mockKeys = keys.filter((k: string) => k.startsWith('ws_mock_'));
		for (const key of mockKeys) {
			const cacheId = key.replace('ws_mock_', '');
			const value = await localStorage.get(key) as { timestamp: number; data: any } | null;
			if (value?.data != null) {
				m.mockCache.set(cacheId, {
					timestamp: value.timestamp || Date.now(),
					data: value.data,
					options: {},
					fromLocalStorage: true,
				});
			}
		}
		console.log(`[loadMockCacheFromStorage] Loaded ${mockKeys.length} mock entries from ws_mock_*`);
	} catch (error) {
		console.error('[loadMockCacheFromStorage] Failed to load mocks:', error);
	}
}

export async function initMockFromStorage(m: any): Promise<void> {
	try {
		await loadMockCacheFromStorage(m);
		const saved = await localStorage.get('ws_mock_mode');
		if (saved === 'true' || saved === true) {
			runInAction(() => {
				m.mockMode = true;
				m.mockModeRestoredAtStartup = true;
			});
			console.log('[GlobalWebSocketManager] mockMode restored from localStorage: true');
		}
		if (m.mockMode) {
			const [rawTokens, rawSessionId, rawProfile] = await Promise.all([
				localStorage.get('ws_mock_tokens'),
				localStorage.get('ws_mock_sessionId'),
				localStorage.get('ws_mock_profile'),
			]);
			const unwrap = (v: any) => (v != null && typeof v === 'object' && 'data' in v && (v as { data?: any }).data != null) ? (v as { data: any }).data : v;
			const mt = unwrap(rawTokens) as { accessToken?: string; refreshToken?: string } | null | undefined;
			const ms = unwrap(rawSessionId) as string | null | undefined;
			const mp = unwrap(rawProfile);
			if (mt?.accessToken && ms != null && ms !== '') {
				await localStorage.set('tokens', { accessToken: mt.accessToken, refreshToken: mt.refreshToken ?? '' });
				await localStorage.set('sessionId', ms);
				if (mp) await localStorage.set('profile', mp);
				console.log('[GlobalWebSocketManager] Filled tokens/sessionId/profile from ws_mock_* for mockMode');
			}
		}
	} catch (error) {
		console.error('[GlobalWebSocketManager] initMockFromStorage failed:', error);
	}
}

export async function saveToLocalStorageMock(cacheId: string, dataObj: { timestamp: number; data: any }): Promise<void> {
	try {
		await localStorage.set(`ws_mock_${cacheId}`, dataObj);
		console.log(`[saveToLocalStorageMock] ✅ Saved ws_mock_${cacheId}`);
	} catch (error) {
		console.error(`[saveToLocalStorageMock] Failed ws_mock_${cacheId}:`, error);
	}
}

export async function getFromLocalStorageMock(cacheId: string): Promise<{ timestamp: number; data: any } | null> {
	try {
		const raw = await localStorage.get(`ws_mock_${cacheId}`) as { timestamp: number; data: any } | null;
		if (raw?.data != null) return raw;
	} catch (e) {
		console.error(`[getFromLocalStorageMock] ${cacheId}:`, e);
	}
	return null;
}

export async function saveToLocalStorage(m: any, cacheId: string, data: any): Promise<void> {
	try {
		const cacheEntry = { timestamp: Date.now(), data };
		console.log(`[saveToLocalStorage] 💾 Saving to localStorage: ws_cache_${cacheId}`, {
			hasData: !!data,
			dataType: typeof data,
			dataKeys: typeof data === 'object' ? Object.keys(data) : null,
		});
		await localStorage.set(`ws_cache_${cacheId}`, cacheEntry);
		m.localStorageCache.set(cacheId, cacheEntry);
		console.log(`[saveToLocalStorage] ✅ Successfully saved to localStorage: ws_cache_${cacheId}`);
		if (m.localStorageCache.size > m.maxLocalStorageCacheSize) {
			await pruneLocalStorageCache(m);
		}
	} catch (error) {
		console.error(`[LocalStorageCache] ❌ Failed to save cache for ${cacheId}:`, error);
	}
}

export async function pruneLocalStorageCache(m: any): Promise<void> {
	try {
		const entries = Array.from(m.localStorageCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
		const entriesToRemove = entries.slice(0, entries.length - m.maxLocalStorageCacheSize);
		for (const [cacheId] of entriesToRemove) {
			await localStorage.remove(`ws_cache_${cacheId}`);
			m.localStorageCache.delete(cacheId);
		}
		console.log(`[LocalStorageCache] Pruned ${entriesToRemove.length} old entries`);
	} catch (error) {
		console.error('[LocalStorageCache] Failed to prune cache:', error);
	}
}

export async function getFromLocalStorage(m: any, cacheId: string): Promise<any | null> {
	console.log(`[getFromLocalStorage] 🔍 Checking for: ws_cache_${cacheId}`);
	const cached = m.localStorageCache.get(cacheId);
	if (cached) {
		console.log(`[getFromLocalStorage] ✅ Found in memory cache`);
		return cached.data;
	}
	try {
		const data = await localStorage.get(`ws_cache_${cacheId}`) as { timestamp: number; data: any } | null;
		console.log(`[getFromLocalStorage] 📦 localStorage result:`, { found: !!data, hasTimestamp: !!data?.timestamp, hasData: !!data?.data });
		if (data && data.timestamp && data.data) {
			m.localStorageCache.set(cacheId, data);
			console.log(`[getFromLocalStorage] ✅ Loaded from localStorage and cached in memory`);
			return data.data;
		}
	} catch (error) {
		console.error(`[LocalStorageCache] ❌ Failed to get cache for ${cacheId}:`, error);
	}
	console.log(`[getFromLocalStorage] ⚠️ Not found in localStorage`);
	return null;
}

export async function getOrCreateDeviceId(): Promise<string> {
	try {
		let deviceId = (await localStorage.get('device_id')) as string | null;
		if (!deviceId) {
			deviceId = generateSimpleUUID();
			await localStorage.set('device_id', deviceId);
		}
		return deviceId;
	} catch (error) {
		console.error('Error getting/creating device ID:', error);
		return `temp-${generateSimpleUUID()}`;
	}
}
