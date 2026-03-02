import { formatId } from '@lib/text';

export function setupAppStateTracking(m: any): void {
	if (typeof require !== 'undefined') {
		try {
			const { AppState } = require('react-native');
			let previousAppState = AppState.currentState;

			const subscription = AppState.addEventListener('change', (nextAppState: string) => {
				if (nextAppState === 'background' || nextAppState === 'inactive') {
					console.log(`[GlobalWebSocketManager] App went to background/inactive, will reset first request flag on return`);
				}
				if (nextAppState === 'active' && (previousAppState === 'background' || previousAppState === 'inactive')) {
					console.log(`[GlobalWebSocketManager] App returned to active, resetting first request flag for shadow request`);
					m.isFirstRequestInSession = true;
					if (!m.shadowRequestSent) m.shadowRequestSent = new Set();
					const clearedCount = m.shadowRequestSent.size;
					m.shadowRequestSent.clear();
					console.log(`[GlobalWebSocketManager] Cleared shadowRequestSent set (cleared ${clearedCount} entries), isFirstRequestInSession: ${m.isFirstRequestInSession}`);
					resendShadowRequests(m);
				}
				previousAppState = nextAppState;
			});
			m.appStateListeners.push(subscription);
		} catch (e) {
			console.error(`[GlobalWebSocketManager] Error setting up app state tracking:`, e);
		}
	}

	if (typeof document !== 'undefined') {
		let wasHidden = document.visibilityState === 'hidden';

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible' && wasHidden) {
				console.log(`[GlobalWebSocketManager] Page became visible (was hidden), resetting first request flag for shadow request`);
				m.isFirstRequestInSession = true;
				if (!m.shadowRequestSent) m.shadowRequestSent = new Set();
				const clearedCount = m.shadowRequestSent.size;
				m.shadowRequestSent.clear();
				console.log(`[GlobalWebSocketManager] Cleared shadowRequestSent set (cleared ${clearedCount} entries), isFirstRequestInSession: ${m.isFirstRequestInSession}`);
				resendShadowRequests(m);
			}
			wasHidden = document.visibilityState === 'hidden';
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);
		m.visibilityChangeListener = () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}

	if (typeof window !== 'undefined') {
		window.addEventListener('beforeunload', () => {
			console.log(`[GlobalWebSocketManager] Page unloading, will reset first request flag on next load`);
		});
	}
}

export function resendShadowRequests(m: any): void {
	const registrySize = m.shadowRequestRegistry.size;
	if (registrySize === 0) {
		console.log(`[resendShadowRequests] No shadow requests registered, skipping`);
		return;
	}

	console.log(`[resendShadowRequests] 🔄 Resending ${registrySize} shadow requests after app return`);

	setTimeout(() => {
		let sentCount = 0;
		let skippedCount = 0;
		for (const [cacheId, requestInfo] of m.shadowRequestRegistry.entries()) {
			try {
				const shadowRequest = requestInfo.options?.shadowRequest;
				if (shadowRequest && !checkShadowRequestRoute(m, shadowRequest)) {
					console.log(`[resendShadowRequests] ⏭️ Skipping shadow request for ${cacheId} (route mismatch)`);
					skippedCount++;
					continue;
				}
				console.log(`[resendShadowRequests] 📤 Resending shadow request for: ${cacheId}`);
				m.sendMessage(requestInfo.messageProps, requestInfo.data, requestInfo.options, null, null);
				sentCount++;
			} catch (error) {
				console.error(`[resendShadowRequests] ❌ Error resending shadow request for ${cacheId}:`, error);
			}
		}
		console.log(`[resendShadowRequests] ✅ Successfully resent ${sentCount}/${registrySize} shadow requests (skipped: ${skippedCount})`);
	}, 500);
}

export function resetFirstRequestFlag(m: any): void {
	m.isFirstRequestInSession = true;
	console.log(`[GlobalWebSocketManager] First request flag manually reset`);
}

export function unregisterShadowRequest(m: any, cacheId: string | string[] | number): void {
	const formattedId = formatId(cacheId);
	const deleted = m.shadowRequestRegistry.delete(formattedId);
	if (deleted) {
		console.log(`[unregisterShadowRequest] ✅ Unregistered shadow request for ${formattedId} (remaining: ${m.shadowRequestRegistry.size})`);
	} else {
		console.log(`[unregisterShadowRequest] ⚠️ Shadow request ${formattedId} was not registered`);
	}
}

export function getRegisteredShadowRequests(m: any): string[] {
	return Array.from(m.shadowRequestRegistry.keys());
}

export function checkShadowRequestRoute(m: any, shadowRequest?: { enabled: boolean; route?: string | string[]; routeParams?: Record<string, any> | Record<string, Record<string, any>>; }): boolean {
	if (!shadowRequest || !shadowRequest.enabled) return false;
	if (!shadowRequest.route) return true;

	try {
		const { getCurrentRoute } = require('@lib/navigation');
		const currentRoute = getCurrentRoute();
		if (!currentRoute) {
			console.log(`[checkShadowRequestRoute] No current route found, shadow request not allowed`);
			return false;
		}

		const currentRouteName = currentRoute.name;
		const routes = Array.isArray(shadowRequest.route) ? shadowRequest.route : [shadowRequest.route];
		
		// Check if current route is in the allowed routes
		if (!routes.includes(currentRouteName)) {
			console.log(`[checkShadowRequestRoute] Route mismatch: current="${currentRouteName}", required one of: [${routes.join(', ')}]`);
			return false;
		}

		// Check route params if provided
		if (shadowRequest.routeParams && Object.keys(shadowRequest.routeParams).length > 0) {
			const currentParams = currentRoute.params || {};
			const paramKeys = Object.keys(shadowRequest.routeParams);
			
			// Check if routeParams is a nested object (key is route name, value is params for that route)
			// If ALL keys in routeParams are route names from the routes array, it's nested structure
			const isNestedParams = paramKeys.length > 0 && 
				paramKeys.every(key => routes.includes(key)) &&
				paramKeys.every(key => {
					const value = shadowRequest.routeParams![key];
					return typeof value === 'object' && value !== null && !Array.isArray(value);
				});

			if (isNestedParams) {
				// Nested structure: routeParams[routeName] = { param1: value1, param2: value2 }
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
				// Flat structure: routeParams = { param1: value1, param2: value2 } (for single route or all routes)
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
