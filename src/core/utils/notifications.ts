import { logger } from '@lib/helpers';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { authServiceStore } from 'src/modules/auth/stores';

export const registerForPushNotificationsAsync = async () => {
	let token;

	if (Device.isDevice) {
		const { status: existingStatus } = await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;

		if (existingStatus !== 'granted') {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}

		if (finalStatus !== 'granted') {
			logger.error("App NOTIFICATIONS", 'User didnt give permission to notifications 😢');
			return;
		}

		const nativeToken = await Notifications.getDevicePushTokenAsync();
		const expoToken = (await Notifications.getExpoPushTokenAsync()).data;

		if (Platform.OS === 'ios') {
			token = nativeToken.data;
			logger.info('App NOTIFICATIONS', `🍎 iOS Native APNS Token: ${token}`);
		} else {
			token = expoToken;
			logger.info('App NOTIFICATIONS', `🤖 Android Token: ${token}`);
		}

		logger.info('App NOTIFICATIONS', `📱 All tokens: ${{
			native: nativeToken.data,
			expo: expoToken,
			platform: Platform.OS
		}}`);

		authServiceStore.setDeviceToken(token);
	} else {
		logger.error("App NOTIFICATIONS", 'Need a real device for push notifications 🤖');
	}

	if (Platform.OS === 'android') {
		Notifications.setNotificationChannelAsync('default', {
			name: 'default',
			importance: Notifications.AndroidImportance.MAX,
			vibrationPattern: [0, 250, 250, 250],
			lightColor: '#FF231F7C',
		});
	}

	return token;
};