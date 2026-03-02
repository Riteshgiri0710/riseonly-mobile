import { localStorage } from '@storage/index';
import nacl from 'tweetnacl';
import { DoubleRatchet, RatchetHeader, SerializedRatchetState } from './double-ratchet';

interface E2EIdentityKeys {
	privateKey: Uint8Array;
	publicKey: Uint8Array;
	createdAt: number;
}

interface PreKey {
	id: number;
	privateKey: Uint8Array;
	publicKey: Uint8Array;
}

interface E2EChatSession {
	chatId: string;
	peerUserId: string;
	sharedSecret: Uint8Array;
	sessionPublicKey: string;
	createdAt: number;
	isVerified: boolean;
	verificationCode?: string;
	ratchetState?: SerializedRatchetState;
	isInitiator: boolean;
}

const E2E_IDENTITY_KEY = 'e2e_identity_key';
const E2E_PREKEYS_PREFIX = 'e2e_prekeys_';
const E2E_CHAT_SESSIONS_PREFIX = 'e2e_chat_session_';
const PREKEY_COUNT = 100;

export class E2EMessageEncryption {
	private identityPrivateKey: Uint8Array | null = null;
	private identityPublicKey: Uint8Array | null = null;
	private preKeys: Map<number, PreKey> = new Map();
	private chatSessions: Map<string, E2EChatSession> = new Map();
	private ratchets: Map<string, DoubleRatchet> = new Map();
	private decryptionQueues: Map<string, Promise<any>> = new Map();
	private keyExchangeInProgress: Map<string, Promise<string>> = new Map();

	async initializeIdentityKey(): Promise<{ publicKey: string; privateKey: string; preKeys: string[]; }> {
		const stored = await localStorage.get(E2E_IDENTITY_KEY) as E2EIdentityKeys | null;

		if (stored && stored.privateKey && stored.publicKey) {
			this.identityPrivateKey = new Uint8Array(Object.values(stored.privateKey));
			this.identityPublicKey = new Uint8Array(Object.values(stored.publicKey));

			console.log('✅ [E2E Message] Loaded existing identity key');

			await this.loadPreKeys();

			return {
				publicKey: this.uint8ArrayToBase64(this.identityPublicKey),
				privateKey: this.uint8ArrayToBase64(this.identityPrivateKey),
				preKeys: this.getPreKeyPublicKeys(),
			};
		}

		const keyPair = nacl.box.keyPair();
		this.identityPrivateKey = keyPair.secretKey;
		this.identityPublicKey = keyPair.publicKey;

		await localStorage.set(E2E_IDENTITY_KEY, {
			privateKey: Array.from(this.identityPrivateKey),
			publicKey: Array.from(this.identityPublicKey),
			createdAt: Date.now(),
		});

		await this.generatePreKeys();

		console.log('✅ [E2E Message] Generated new identity key and prekeys');

		return {
			publicKey: this.uint8ArrayToBase64(this.identityPublicKey),
			privateKey: this.uint8ArrayToBase64(this.identityPrivateKey),
			preKeys: this.getPreKeyPublicKeys(),
		};
	}

	private async generatePreKeys(): Promise<void> {
		for (let i = 0; i < PREKEY_COUNT; i++) {
			const keyPair = nacl.box.keyPair();
			const preKey: PreKey = {
				id: i,
				privateKey: keyPair.secretKey,
				publicKey: keyPair.publicKey,
			};
			this.preKeys.set(i, preKey);
		}

		const preKeysArray = Array.from(this.preKeys.values()).map(pk => ({
			id: pk.id,
			privateKey: Array.from(pk.privateKey),
			publicKey: Array.from(pk.publicKey),
		}));

		await localStorage.set(`${E2E_PREKEYS_PREFIX}all`, preKeysArray);
		console.log(`✅ [E2E Message] Generated ${PREKEY_COUNT} prekeys`);
	}

