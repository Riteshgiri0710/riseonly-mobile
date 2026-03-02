import { LiveTimeAgo, MainText, UserLogo } from '@core/ui';
import { navigate } from '@lib/navigation';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { notifyActionsStore, notifyInteractionsStore } from 'src/modules/notify/stores';
import { Notify } from 'src/modules/notify/stores/types';
import { themeStore } from 'src/modules/theme/stores';

const NotificationComponent = observer((notify: Notify) => {
	const { currentTheme } = themeStore;
	const { notificationUpdater } = notifyInteractionsStore;

	const [isReaded, setIsReaded] = useState(notify?.is_read);

	const logosArray = notify?.actors?.map(actor => actor?.actor_avatar) || [];

	const onNotifyPress = () => {
		navigate('PostDetail', { postId: notify?.id });
		setIsReaded(p => !p && true);
		if (!notificationUpdater || !isReaded) return;
		notificationUpdater(notify.id, 'is_read', false);
		if (!notifyActionsStore.allNotificationsSai.data) return;
		notifyActionsStore.allNotificationsSai.data.totalUnread = notifyActionsStore.allNotificationsSai.data.totalUnread - 1;
	};

	useEffect(() => {
		return () => { setIsReaded(false); };
	}, []);

	return (
		<TouchableOpacity
			style={s.container}
			onPress={onNotifyPress}
			activeOpacity={0.6}
		>
			<UserLogo
				source={logosArray}
				size={45}
			/>

			<View style={{ flex: 1 }}>
				<MainText
					numberOfLines={2}
					ellipsizeMode='tail'
				>
					{notify?.body || ''}
				</MainText>

				<LiveTimeAgo
					date={notify?.created_at || new Date().toISOString()}
					fontSize={13}
				/>
			</View>

			{!isReaded && (
				<View style={[s.notReadIndicator, { backgroundColor: currentTheme.primary_100 }]} />
			)}
		</TouchableOpacity>
	);
});

export const Notification = React.memo(NotificationComponent, (prevProps, nextProps) => {
	return (
		prevProps.id === nextProps.id &&
		prevProps.is_read === nextProps.is_read &&
		prevProps.created_at === nextProps.created_at &&
		prevProps.actors?.length === nextProps.actors?.length
	);
});

const s = StyleSheet.create({
	container: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 7.5,
		paddingHorizontal: 10,
	},
	notReadIndicator: {
		marginLeft: 'auto',
		width: 7,
		height: 7,
		borderRadius: 1000,
	}
});
