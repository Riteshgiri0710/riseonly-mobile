import { authServiceStore } from '@modules/auth/stores';

export const getAuthServiceStore = () => require('@auth/stores').authServiceStore;
export const getAuthActionsStore = () => require('@auth/stores').authActionsStore;
export const getFileServicesStore = () => require('@stores/file/file-services/file-services').fileServicesStore;
export const getFileActions = () => require('@stores/file/file-actions/file-actions').fileActionsStore;

export const getAuthToken = (): string | undefined => {
	try {
		const authServiceStore = getAuthServiceStore();
		const token = authServiceStore?.getTokensAndOtherData()?.access_token || undefined;
		console.log('[getAuthToken] Retrieved token:', token ? `✅ ${token.substring(0, 20)}...` : '❌ No token');
		return token;
	} catch (error) {
		console.error('[getAuthToken] Failed to get auth token:', error);
		return undefined;
	}
};
