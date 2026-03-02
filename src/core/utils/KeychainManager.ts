/**
 * KeychainManager
 * 
 * Manages secure storage of auth tokens in iOS Keychain with App Group support.
 * This allows notification extensions to access the token for API calls.
 * 
 * Usage:
 * - Call saveAuthToken() after successful login
 * - Call deleteAuthToken() on logout
 * - Extensions will automatically have access to the token
 */

import { NativeModules, Platform } from 'react-native';

const { KeychainBridge } = NativeModules;

export class KeychainManager {
	/**
	 * Save auth token to Keychain with App Group access
	 * This allows notification extensions to access the token
	 * 
	 * @param token - The authentication token to save
	 * @returns Promise<boolean> - true if successful, false otherwise
	 */
	static async saveAuthToken(token: string): Promise<boolean> {
		if (Platform.OS !== 'ios') {
			console.warn('KeychainManager: Only supported on iOS');
			return false;
		}

		try {
			await KeychainBridge.saveAuthToken(token);
			console.log('✅ Auth token saved to Keychain');
			return true;
		} catch (error) {
			console.error('❌ Failed to save auth token:', error);
			return false;
		}
	}

	/**
	 * Get auth token from Keychain
	 * 
	 * @returns Promise<string | null> - The token if found, null otherwise
	 */
	static async getAuthToken(): Promise<string | null> {
		if (Platform.OS !== 'ios') {
			console.warn('KeychainManager: Only supported on iOS');
			return null;
		}

		try {
			const token = await KeychainBridge.getAuthToken();
			if (token) {
				console.log('✅ Auth token retrieved from Keychain');
				return token;
			} else {
				console.log('ℹ️ No auth token found in Keychain');
				return null;
			}
		} catch (error) {
			console.error('❌ Failed to get auth token:', error);
			return null;
		}
	}

	/**
	 * Delete auth token from Keychain
	 * Call this on logout to ensure extensions can't access the token
	 * 
	 * @returns Promise<boolean> - true if successful, false otherwise
	 */
	static async deleteAuthToken(): Promise<boolean> {
		if (Platform.OS !== 'ios') {
			console.warn('KeychainManager: Only supported on iOS');
			return false;
		}

		try {
			await KeychainBridge.deleteAuthToken();
			console.log('✅ Auth token deleted from Keychain');
			return true;
		} catch (error) {
			console.error('❌ Failed to delete auth token:', error);
			return false;
		}
	}
}

