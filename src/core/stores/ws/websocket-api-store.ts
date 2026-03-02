import { createInstance } from '@api/api';
import { API_SOCKET_BASE_URL, API_SOCKET_BASE_URL_DEV } from '@env';
import { SECURITY_CONFIG } from '@core/config/security.config';
import { initializeWebSocketManager } from '@lib/mobx-toolbox/mobxSaiWs';
import { localStorage } from '@storage/index';
import { console } from '@utils/console';
import { makeAutoObservable, reaction } from "mobx";
import { TokensAndOtherData, authServiceStore } from 'src/modules/auth/stores';

const getWsUrl = (whichUrl: string): string => {
	if (whichUrl === 'dev' && typeof API_SOCKET_BASE_URL_DEV !== 'undefined' && API_SOCKET_BASE_URL_DEV !== '') {
		return API_SOCKET_BASE_URL_DEV;
	}
	if (typeof API_SOCKET_BASE_URL === 'undefined' || API_SOCKET_BASE_URL === '') {
		console.warn('API_SOCKET_BASE_URL is not set in .env');
		return '';
	}
	return API_SOCKET_BASE_URL;
};

export class WebsocketApiStore {
	constructor() {
		makeAutoObservable(this);
		reaction(
			() => this.whichUrl,
			() => {
				this.initWsApi();
				createInstance("rust");
			}
		);
	}

	get wsApi() {
		const { globalWebSocketManager } = require('@core/lib/mobx-toolbox/mobxSaiWs');

		if (!globalWebSocketManager) {
			return null;
		}

		return globalWebSocketManager;
	}

	private isInitialized = false;

	whichUrl: "dev" | "prod" | string = "dev";
	setWhichUrl = (which: "dev" | "prod") => {
		localStorage.set("whichUrl", which);
		this.whichUrl = which;
	};

	preloadWsUrl = async () => {
		const whichByDefault = __DEV__ ? "dev" : "prod";
		const whichUrlLc = await localStorage.get("whichUrl");

		if (whichUrlLc) this.whichUrl = String(whichUrlLc);
		this.whichUrl = whichByDefault;
	};

	initWsApi = async (tokensAndOtherData?: TokensAndOtherData) => {
		if (this.isInitialized && this.wsApi?.wsIsConnected) {
			console.log("⚠️ WebSocket already initialized and connected, skipping re-initialization");
			return;
		}

		const { getTokensAndOtherData } = authServiceStore;

		const tokens = tokensAndOtherData || getTokensAndOtherData();

		if (!tokens?.access_token) {
			console.warn("❌ Cannot initialize WebSocket: no access token found");
			return;
		}

		const wsApiUrl = getWsUrl(this.whichUrl);

		console.log(`🔐 WebSocket Security Config: E2E Encryption: ${SECURITY_CONFIG.E2E_ENCRYPTION_ENABLED ? '✅' : '❌'}`);
		console.log(`HMAC Signing: ${SECURITY_CONFIG.HMAC_SIGNING_ENABLED ? '✅' : '❌'}`);
		console.log(`Nonce Validation: ${SECURITY_CONFIG.NONCE_VALIDATION_ENABLED ? '✅' : '❌'}`);
		console.log(`Timestamp Validation: ${SECURITY_CONFIG.TIMESTAMP_VALIDATION_ENABLED ? '✅' : '❌'}`);
		console.log(`Token in Header: ${SECURITY_CONFIG.TOKEN_IN_HEADER ? '✅' : '❌'}`);
		console.log(`Auto Reconnect: ${SECURITY_CONFIG.AUTO_RECONNECT ? '✅' : '❌'}`);

		initializeWebSocketManager({
			wsUrl: wsApiUrl,
			wsName: "WsApiStore",
			withoutAuth: true,
			pingRequest: { service: "gateway", method: "ping" },
			maxReconnectAttempts: 1000,
			reconnectTimeout: 1000,
			accessToken: tokens.access_token
		});

		this.isInitialized = true;
		console.log("✅ WebSocket initialized successfully");
	};
}

export const websocketApiStore = new WebsocketApiStore();