	private async loadPreKeys(): Promise<void> {
		const stored = await localStorage.get(`${E2E_PREKEYS_PREFIX}all`) as any[];
		if (!stored) return;

		for (const pk of stored) {
			this.preKeys.set(pk.id, {
				id: pk.id,
				privateKey: new Uint8Array(Object.values(pk.privateKey)),
				publicKey: new Uint8Array(Object.values(pk.publicKey)),
			});
		}

		console.log(`✅ [E2E Message] Loaded ${this.preKeys.size} prekeys`);
	}

	private getPreKeyPublicKeys(): string[] {
		return Array.from(this.preKeys.values()).map(pk =>
			this.uint8ArrayToBase64(pk.publicKey)
		);
	}

	getPreKey(id: number): PreKey | undefined {
		return this.preKeys.get(id);
	}

	getIdentityPublicKey(): string | null {
		if (!this.identityPublicKey) {
			return null;
		}
		return this.uint8ArrayToBase64(this.identityPublicKey);
	}

	async performKeyExchange(
		chatId: string,
		peerUserId: string,
		peerPublicKey: string,
		isInitiator: boolean = true
	): Promise<string> {
		if (!this.identityPrivateKey || !this.identityPublicKey) {
			throw new Error('Identity key not initialized');
		}

		const peerPublicKeyBytes = this.base64ToUint8Array(peerPublicKey);

		const sharedSecret = nacl.box.before(peerPublicKeyBytes, this.identityPrivateKey);

		const ratchet = new DoubleRatchet(sharedSecret, isInitiator);
		this.ratchets.set(chatId, ratchet);

		const verificationCode = this.generateVerificationCode(
			this.identityPublicKey,
			peerPublicKeyBytes
		);

		const session: E2EChatSession = {
			chatId,
			peerUserId,
			sharedSecret,
			sessionPublicKey: this.uint8ArrayToBase64(this.identityPublicKey),
			createdAt: Date.now(),
			isVerified: false,
			verificationCode,
			ratchetState: ratchet.exportState(),
			isInitiator,
		};

		this.chatSessions.set(chatId, session);

		await localStorage.set(`${E2E_CHAT_SESSIONS_PREFIX}${chatId}`, {
			chatId,
			peerUserId,
			sharedSecret: Array.from(sharedSecret),
			sessionPublicKey: session.sessionPublicKey,
			createdAt: session.createdAt,
			isVerified: session.isVerified,
			verificationCode: session.verificationCode,
			ratchetState: session.ratchetState,
			isInitiator: session.isInitiator,
		});

		console.log('✅ [E2E Message] Key exchange completed with Double Ratchet for chat:', chatId);

		this.keyExchangeInProgress.delete(chatId);

		return verificationCode;
	}

	isKeyExchangeInProgress(chatId: string): boolean {
		return this.keyExchangeInProgress.has(chatId);
	}

	async waitForKeyExchange(chatId: string, timeoutMs: number = 10000): Promise<boolean> {
		const exchangePromise = this.keyExchangeInProgress.get(chatId);
		if (!exchangePromise) {
			return this.hasChatSession(chatId);
		}

		try {
			await Promise.race([
				exchangePromise,
				new Promise((_, reject) => setTimeout(() => reject(new Error('Key exchange timeout')), timeoutMs))
			]);
			return true;
		} catch (error) {
			console.error('❌ [E2E Message] Key exchange wait failed:', error);
			return false;
		}
	}

	markKeyExchangeInProgress(chatId: string, exchangePromise: Promise<string>): void {
		this.keyExchangeInProgress.set(chatId, exchangePromise);
	}

	async loadChatSession(chatId: string): Promise<boolean> {
		const stored = await localStorage.get(`${E2E_CHAT_SESSIONS_PREFIX}${chatId}`) as any;

		if (!stored) {
			return false;
		}

		const session: E2EChatSession = {
			chatId: stored.chatId,
			peerUserId: stored.peerUserId,
			sharedSecret: new Uint8Array(Object.values(stored.sharedSecret)),
			sessionPublicKey: stored.sessionPublicKey,
			createdAt: stored.createdAt,
			isVerified: stored.isVerified,
			verificationCode: stored.verificationCode,
			ratchetState: stored.ratchetState,
			isInitiator: stored.isInitiator || true,
		};

		this.chatSessions.set(chatId, session);

		if (session.ratchetState) {
			const ratchet = DoubleRatchet.importState(session.ratchetState);
			this.ratchets.set(chatId, ratchet);
		}

		console.log('✅ [E2E Message] Loaded session with Double Ratchet for chat:', chatId);

		return true;
	}

