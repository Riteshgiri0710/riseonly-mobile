import { SECURITY_CONFIG } from '@core/config/security.config';
import { getE2EEncryption } from '@lib/security';
import { getAuthServiceStore } from './getters';

export function getAuthSessionId(m: unknown): string | null {
	try {
		const authServiceStore = getAuthServiceStore();
		return (authServiceStore as any)?.tokensAndOtherData?.session_id || null;
	} catch (error) {
		console.error('❌ [E2E] Failed to get auth session_id:', error);
		return null;
	}
}

export async function performKeyExchange(m: any, forceNew: boolean = false): Promise<void> {
	if (!SECURITY_CONFIG.E2E_ENCRYPTION_ENABLED) return;

	try {
		const e2e = getE2EEncryption();
		if (!e2e) {
			console.warn('⚠️ [E2E] E2E encryption is enabled but instance is null');
			return;
		}

		const authSessionId = getAuthSessionId(m);
		if (!authSessionId) {
			console.warn('⚠️ [E2E] No auth session_id available, skipping E2E');
			return;
		}

		let shouldCreateNew = forceNew;
		if (!forceNew) {
			const loaded = await e2e.loadSession(authSessionId);
			if (loaded && !e2e.isSessionExpired()) {
				console.log('✅ [E2E] Loaded existing auth key for session:', authSessionId);
			} else {
				shouldCreateNew = true;
			}
		}

		if (shouldCreateNew) {
			console.log('🔐 [E2E] Creating new auth key for session:', authSessionId);
			const { privateKey, publicKey } = await e2e.generateKeyPair();
			(e2e as any).clientPrivateKey = privateKey;
			(e2e as any).clientPublicKey = publicKey;
		}

		const clientPublicKey = (e2e as any).clientPublicKey;
		if (!clientPublicKey) {
			console.error('❌ [E2E] No client public key available');
			return;
		}

		const timestampMs = Date.now();
		const timestamp = Math.floor(timestampMs / 1000);
		const base64PublicKey = uint8ArrayToBase64(clientPublicKey);

		const keyExchangeMessage: any = {
			id: timestampMs,
			type: 'key_exchange',
			client_public_key: base64PublicKey,
			timestamp,
			force_new: shouldCreateNew,
		};

		console.log('🔐 [E2E] Initiating key exchange with server (force_new:', shouldCreateNew, ')...');

		m.keyExchangePromise = new Promise<void>((resolve) => {
			m.keyExchangeResolver = resolve;
			setTimeout(() => {
				if (m.keyExchangeResolver) {
					console.warn('⚠️ [E2E] Key exchange timeout after 10s, resolving anyway');
					m.keyExchangeResolver();
					m.keyExchangeResolver = null;
				}
			}, 10000);
		});

		m.websocket?.send(JSON.stringify(keyExchangeMessage));

		await m.keyExchangePromise;
		console.log('✅ [E2E] Key exchange promise resolved');
	} catch (error) {
		console.error('❌ [E2E] Key exchange failed:', error);
		m.keyExchangePromise = null;
		m.keyExchangeResolver = null;
	}
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
	let binary = '';
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}
