/**
 * NotificationHandler
 * 
 * Handles notification events from iOS:
 * - onNotificationTapped: When user taps on a notification (for deep linking)
 * - onNotificationReceived: When notification arrives while app is in foreground
 * - onNotificationReply: When user taps Reply button and sends a message
 * - onNotificationMarkAsRead: When user taps Mark as Read button
 */

import { logger } from '@lib/helpers';
import { formatDiffData } from '@lib/text';
import { Alert, EmitterSubscription, NativeEventEmitter, NativeModules, Platform } from 'react-native';

const { NotificationHandler: NotificationHandlerModule } = NativeModules;

interface NotificationData {
	type?: string;
	chat_id?: string;
	message_id?: string;
	sender_id?: string;
	avatar_url?: string;
	reply_text?: string;
	[key: string]: any;
}

class NotificationHandlerClass {
	private eventEmitter: NativeEventEmitter | null = null;
	private listeners: EmitterSubscription[] = [];

	constructor() {
		if (Platform.OS === 'ios' && NotificationHandlerModule) {
			this.eventEmitter = new NativeEventEmitter(NotificationHandlerModule);
		}
	}

	/**
	 * Listen for notification taps
	 * Use this to implement deep linking to specific chats
	 * 
	 * @param callback - Called when user taps on a notification
	 * @returns Subscription that can be removed
	 */
	onNotificationTapped(callback: (data: NotificationData) => void): EmitterSubscription | null {
		if (!this.eventEmitter) {
			console.warn('NotificationHandler: Not available on this platform');
			return null;
		}

		const subscription = this.eventEmitter.addListener('onNotificationTapped', (data: NotificationData) => {
			console.log('🔔 Notification tapped:', data);
			callback(data);
		});

		this.listeners.push(subscription);
		return subscription;
	}

	/**
	 * Listen for notifications received in foreground
	 * Use this to update UI or show in-app notification
	 * 
	 * @param callback - Called when notification arrives while app is active
	 * @returns Subscription that can be removed
	 */
	onNotificationReceived(callback: (data: NotificationData) => void): EmitterSubscription | null {
		if (!this.eventEmitter) {
			console.warn('NotificationHandler: Not available on this platform');
			return null;
		}

		const subscription = this.eventEmitter.addListener('onNotificationReceived', (data: NotificationData) => {
			console.log('📱 Notification received in foreground:', data);
			callback(data);
		});

		this.listeners.push(subscription);
		return subscription;
	}

	/**
	 * Listen for notification reply actions
	 * Called when user taps Reply button and sends a message
	 * 
	 * @param callback - Called when user replies to a notification
	 * @returns Subscription that can be removed
	 */
	onNotificationReply(callback: (data: NotificationData) => void): EmitterSubscription | null {
		if (!this.eventEmitter) {
			console.warn('NotificationHandler: Not available on this platform');
			return null;
		}

		const subscription = this.eventEmitter.addListener('onNotificationReply', (data: NotificationData) => {
			logger.info('NotificationHandler', `💬 Notification reply: ${formatDiffData(data)}`);
			callback(data);
		});

		this.listeners.push(subscription);
		return subscription;
	}

	/**
	 * Listen for mark as read actions
	 * Called when user taps Mark as Read button
	 * 
	 * @param callback - Called when user marks notification as read
	 * @returns Subscription that can be removed
	 */
	onNotificationMarkAsRead(callback: (data: NotificationData) => void): EmitterSubscription | null {
		if (!this.eventEmitter) {
			console.warn('NotificationHandler: Not available on this platform');
			return null;
		}

		const subscription = this.eventEmitter.addListener('onNotificationMarkAsRead', (data: NotificationData) => {
			logger.info('NotificationHandler', `✅ Notification marked as read: ${formatDiffData(data)}`);
			callback(data);
		});

		this.listeners.push(subscription);
		return subscription;
	}

	/**
	 * Remove all listeners
	 * Call this when component unmounts
	 */
	removeAllListeners(): void {
		this.listeners.forEach(listener => listener.remove());
		this.listeners = [];
	}
}

export const NotificationHandler = new NotificationHandlerClass();

