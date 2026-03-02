import { SECURITY_CONFIG } from '@core/config/security.config';
import { chacha20poly1305 } from '@noble/ciphers/chacha';
import { localStorage } from '@storage/index';
import * as Crypto from 'expo-crypto';
import nacl from 'tweetnacl';
// @ts-ignore
import { randomBytes as rnRandomBytes } from 'react-native-randombytes';

if (typeof global.crypto === 'undefined') {
	global.crypto = {
		// @ts-ignore
		getRandomValues: (array: Uint8Array) => {
			for (let i = 0; i < array.length; i++) {
				array[i] = Math.floor(Math.random() * 256);
			}
			return array;
		},
	};
}

nacl.setPRNG((x: Uint8Array, n: number) => {
	const bytes = rnRandomBytes(n);
	for (let i = 0; i < n; i++) {
		x[i] = bytes[i];
	}
});

function uint8ArrayToBase64(bytes: Uint8Array): string {
	let binary = '';
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

export interface KeyExchangeRequest {
	type: 'key_exchange';
	client_public_key: string;
	timestamp: number;
}

export interface KeyExchangeResponse {
	type: 'key_exchange_response';
	server_public_key: string;
	timestamp: number;
	session_id: string;
}

export interface EncryptedMessage {
	type: 'encrypted_message';
	encrypted_data: string;
	session_id: string;
	timestamp: number;
}

interface StoredE2ESession {
	clientPrivateKey: string;
	clientPublicKey: string;
	sharedSecret: string;
	sessionId: string;
	sessionCreatedAt: number;
}

const E2E_AUTH_KEY_PREFIX = 'e2e_auth_key_';
const E2E_SESSION_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

const getE2EStorageKey = (sessionId: string): string => {
	return `${E2E_AUTH_KEY_PREFIX}${sessionId}`;
};

export class E2EEncryption {
	private clientPrivateKey: Uint8Array | null = null;
	private clientPublicKey: Uint8Array | null = null;
	private sharedSecret: Uint8Array | null = null;
	private sessionId: string | null = null;
	private sessionCreatedAt: number = 0;

	async generateKeyPair(): Promise<{ privateKey: Uint8Array; publicKey: Uint8Array; }> {
		const keyPair = nacl.box.keyPair();
		return {
			privateKey: keyPair.secretKey,
			publicKey: keyPair.publicKey,
		};
	}

	async performKeyExchange(serverPublicKey: Uint8Array): Promise<Uint8Array> {
		if (!this.clientPrivateKey) {
			throw new Error('Client private key not initialized');
		}

		const sharedSecret = nacl.scalarMult(this.clientPrivateKey, serverPublicKey);
		return sharedSecret;
	}

	async initializeKeyExchange(): Promise<KeyExchangeRequest> {
		const { privateKey, publicKey } = await this.generateKeyPair();
		this.clientPrivateKey = privateKey;
		this.clientPublicKey = publicKey;

		const publicKeyBase64 = uint8ArrayToBase64(publicKey);

		return {
			type: 'key_exchange',
			client_public_key: publicKeyBase64,
			timestamp: Date.now(),
		};
	}

	async completeKeyExchange(response: KeyExchangeResponse, authSessionId: string): Promise<void> {
		if (!response.server_public_key || response.server_public_key === '') {
			console.log('✅ [E2E] Server confirmed existing session reuse');
			this.sessionId = response.session_id;

			if (!this.sharedSecret) {
				console.error('❌ [E2E] Server confirmed session reuse but shared secret is not loaded!');
				throw new Error('E2E session reuse failed: shared secret not available');
			}

			console.log('✅ [E2E] Session established with existing shared secret');
			return;
		}

		const serverPublicKey = base64ToUint8Array(response.server_public_key);

		this.sharedSecret = await this.performKeyExchange(serverPublicKey);
		this.sessionId = response.session_id;
		this.sessionCreatedAt = Date.now();

		await this.saveSession(authSessionId);
		console.log('✅ [E2E] New session established and saved');
	}

	getSessionId(): string | null {
		return this.sessionId;
	}

	isSessionEstablished(): boolean {
		return this.sessionId !== null && this.sharedSecret !== null;
	}

	async encryptMessage(plaintext: string, associatedData: string): Promise<string> {
		if (!this.sharedSecret) {
			throw new Error('E2E session not established');
		}

		const nonce = new Uint8Array(12);
		await Crypto.getRandomBytesAsync(12).then((bytes: Uint8Array) => {
			nonce.set(bytes);
		});

		const plaintextBytes = new TextEncoder().encode(plaintext);
		const associatedDataBytes = new TextEncoder().encode(associatedData);

		const ciphertext = await this.chaCha20Poly1305Encrypt(
			this.sharedSecret,
			nonce,
			plaintextBytes,
			associatedDataBytes
		);

		const combined = new Uint8Array(nonce.length + ciphertext.length);
		combined.set(nonce, 0);
		combined.set(ciphertext, nonce.length);

		return uint8ArrayToBase64(combined);
	}

	async decryptMessage(encryptedData: string, associatedData: string): Promise<string> {
		if (!this.sharedSecret) {
			throw new Error('E2E session not established');
		}

		const combined = base64ToUint8Array(encryptedData);

		const nonce = combined.slice(0, 12);
		const ciphertext = combined.slice(12);

		const associatedDataBytes = new TextEncoder().encode(associatedData);

		const plaintext = await this.chaCha20Poly1305Decrypt(
			this.sharedSecret,
			nonce,
			ciphertext,
			associatedDataBytes
		);

		return new TextDecoder().decode(plaintext);
	}

	createEncryptedMessage(encryptedData: string): EncryptedMessage {
		if (!this.sessionId) {
			throw new Error('E2E session not established');
		}

		return {
			type: 'encrypted_message',
			encrypted_data: encryptedData,
			session_id: this.sessionId,
			timestamp: Date.now(),
		};
	}

	isSessionExpired(ttlMs: number = E2E_SESSION_TTL): boolean {
		if (!this.sessionCreatedAt) {
			return true;
		}

		const now = Date.now();
		const elapsed = now - this.sessionCreatedAt;
		return elapsed > ttlMs;
	}

	async saveSession(authSessionId: string): Promise<void> {
		if (!this.clientPrivateKey || !this.clientPublicKey || !this.sharedSecret || !this.sessionId) {
			console.warn('[E2E] Cannot save incomplete session');
			return;
		}

		const session: StoredE2ESession = {
			clientPrivateKey: uint8ArrayToBase64(this.clientPrivateKey),
			clientPublicKey: uint8ArrayToBase64(this.clientPublicKey),
			sharedSecret: uint8ArrayToBase64(this.sharedSecret),
			sessionId: this.sessionId,
			sessionCreatedAt: this.sessionCreatedAt,
		};

		const storageKey = getE2EStorageKey(authSessionId);
		await localStorage.set(storageKey, session);
		console.log('✅ [E2E] Auth key saved for session:', authSessionId);
	}

	async loadSession(authSessionId: string): Promise<boolean> {
		try {
			const storageKey = getE2EStorageKey(authSessionId);
			const stored = await localStorage.get(storageKey) as StoredE2ESession | null;

			if (!stored) {
				console.log('ℹ️ [E2E] No stored auth key for session:', authSessionId);
				return false;
			}

			const sessionAge = Date.now() - stored.sessionCreatedAt;
			if (sessionAge > E2E_SESSION_TTL) {
				console.log('⚠️ [E2E] Stored auth key expired, clearing...');
				await this.clearSession(authSessionId);
				return false;
			}

			this.clientPrivateKey = base64ToUint8Array(stored.clientPrivateKey);
			this.clientPublicKey = base64ToUint8Array(stored.clientPublicKey);
			this.sharedSecret = base64ToUint8Array(stored.sharedSecret);
			this.sessionId = stored.sessionId;
			this.sessionCreatedAt = stored.sessionCreatedAt;

			console.log('✅ [E2E] Auth key loaded for session:', {
				authSessionId,
				e2eSessionId: this.sessionId,
				ageInDays: Math.floor(sessionAge / (24 * 60 * 60 * 1000)),
			});

			return true;
		} catch (error) {
			console.error('❌ [E2E] Failed to load auth key:', error);
			return false;
		}
	}

	async clearSession(authSessionId: string): Promise<void> {
		this.clientPrivateKey = null;
		this.clientPublicKey = null;
		this.sharedSecret = null;
		this.sessionId = null;
		this.sessionCreatedAt = 0;

		const storageKey = getE2EStorageKey(authSessionId);
		await localStorage.remove(storageKey);
		console.log('🗑️ [E2E] Auth key cleared for session:', authSessionId);
	}

	private async chaCha20Poly1305Encrypt(
		key: Uint8Array,
		nonce: Uint8Array,
		plaintext: Uint8Array,
		associatedData: Uint8Array
	): Promise<Uint8Array> {
		const cipher = chacha20poly1305(key, nonce, associatedData);
		const ciphertext = cipher.encrypt(plaintext);
		return ciphertext;
	}

	private async chaCha20Poly1305Decrypt(
		key: Uint8Array,
		nonce: Uint8Array,
		ciphertext: Uint8Array,
		associatedData: Uint8Array
	): Promise<Uint8Array> {
		const cipher = chacha20poly1305(key, nonce, associatedData);
		const plaintext = cipher.decrypt(ciphertext);
		return plaintext;
	}
}

let e2eEncryptionInstance: E2EEncryption | null = null;

export const getE2EEncryption = (): E2EEncryption | null => {
	if (!SECURITY_CONFIG.E2E_ENCRYPTION_ENABLED) {
		return null;
	}

	if (!e2eEncryptionInstance) {
		e2eEncryptionInstance = new E2EEncryption();
	}

	return e2eEncryptionInstance;
};

export const clearE2EEncryption = (): void => {
	if (e2eEncryptionInstance) {
		e2eEncryptionInstance.clearSession();
		e2eEncryptionInstance = null;
	}
};

