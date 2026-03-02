import { SECURITY_CONFIG } from '@core/config/security.config';
import { logger } from '@lib/helpers';
import { clearE2EEncryption, nonceManager } from '@lib/security';
import { runInAction } from 'mobx';
import { getAuthActionsStore } from './getters';

export async function initializeWebSocket(m: any): Promise<void> {
	runInAction(() => {
		m.wsIsConnecting = true;
		m.wsIsConnected = false;
		m.wsIsError = false;
	});

	if (m.websocket) {
		if (m.websocket.readyState === WebSocket.OPEN || m.websocket.readyState === WebSocket.CONNECTING) {
			console.warn('WebSocket already connected or connecting');
			return;
		}
		m.websocket.close();
		m.websocket = null;
	}

	try {
		connectWebSocket(m, m.wsUrl);
	} catch (error) {
		console.error('Failed during initialization:', error);
		runInAction(() => {
			m.wsIsConnected = false;
			m.wsIsConnecting = false;
			m.wsIsError = true;
		});
		attemptReconnect(m);
	}
}

export function connectWebSocket(m: any, url: string): void {
	try {
		runInAction(() => {
			const wsUrl = SECURITY_CONFIG.TOKEN_IN_HEADER && m.accessToken ? url : url;
			const protocols = SECURITY_CONFIG.TOKEN_IN_HEADER && m.accessToken ? [`Bearer.${m.accessToken}`] : undefined;
			m.websocket = protocols ? new WebSocket(wsUrl, protocols) : new WebSocket(wsUrl);
			m.websocket.onopen = m.onSocketOpen;
			m.websocket.onmessage = m.onSocketMessage;
			m.websocket.onerror = m.onSocketError;
			m.websocket.onclose = m.onSocketClose;
		});
	} catch (error) {
		console.error('Failed to create WebSocket connection:', error);
		runInAction(() => {
			m.wsIsConnected = false;
			m.wsIsConnecting = false;
			m.wsIsError = true;
		});
		attemptReconnect(m);
	}
}

export async function onSocketOpen(m: any): Promise<void> {
	logger.info(`[${m.wsName}]`, 'MOBX-SAI-WS: WebSocket connection established');
	runInAction(() => {
		m.wsIsConnecting = false;
		m.wsIsConnected = true;
		m.wsIsError = false;
	});
	console.log('[onSocketOpen] ✅ WebSocket connected, wsIsConnected set to true');

	m.reconnectAttempts = 0;
	m.e2eEnabled = SECURITY_CONFIG.E2E_ENCRYPTION_ENABLED;

	if (SECURITY_CONFIG.E2E_ENCRYPTION_ENABLED) {
		console.log('[onSocketOpen] 🔐 Waiting for E2E key exchange to complete before processing queue...');
		await m.performKeyExchange();
		console.log('[onSocketOpen] ✅ E2E key exchange completed, ready to process queue');
	} else {
		console.log('ℹ️ E2E encryption is disabled');
	}

	if (!m.withoutHeartbeat) {
		startHeartbeat(m);
	}

	if (m.pendingMessagesQueue.length > 0) {
		console.log(`[onSocketOpen] 📬 Found ${m.pendingMessagesQueue.length} queued messages to process`);
		await new Promise((r) => setTimeout(r, 100));
	}
	processPendingMessages(m);
}

export function onSocketClose(m: any, event: CloseEvent): void {
	console.log(`WebSocket closed with code ${event.code}, reason: ${event.reason}`);

	runInAction(() => {
		m.wsIsConnected = false;
		m.wsIsConnecting = false;
		m.wsIsError = !event.wasClean;
	});

	if (!event.wasClean) {
		attemptReconnect(m);
	}
}

export function onSocketError(m: any, error: Event): void {
	console.error('[onSocketError] WebSocket error:', error);

	if ((error as any).message?.includes('401')) {
		try {
			const authActionsStore = getAuthActionsStore();
			m.isReconnectStop = true;
			authActionsStore.refreshTokenAction();
			clearE2EEncryption();
		} catch (e) {
			console.error('[onSocketError] Failed to refresh token:', e);
		}
		return;
	}

	runInAction(() => {
		m.wsIsConnected = false;
		m.wsIsConnecting = false;
		m.wsIsError = true;
	});

	attemptReconnect(m);
}

