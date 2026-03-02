import { makeAutoObservable } from 'mobx';
import { RequestHistoryItem, RequestResponsePair } from './types';

export class DebugHistory {
	public history: RequestHistoryItem[] = [];
	public pairs: RequestResponsePair[] = [];
	private pendingRequests = new Map<string, RequestHistoryItem>();

	constructor() {
		makeAutoObservable(this);
	}

	addRequest(
		data: any,
		service?: string,
		method?: string,
		cached = false,
		cacheKey?: string,
		requestId?: string,
		encrypted = false,
		encryptedData?: Uint8Array,
		forceFetch?: boolean,
		noPending?: boolean,
		takePath?: string
	) {
		if (method === "ping") return;
		if (method === "message_typing") return;
		const serviceMethod = service && method ? `${service}-${method}` : 'unknown';

		const lastPair = this.pairs[0];
		const dataString = JSON.stringify(data);

		if (lastPair &&
			lastPair.serviceMethod === serviceMethod &&
			lastPair.cached === cached &&
			JSON.stringify(lastPair.request.data) === dataString
		) {
			if (lastPair.response) {
				lastPair.repeatCount++;
				lastPair.lastRepeatTimestamp = Date.now();
				console.log(`[DebugHistory] Stacked repeat request for ${serviceMethod}, count: ${lastPair.repeatCount}`);
			} else {
				console.log(`[DebugHistory] Request ${serviceMethod} already pending, skipping duplicate`);
			}

			if (requestId) {
				this.pendingRequests.set(requestId, lastPair.request);
			}
			return;
		}

		const request: RequestHistoryItem = {
			id: `req_${Date.now()}_${Math.random()}`,
			timestamp: Date.now(),
			type: 'request',
			data,
			service,
			method,
			cached,
			cacheKey,
			requestId,
			encrypted,
			encryptedData,
		};

		this.history.unshift(request);

		const pair: RequestResponsePair = {
			id: `pair_${Date.now()}_${Math.random()}`,
			request,
			serviceMethod,
			timestamp: Date.now(),
			cached,
			forceFetch,
			noPending,
			takePath,
			repeatCount: 1,
			lastRepeatTimestamp: Date.now(),
		};

		this.pairs.unshift(pair);

		const looksLikeResponse = data && (data.status === 'Success' || data.status === 'Error' || data.request_id);
		if (looksLikeResponse) {
			console.warn(`[DebugHistory] ⚠️ WARNING: addRequest called with response-like data!`, {
				service: serviceMethod,
				hasStatus: !!data.status,
				hasRequestId: !!data.request_id,
				requestId
			});
		}

		if (requestId) {
			this.pendingRequests.set(requestId, request);
			console.log(`[DebugHistory] Created request with WebSocket ID: ${requestId}, service: ${serviceMethod}`);
		} else {
			this.pendingRequests.set(request.id, request);
			console.log(`[DebugHistory] Created request with local ID: ${request.id}, service: ${serviceMethod}`);
		}

		this.limitSize();
	}

