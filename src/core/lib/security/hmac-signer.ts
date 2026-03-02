import { SECURITY_CONFIG } from '@core/config/security.config';
// @ts-ignore
import CryptoJS from 'crypto-js';

export class HmacSigner {
	private secretKey: string;

	constructor(secretKey: string) {
		this.secretKey = secretKey;
	}

	signMessage(message: string, timestamp: number): string {
		if (!SECURITY_CONFIG.HMAC_SIGNING_ENABLED) {
			return '';
		}

		const data = message + timestamp.toString();
		const signature = CryptoJS.HmacSHA256(data, this.secretKey);
		return signature.toString(CryptoJS.enc.Hex);
	}

	verifySignature(message: string, timestamp: number, signature: string): boolean {
		if (!SECURITY_CONFIG.HMAC_SIGNING_ENABLED) {
			return true;
		}

		const expectedSignature = this.signMessage(message, timestamp);
		return expectedSignature === signature;
	}
}

let hmacSignerInstance: HmacSigner | null = null;

export const getHmacSigner = (): HmacSigner | null => {
	if (!SECURITY_CONFIG.HMAC_SIGNING_ENABLED) {
		return null;
	}

	if (!hmacSignerInstance) {
		const secret = process.env.HMAC_SECRET || '';
		if (secret) {
			hmacSignerInstance = new HmacSigner(secret);
		}
	}

	return hmacSignerInstance;
};

