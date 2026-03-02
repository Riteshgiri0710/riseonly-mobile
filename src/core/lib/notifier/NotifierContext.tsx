import React, { createContext, useCallback, useState } from 'react';
import { ImageSourcePropType, View } from 'react-native';
import { NotificationConfig } from '.';
import { BottomNotificationItem } from './BottomNotificationItem';
import { NotificationItem } from './NotificationItem';
import { NotificationWithId, NotifierContextType, NotifierProviderProps } from './types';

export let defaultNotifierImage: ImageSourcePropType | null = null;

export const setDefaultNotificationImage = (image: ImageSourcePropType) => {
	defaultNotifierImage = image;
};

export const NotifierContext = createContext<NotifierContextType | undefined>(undefined);

let notificationIdCounter = 0;

export const NotifierProvider: React.FC<NotifierProviderProps> = ({ children }) => {
	const [notifications, setNotifications] = useState<NotificationWithId[]>([]);

	const hideNotification = useCallback((id?: string) => {
		setNotifications(prev => {
			const notificationToHide = id
				? prev.find(n => n.id === id)
				: prev[0];

			if (notificationToHide?.onHidden) {
				notificationToHide.onHidden();
			}

			return id
				? prev.filter(n => n.id !== id)
				: prev.slice(1);
		});
	}, []);

	const showNotification = useCallback((config: NotificationConfig) => {
		const notificationWithId: NotificationWithId = {
			...config,
			id: config.id || `notification-${++notificationIdCounter}-${Date.now()}`,
		};

		// Bottom: only one at a time — replace existing bottom, no queue (top unchanged)
		if (config.position === 'bottom') {
			setNotifications(prev => [...prev.filter(n => n.position !== 'bottom'), notificationWithId]);
			return;
		}
		setNotifications(prev => [notificationWithId, ...prev]);
	}, []);

	const topNotifications = notifications.filter(n => n.position !== 'bottom');
	const bottomNotification = notifications.find(n => n.position === 'bottom');

	return (
		<NotifierContext.Provider value={{ showNotification, hideNotification }}>
			{children}
			<View
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					zIndex: 9999999999,
					pointerEvents: 'box-none',
				}}
				collapsable={false}
			>
				{topNotifications.length > 0 && (
					<View
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							paddingHorizontal: 12,
							alignItems: 'center',
							pointerEvents: 'box-none',
						}}
					>
						{topNotifications.map((notification, index) => (
							<NotificationItem
								key={notification.id}
								notification={notification}
								onHide={() => hideNotification(notification.id)}
								index={index}
								totalCount={topNotifications.length}
							/>
						))}
					</View>
				)}
				{bottomNotification && (
					<View
						style={{
							position: 'absolute',
							bottom: 0,
							left: 0,
							right: 0,
							paddingHorizontal: 12,
							alignItems: 'center',
							pointerEvents: 'box-none',
						}}
					>
						<BottomNotificationItem
							key={bottomNotification.id}
							notification={bottomNotification}
							onHide={() => hideNotification(bottomNotification.id)}
						/>
					</View>
				)}
			</View>
		</NotifierContext.Provider>
	);
};