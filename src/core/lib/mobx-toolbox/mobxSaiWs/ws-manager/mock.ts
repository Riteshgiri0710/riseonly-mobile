import { localStorage } from '@storage/index';

export function setMockMode(m: { mockMode: boolean }, value: boolean) {
	m.mockMode = value;
	localStorage.set('ws_mock_mode', value ? 'true' : 'false').catch((err) =>
		console.warn('[GlobalWebSocketManager] Failed to persist mockMode:', err)
	);
	console.log(`[GlobalWebSocketManager] mockMode set to ${value}`);
	if (value) {
		Promise.all([
			localStorage.get<{ accessToken?: string; refreshToken?: string }>('tokens'),
			localStorage.get<string>('sessionId'),
			localStorage.get('profile'),
		]).then(([tokens, sessionId, profile]) => {
			if (tokens?.accessToken) localStorage.set('ws_mock_tokens', tokens).catch(() => {});
			if (sessionId != null && sessionId !== '') localStorage.set('ws_mock_sessionId', sessionId).catch(() => {});
			if (profile) localStorage.set('ws_mock_profile', profile).catch(() => {});
		}).catch(() => {});
		try {
			const { getCurrentRouteName, navigate } = require('@lib/navigation');
			const n = getCurrentRouteName();
			if (n === 'SignIn' || n === 'SignUp') navigate('MainTabs', { screen: 'Posts' });
		} catch (_) { /* navigation may be unready */ }
	}
}

export function clearMockModeRestoredAtStartup(m: { mockModeRestoredAtStartup: boolean }) {
	m.mockModeRestoredAtStartup = false;
}