	async encryptMessage(chatId: string, plaintext: string): Promise<string> {
		const existingQueue = this.decryptionQueues.get(chatId) || Promise.resolve();

		const encryptionPromise = existingQueue.then(async () => {
			return await this.encryptMessageInternal(chatId, plaintext);
		});

		this.decryptionQueues.set(chatId, encryptionPromise);

		return encryptionPromise;
	}

	private async encryptMessageInternal(chatId: string, plaintext: string): Promise<string> {
		let session = this.chatSessions.get(chatId);

		if (!session) {
			console.log('🔄 [Encrypt] Session not in memory, loading from storage for chat:', chatId);
			const loaded = await this.loadChatSession(chatId);
			if (!loaded) {
				throw new Error('E2E session not found for chat');
			}
			session = this.chatSessions.get(chatId)!;
		}

		let ratchet = this.ratchets.get(chatId);
		if (!ratchet) {
			console.log('🔄 [Encrypt] Ratchet not in memory, importing from session state for chat:', chatId);
			if (session.ratchetState) {
				ratchet = DoubleRatchet.importState(session.ratchetState);
				this.ratchets.set(chatId, ratchet);
				console.log('✅ [Encrypt] Ratchet imported, sendingChainIndex:', session.ratchetState.sendingChainIndex);
			} else {
				throw new Error('No ratchet state found for chat');
			}
		}

		const currentState = ratchet.exportState();
		console.log('🔐 [Encrypt] Before encryption - sendingChainIndex:', currentState.sendingChainIndex, 'previousSendingChainLength:', currentState.previousSendingChainLength);

		const { ciphertext, header } = ratchet.encrypt(plaintext);
		console.log('🔐 [Encrypt] After encryption - messageIndex:', header.messageIndex, 'previousChainLength:', header.previousChainLength);

		session.ratchetState = ratchet.exportState();
		await this.saveSession(chatId, session);
		console.log('💾 [Encrypt] Ratchet state saved, new sendingChainIndex:', session.ratchetState.sendingChainIndex);

		const combined = JSON.stringify({ header, ciphertext });
		return this.uint8ArrayToBase64(new TextEncoder().encode(combined));
	}

	async decryptMessage(chatId: string, encryptedBase64: string): Promise<string> {
		const existingQueue = this.decryptionQueues.get(chatId) || Promise.resolve();

		const decryptionPromise = existingQueue.then(async () => {
			return await this.decryptMessageInternal(chatId, encryptedBase64);
		});

		this.decryptionQueues.set(chatId, decryptionPromise);

		return decryptionPromise;
	}

	private async decryptMessageInternal(chatId: string, encryptedBase64: string): Promise<string> {
		let session = this.chatSessions.get(chatId);

		if (!session) {
			console.log('🔄 [Decrypt] Session not in memory, loading from storage for chat:', chatId);
			const loaded = await this.loadChatSession(chatId);
			if (!loaded) {
				throw new Error('E2E session not found for chat');
			}
			session = this.chatSessions.get(chatId)!;
		}

		let ratchet = this.ratchets.get(chatId);
		if (!ratchet) {
			console.log('🔄 [Decrypt] Ratchet not in memory, importing from session state for chat:', chatId);
			if (session.ratchetState) {
				ratchet = DoubleRatchet.importState(session.ratchetState);
				this.ratchets.set(chatId, ratchet);
				console.log('✅ [Decrypt] Ratchet imported, receivingChainIndex:', session.ratchetState.receivingChainIndex);
			} else {
				throw new Error('No ratchet state found for chat');
			}
		}

		const combined = this.base64ToUint8Array(encryptedBase64);
		const combinedStr = new TextDecoder().decode(combined);
		const { header, ciphertext } = JSON.parse(combinedStr) as { header: RatchetHeader; ciphertext: string; };

		console.log('🔓 [Decrypt] Incoming message - messageIndex:', header.messageIndex, 'previousChainLength:', header.previousChainLength);
		const currentState = ratchet.exportState();
		console.log('🔓 [Decrypt] Current ratchet state - receivingChainIndex:', currentState.receivingChainIndex, 'sendingChainIndex:', currentState.sendingChainIndex);

		const skippedDecrypted = ratchet.trySkippedMessageKeys(ciphertext, header);
		if (skippedDecrypted) {
			console.log('✅ [Decrypt] Decrypted using skipped message key');
			session.ratchetState = ratchet.exportState();
			await this.saveSession(chatId, session);
			return skippedDecrypted;
		}

		const decrypted = ratchet.decrypt(ciphertext, header);
		console.log('✅ [Decrypt] Decrypted successfully');

		session.ratchetState = ratchet.exportState();
		await this.saveSession(chatId, session);
		console.log('💾 [Decrypt] Ratchet state saved, new receivingChainIndex:', session.ratchetState.receivingChainIndex);

		return decrypted;
	}