export function attemptReconnect(m: any): void {
	if (m.isReconnectStop) {
		console.log('Reconnect is stopped');
		m.isReconnectStop = false;
		return;
	}
	if (m.isReconnecting) return;

	m.isReconnecting = true;

	if (!SECURITY_CONFIG.AUTO_RECONNECT) {
		console.log('Auto-reconnect is disabled');
		runInAction(() => {
			m.wsIsConnected = false;
			m.wsIsConnecting = false;
			m.wsIsError = true;
		});
		return;
	}

	if (m.reconnectAttempts >= m.maxReconnectAttempts) {
		console.error('Maximum reconnect attempts reached');
		runInAction(() => {
			m.wsIsConnected = false;
			m.wsIsConnecting = false;
			m.wsIsError = true;
		});
		clearE2EEncryption();
		return;
	}

	m.reconnectAttempts++;
	console.log(`Attempting to reconnect (${m.reconnectAttempts}/${m.maxReconnectAttempts})`);

	runInAction(() => {
		m.wsIsConnecting = true;
		m.wsIsConnected = false;
		m.wsIsError = false;
	});

	setTimeout(() => {
		initializeWebSocket(m);
	}, m.reconnectTimeout);
}

export function startHeartbeat(m: any): void {
	if (m.heartbeatInterval) clearInterval(m.heartbeatInterval);
	m.heartbeatInterval = setInterval(() => {
		const timestampMs = Date.now();
		const timestamp = Math.floor(timestampMs / 1000);
		const nonce = SECURITY_CONFIG.NONCE_VALIDATION_ENABLED ? nonceManager.generateNonce() : undefined;

		const pingMessage: any = {
			id: timestampMs,
			type: 'service_call',
			service: 'gateway',
			method: 'ping',
			data: {},
			timestamp,
			metadata: { auth_required: false, headers: {}, correlation_id: null },
		};
		if (nonce) pingMessage.nonce = nonce;

		m.sendDirectMessage(pingMessage, {}, { bypassQueue: true, needStates: false });
	}, SECURITY_CONFIG.HEARTBEAT_INTERVAL);
}

export async function processPendingMessages(m: any): Promise<void> {
	if (m.pendingMessagesQueue.length === 0) return;

	console.log(`[processPendingMessages] 📤 Processing ${m.pendingMessagesQueue.length} queued messages`);
	const queueCopy = [...m.pendingMessagesQueue];
	m.pendingMessagesQueue = [];

	for (const queuedItem of queueCopy) {
		const { message, data, options, messageProps, fromWhere, fetchWhat, resolve } = queuedItem;

		if (message) {
			console.log(`[processPendingMessages] 🔄 Retrying message: ${message.service}.${message.method}`);
			const result = await m.sendDirectMessage(message, data, options);
			if (resolve) resolve(result);
		} else if (messageProps && options) {
			console.log(`[processPendingMessages] 🔄 Retrying queued request: ${options.service}.${options.method}`);
			try {
				const result = await m.sendMessage(messageProps, data, options, fromWhere || null, fetchWhat || null, true);
				if (resolve) resolve(result);
			} catch (error) {
				console.error('[processPendingMessages] ❌ Failed to retry request:', error);
				if (resolve) resolve(undefined);
			}
		}
	}
}

export function reconnect(m: any): void {
	console.log('🔄 Manual reconnect triggered');
	if (m.websocket) {
		m.websocket.close();
		m.websocket = null;
	}
	if (m.heartbeatInterval) {
		clearInterval(m.heartbeatInterval);
		m.heartbeatInterval = null;
	}
	m.reconnectAttempts = 0;
	initializeWebSocket(m);
}

export function disconnect(m: any): void {
	console.log('🔌 Manual disconnect triggered');
	if (m.heartbeatInterval) {
		clearInterval(m.heartbeatInterval);
		m.heartbeatInterval = null;
	}
	if (m.websocket) {
		m.websocket.close(1000, 'Manual disconnect');
		m.websocket = null;
	}
	runInAction(() => {
		m.wsIsConnected = false;
		m.wsIsConnecting = false;
		m.wsIsError = false;
		m.isReconnecting = false;
	});
}