	addResponse(data: any, error?: any, cached = false, requestId?: string, encrypted = false, encryptedData?: Uint8Array) {
		const response: RequestHistoryItem = {
			id: `res_${Date.now()}_${Math.random()}`,
			timestamp: Date.now(),
			type: 'response',
			data,
			error,
			cached,
			requestId,
			encrypted,
			encryptedData,
		};

		this.history.unshift(response);

		let pairIndex = -1;
		if (requestId) {
			pairIndex = this.pairs.findIndex(pair =>
				pair.request.requestId === requestId && !pair.response
			);

			if (pairIndex === -1) {
				pairIndex = this.pairs.findIndex(pair =>
					pair.request.requestId === requestId
				);
			}

			console.log(`[DebugHistory] Looking for request with ID ${requestId}, found index: ${pairIndex}, pairs count: ${this.pairs.length}`);
		}

		if (pairIndex === -1) {
			let serviceMethod = 'unknown';
			let service: string | undefined;
			let method: string | undefined;

			if (data?.type) {
				const typeParts = data.type.split('-');
				if (typeParts.length >= 2) {
					service = typeParts[0];
					method = typeParts.slice(1).join('-');
					serviceMethod = data.type;
				} else {
					serviceMethod = data.type;
				}
			}

			pairIndex = this.pairs.findIndex(pair =>
				pair.serviceMethod === serviceMethod && !pair.response
			);

			if (pairIndex === -1 && service && method) {
				pairIndex = this.pairs.findIndex(pair =>
					pair.request.service === service &&
					pair.request.method === method &&
					!pair.response
				);
			}
		}

		if (pairIndex !== -1) {
			const foundPair = this.pairs[pairIndex];

			if (foundPair.response) {
				const existingResponseData = JSON.stringify(foundPair.response.data);
				const newResponseData = JSON.stringify(response.data);

				if (existingResponseData !== newResponseData) {
					foundPair.response = response;
					foundPair.lastRepeatTimestamp = Date.now();
					console.log(`[DebugHistory] ✅ Updated response for ${foundPair.serviceMethod}`);
				} else {
					console.log(`[DebugHistory] ⚠️ Ignoring duplicate response for ${foundPair.serviceMethod}`);
				}
			} else {
				foundPair.response = response;
				foundPair.cached = foundPair.cached || cached;
				console.log(`[DebugHistory] ✅ Attached response to ${foundPair.serviceMethod}`);
			}

			if (requestId) {
				this.pendingRequests.delete(requestId);
			} else {
				this.pendingRequests.delete(foundPair.request.id);
			}
		} else {
			console.log(`[DebugHistory] ⚠️ No matching request found for response with ID ${requestId} - skipping orphan creation to avoid data corruption`);

		}

		this.limitSize();
	}

	addCachedRequest(
		data: any,
		service?: string,
		method?: string,
		cacheKey?: string,
		cachedResponse?: any,
		localCached?: boolean,
		forceFetch?: boolean,
		noPending?: boolean,
		takePath?: string,
		fromMock?: boolean
	) {
		const serviceMethod = service && method ? `${service}-${method}` : 'unknown';

		const lastPair = this.pairs[0];
		const dataString = JSON.stringify(data);
		const responseString = JSON.stringify(cachedResponse);

		if (lastPair &&
			lastPair.serviceMethod === serviceMethod &&
			lastPair.cached === true &&
			(lastPair.localCached || false) === (localCached || false) &&
			(lastPair.mockCached || false) === (fromMock || false) &&
			JSON.stringify(lastPair.request.data) === dataString &&
			lastPair.response &&
			JSON.stringify(lastPair.response.data) === responseString
		) {
			lastPair.repeatCount++;
			lastPair.lastRepeatTimestamp = Date.now();
			const cacheType = fromMock ? 'MOCK' : (localCached ? 'LOCAL-CACHED' : 'CACHED');
			console.log(`[DebugHistory] Stacked repeat ${cacheType} request for ${serviceMethod}, count: ${lastPair.repeatCount}`);
			return;
		}

		const fakeRequestId = `cached_${Date.now()}_${Math.random()}`;
		const request: RequestHistoryItem = {
			id: `req_cached_${Date.now()}_${Math.random()}`,
			timestamp: Date.now(),
			type: 'request',
			data,
			service,
			method,
			cached: true,
			cacheKey,
			requestId: fakeRequestId,
		};

		const response: RequestHistoryItem = {
			id: `res_cached_${Date.now()}_${Math.random()}`,
			timestamp: Date.now(),
			type: 'response',
			data: cachedResponse,
			cached: true,
			requestId: fakeRequestId,
		};

		this.history.unshift(response);
		this.history.unshift(request);

		const pair: RequestResponsePair = {
			id: `pair_cached_${Date.now()}_${Math.random()}`,
			request,
			response: cachedResponse ? response : undefined,
			serviceMethod,
			timestamp: Date.now(),
			cached: true,
			localCached,
			mockCached: fromMock,
			forceFetch,
			noPending,
			takePath,
			repeatCount: 1,
			lastRepeatTimestamp: Date.now(),
		};

		this.pairs.unshift(pair);
		console.log(`[DebugHistory] Created cached request pair for ${serviceMethod}${fromMock ? ' (MOCK)' : ''}`);

		this.limitSize();
	}

	private limitSize() {
		if (this.history.length > 100) {
			this.history = this.history.slice(0, 100);
		}
		if (this.pairs.length > 50) {
			this.pairs = this.pairs.slice(0, 50);
		}
	}

	clear() {
		this.history = [];
		this.pairs = [];
		this.pendingRequests.clear();
	}
}