	private async saveSession(chatId: string, session: E2EChatSession): Promise<void> {
		await localStorage.set(`${E2E_CHAT_SESSIONS_PREFIX}${chatId}`, {
			chatId: session.chatId,
			peerUserId: session.peerUserId,
			sharedSecret: Array.from(session.sharedSecret),
			sessionPublicKey: session.sessionPublicKey,
			createdAt: session.createdAt,
			isVerified: session.isVerified,
			verificationCode: session.verificationCode,
			ratchetState: session.ratchetState,
			isInitiator: session.isInitiator,
		});
	}

	hasChatSession(chatId: string): boolean {
		return this.chatSessions.has(chatId);
	}

	getVerificationCode(chatId: string): string | null {
		const session = this.chatSessions.get(chatId);
		return session?.verificationCode || null;
	}

	async markSessionVerified(chatId: string): Promise<void> {
		const session = this.chatSessions.get(chatId);
		if (!session) {
			throw new Error('Session not found');
		}

		session.isVerified = true;
		this.chatSessions.set(chatId, session);

		const stored = await localStorage.get(`${E2E_CHAT_SESSIONS_PREFIX}${chatId}`) as any;
		if (stored) {
			stored.isVerified = true;
			await localStorage.set(`${E2E_CHAT_SESSIONS_PREFIX}${chatId}`, stored);
		}

		console.log('✅ [E2E Message] Session verified for chat:', chatId);
	}

	private generateVerificationCode(
		publicKey1: Uint8Array,
		publicKey2: Uint8Array
	): string {
		const combined = new Uint8Array(publicKey1.length + publicKey2.length);
		combined.set(publicKey1);
		combined.set(publicKey2, publicKey1.length);

		const hashBuffer = nacl.hash(combined);
		const hashArray = Array.from(hashBuffer);

		const code = hashArray.slice(0, 6)
			.map(b => b.toString().padStart(3, '0'))
			.join('');

		// Format as XXX-XXX-XXX-XXX-XXX-XXX
		return code.match(/.{1,3}/g)?.join('-') || code;
	}

	private uint8ArrayToBase64(bytes: Uint8Array): string {
		let binary = '';
		for (let i = 0; i < bytes.length; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}

	private base64ToUint8Array(base64: string): Uint8Array {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	}

	async clearAllSessions(): Promise<void> {
		this.identityPrivateKey = null;
		this.identityPublicKey = null;
		this.chatSessions.clear();

		await localStorage.remove(E2E_IDENTITY_KEY);

		const keys = await localStorage.getAllKeys();
		for (const key of keys) {
			if (key.startsWith(E2E_CHAT_SESSIONS_PREFIX)) {
				await localStorage.remove(key);
			}
		}

		console.log('🗑️ [E2E Message] All E2E data cleared');
	}
}

let e2eMessageEncryption: E2EMessageEncryption | null = null;

export const getE2EMessageEncryption = (): E2EMessageEncryption => {
	if (!e2eMessageEncryption) {
		e2eMessageEncryption = new E2EMessageEncryption();
	}
	return e2eMessageEncryption;
};

