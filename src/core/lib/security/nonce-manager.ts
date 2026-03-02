import { SECURITY_CONFIG } from '@core/config/security.config';

export class NonceManager {
	private usedNonces: Map<string, number> = new Map();
	private cleanupInterval: ReturnType<typeof setInterval> | null = null;

	constructor() {
		this.startCleanup();
	}

	generateNonce(): string {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 15);
		const nonce = `${timestamp}-${random}`;

		this.usedNonces.set(nonce, timestamp + SECURITY_CONFIG.NONCE_EXPIRY_MS);

		return nonce;
	}

	isNonceUsed(nonce: string): boolean {
		return this.usedNonces.has(nonce);
	}

	private startCleanup() {
		this.cleanupInterval = setInterval(() => {
			const now = Date.now();
			for (const [nonce, expiryTime] of this.usedNonces.entries()) {
				if (now > expiryTime) {
					this.usedNonces.delete(nonce);
				}
			}
		}, 60000);
	}

	destroy() {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}
		this.usedNonces.clear();
	}
}

export const nonceManager = new NonceManager();

