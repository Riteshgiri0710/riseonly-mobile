import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_BASE_URL_DEV } from '@env';
import { console } from '@utils/console';
import { websocketApiStore } from '@stores/ws/websocket-api-store';
import axios, { AxiosInstance } from "axios";
import { authServiceStore } from 'src/modules/auth/stores';

const getApiBase = (): string => {
	if (websocketApiStore.whichUrl === 'dev' && typeof API_BASE_URL_DEV !== 'undefined' && API_BASE_URL_DEV !== '') {
		return API_BASE_URL_DEV;
	}
	if (typeof API_BASE_URL === 'undefined' || API_BASE_URL === '') {
		throw new Error('API_BASE_URL is not set in .env');
	}
	return API_BASE_URL;
};

const AUTH_COOKIE_KEY = 'auth_cookie_backup';
const AUTH_DOMAIN_KEY = 'auth_domain_backup';

export const clearCookies = async () => {
	try {
		// await CookieManager.clearAll();
		console.log('All cookies cleared');
		await AsyncStorage.removeItem(AUTH_COOKIE_KEY);
		await AsyncStorage.removeItem(AUTH_DOMAIN_KEY);
		console.log('Backup cookie cleared');

		return Promise.resolve();
	} catch (error) {
		console.error('Error clearing cookies:', error);
		return Promise.resolve();
	}
};

export const backupCookie = async (cookieString: string, domain: string) => {
	try {
		await AsyncStorage.setItem(AUTH_COOKIE_KEY, cookieString);
		await AsyncStorage.setItem(AUTH_DOMAIN_KEY, domain);
		console.log('Cookie backed up to AsyncStorage');
	} catch (error) {
		console.error('Error backing up cookie:', error);
	}
};

export let rust: AxiosInstance;

export const createInstance = (which: 'nest' | 'rust') => {
	const baseURL = getApiBase();

	const instance = axios.create({
		baseURL,
		withCredentials: true,
		headers: {
			'Content-Type': 'application/json'
		},
		xsrfCookieName: 'XSRF-TOKEN',
		xsrfHeaderName: 'X-XSRF-TOKEN'
	});

	axios.defaults.withCredentials = true;

	instance.interceptors.request.use(
		async (config) => {
			config.withCredentials = true;

			const tokens = authServiceStore.getTokensAndOtherData();
			if (tokens?.access_token) {
				config.headers = config.headers || {};
				config.headers['Authorization'] = `Bearer ${tokens.access_token}`;
			}
			console.log('[Interceptor Request]:', config.method, config.url);
			return config;
		},
		(error) => {
			console.log('[Interceptor Request Error]:', error);
			return Promise.reject(error);
		}
	);

	instance.interceptors.response.use(
		async (response) => {
			console.log('[Interceptor Response Success]:', response.config.url, response.status);
			return response;
		},
		(error) => {
			console.log('[Interceptor Response Error]:', error.config?.url, error.response?.status);
			console.log('[Interceptor Response Error] Error details:', error.response?.data);
			// if (error.response?.data?.message === "No token provided" || error.response?.data?.message === "No access token provided" || error.response?.status === 401) {
			if (false) {
				authServiceStore.fullClear();
				try {
					// clearCookies().catch(err => console.log('Error clearing cookies on auth error:', err));
				} catch (err) {
					console.log('Error clearing cookies on auth error:', err);
				}
			}
			return Promise.reject(error);
		}
	);

	rust = instance;
};
