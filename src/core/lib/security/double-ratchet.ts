import nacl from 'tweetnacl';
// @ts-ignore
import { randomBytes as rnRandomBytes } from 'react-native-randombytes';

interface RatchetState {
	rootKey: Uint8Array;
	sendingChainKey: Uint8Array;
	receivingChainKey: Uint8Array;
	sendingChainIndex: number;
	receivingChainIndex: number;
	dhSendingKey: {
		privateKey: Uint8Array;
		publicKey: Uint8Array;
	};
	dhReceivingKey: Uint8Array | null;
	previousSendingChainLength: number;
	skippedMessageKeys: Map<string, Uint8Array>;
}

const KDF_INFO_ROOT = new TextEncoder().encode('DoubleRatchetRoot');
const KDF_INFO_CHAIN = new TextEncoder().encode('DoubleRatchetChain');
const KDF_INFO_MESSAGE = new TextEncoder().encode('DoubleRatchetMessage');

export class DoubleRatchet {
	private state: RatchetState;

	constructor(
		sharedSecret: Uint8Array,
		isInitiator: boolean
	) {
		const dhKeyPair = nacl.box.keyPair();

		this.state = {
			rootKey: sharedSecret,
			sendingChainKey: new Uint8Array(32),
			receivingChainKey: new Uint8Array(32),
			sendingChainIndex: 0,
			receivingChainIndex: 0,
			dhSendingKey: {
				privateKey: dhKeyPair.secretKey,
				publicKey: dhKeyPair.publicKey,
			},
			dhReceivingKey: null,
			previousSendingChainLength: 0,
			skippedMessageKeys: new Map(),
		};

		if (isInitiator) {
			const [newRootKey, newChainKey] = this.kdfRK(this.state.rootKey, new Uint8Array(32));
			this.state.rootKey = newRootKey;
			this.state.sendingChainKey = newChainKey;
		}
	}

	private kdfRK(rootKey: Uint8Array, dhOutput: Uint8Array): [Uint8Array, Uint8Array] {
		const input = new Uint8Array(rootKey.length + dhOutput.length + KDF_INFO_ROOT.length);
		input.set(rootKey);
		input.set(dhOutput, rootKey.length);
		input.set(KDF_INFO_ROOT, rootKey.length + dhOutput.length);

		const hash = nacl.hash(input);
		const newRootKey = hash.slice(0, 32);
		const newChainKey = hash.slice(32, 64);

		return [newRootKey, newChainKey];
	}

	private kdfCK(chainKey: Uint8Array): [Uint8Array, Uint8Array] {
		const input = new Uint8Array(chainKey.length + KDF_INFO_CHAIN.length);
		input.set(chainKey);
		input.set(KDF_INFO_CHAIN, chainKey.length);

		const hash = nacl.hash(input);
		const newChainKey = hash.slice(0, 32);
		const messageKey = hash.slice(32, 64);

		return [newChainKey, messageKey];
	}

	private dhRatchet(peerPublicKey: Uint8Array): void {
		this.state.previousSendingChainLength = this.state.sendingChainIndex;
		this.state.sendingChainIndex = 0;
		this.state.receivingChainIndex = 0;
		this.state.dhReceivingKey = peerPublicKey;

		const dhOutput = nacl.box.before(peerPublicKey, this.state.dhSendingKey.privateKey);

		const [newRootKey1, newReceivingChainKey] = this.kdfRK(this.state.rootKey, dhOutput);
		this.state.rootKey = newRootKey1;
		this.state.receivingChainKey = newReceivingChainKey;

		const newDhKeyPair = nacl.box.keyPair();
		this.state.dhSendingKey = {
			privateKey: newDhKeyPair.secretKey,
			publicKey: newDhKeyPair.publicKey,
		};

		const dhOutput2 = nacl.box.before(peerPublicKey, this.state.dhSendingKey.privateKey);

		const [newRootKey2, newSendingChainKey] = this.kdfRK(this.state.rootKey, dhOutput2);
		this.state.rootKey = newRootKey2;
		this.state.sendingChainKey = newSendingChainKey;
	}

	encrypt(plaintext: string): { ciphertext: string; header: RatchetHeader; } {
		const [newChainKey, messageKey] = this.kdfCK(this.state.sendingChainKey);
		this.state.sendingChainKey = newChainKey;

		const header: RatchetHeader = {
			dhPublicKey: this.uint8ArrayToBase64(this.state.dhSendingKey.publicKey),
			previousChainLength: this.state.previousSendingChainLength,
			messageIndex: this.state.sendingChainIndex,
		};

		this.state.sendingChainIndex++;

		const nonce = rnRandomBytes(24);
		const plaintextBytes = new TextEncoder().encode(plaintext);

		const encrypted = nacl.secretbox(plaintextBytes, nonce, messageKey);

		const combined = new Uint8Array(nonce.length + encrypted.length);
		combined.set(nonce);
		combined.set(encrypted, nonce.length);

		return {
			ciphertext: this.uint8ArrayToBase64(combined),
			header,
		};
	}

	decrypt(ciphertext: string, header: RatchetHeader): string {
		const peerPublicKey = this.base64ToUint8Array(header.dhPublicKey);

		if (
			!this.state.dhReceivingKey ||
			!this.arraysEqual(this.state.dhReceivingKey, peerPublicKey)
		) {
			this.skipMessageKeys(header.previousChainLength);
			this.dhRatchet(peerPublicKey);
		}

		this.skipMessageKeys(header.messageIndex);

		const [newChainKey, messageKey] = this.kdfCK(this.state.receivingChainKey);
		this.state.receivingChainKey = newChainKey;
		this.state.receivingChainIndex++;

		const combined = this.base64ToUint8Array(ciphertext);
		const nonce = combined.slice(0, 24);
		const encrypted = combined.slice(24);

		const decrypted = nacl.secretbox.open(encrypted, nonce, messageKey);

		if (!decrypted) {
			throw new Error('Failed to decrypt message');
		}

		return new TextDecoder().decode(decrypted);
	}

	private skipMessageKeys(untilIndex: number): void {
		if (this.state.receivingChainIndex + 100 < untilIndex) {
			throw new Error('Too many skipped messages');
		}

		while (this.state.receivingChainIndex < untilIndex) {
			const [newChainKey, messageKey] = this.kdfCK(this.state.receivingChainKey);
			this.state.receivingChainKey = newChainKey;

			const key = `${this.state.receivingChainIndex}`;
			this.state.skippedMessageKeys.set(key, messageKey);

			this.state.receivingChainIndex++;
		}
	}

	trySkippedMessageKeys(ciphertext: string, header: RatchetHeader): string | null {
		const key = `${header.messageIndex}`;
		const messageKey = this.state.skippedMessageKeys.get(key);

		if (!messageKey) {
			return null;
		}

		this.state.skippedMessageKeys.delete(key);

		const combined = this.base64ToUint8Array(ciphertext);
		const nonce = combined.slice(0, 24);
		const encrypted = combined.slice(24);

		const decrypted = nacl.secretbox.open(encrypted, nonce, messageKey);

		if (!decrypted) {
			return null;
		}

		return new TextDecoder().decode(decrypted);
	}

	getCurrentDHPublicKey(): string {
		return this.uint8ArrayToBase64(this.state.dhSendingKey.publicKey);
	}

	exportState(): SerializedRatchetState {
		return {
			rootKey: this.uint8ArrayToBase64(this.state.rootKey),
			sendingChainKey: this.uint8ArrayToBase64(this.state.sendingChainKey),
			receivingChainKey: this.uint8ArrayToBase64(this.state.receivingChainKey),
			sendingChainIndex: this.state.sendingChainIndex,
			receivingChainIndex: this.state.receivingChainIndex,
			dhSendingPrivateKey: this.uint8ArrayToBase64(this.state.dhSendingKey.privateKey),
			dhSendingPublicKey: this.uint8ArrayToBase64(this.state.dhSendingKey.publicKey),
			dhReceivingKey: this.state.dhReceivingKey
				? this.uint8ArrayToBase64(this.state.dhReceivingKey)
				: null,
			previousSendingChainLength: this.state.previousSendingChainLength,
			skippedMessageKeys: Array.from(this.state.skippedMessageKeys.entries()).map(
				([key, value]) => [key, this.uint8ArrayToBase64(value)]
			),
		};
	}

	static importState(serialized: SerializedRatchetState): DoubleRatchet {
		const instance = Object.create(DoubleRatchet.prototype);

		instance.state = {
			rootKey: instance.base64ToUint8Array(serialized.rootKey),
			sendingChainKey: instance.base64ToUint8Array(serialized.sendingChainKey),
			receivingChainKey: instance.base64ToUint8Array(serialized.receivingChainKey),
			sendingChainIndex: serialized.sendingChainIndex,
			receivingChainIndex: serialized.receivingChainIndex,
			dhSendingKey: {
				privateKey: instance.base64ToUint8Array(serialized.dhSendingPrivateKey),
				publicKey: instance.base64ToUint8Array(serialized.dhSendingPublicKey),
			},
			dhReceivingKey: serialized.dhReceivingKey
				? instance.base64ToUint8Array(serialized.dhReceivingKey)
				: null,
			previousSendingChainLength: serialized.previousSendingChainLength,
			skippedMessageKeys: new Map(
				serialized.skippedMessageKeys.map(([key, value]) => [
					key,
					instance.base64ToUint8Array(value),
				])
			),
		};

		return instance;
	}

	private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++) {
			if (a[i] !== b[i]) return false;
		}
		return true;
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
}

export interface RatchetHeader {
	dhPublicKey: string;
	previousChainLength: number;
	messageIndex: number;
}

export interface SerializedRatchetState {
	rootKey: string;
	sendingChainKey: string;
	receivingChainKey: string;
	sendingChainIndex: number;
	receivingChainIndex: number;
	dhSendingPrivateKey: string;
	dhSendingPublicKey: string;
	dhReceivingKey: string | null;
	previousSendingChainLength: number;
	skippedMessageKeys: [string, string][];
}

