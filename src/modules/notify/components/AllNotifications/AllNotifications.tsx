import { AsyncDataRender } from '@core/ui';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { notifyActionsStore, notifyInteractionsStore } from 'src/modules/notify/stores';
import { Notify } from 'src/modules/notify/stores/types';
import { Notification } from '..';

export const AllNotifications = observer(() => {
	const {
		scrollViewRef: { setScrollViewRef }
	} = notifyInteractionsStore;
	const {
		allNotificationsSai: { data, status, options },
		getAllNotificationsAction
	} = notifyActionsStore;

	const { t } = useTranslation();
	const scrollViewRef = useRef(null);

	useEffect(() => { setScrollViewRef(scrollViewRef); }, [scrollViewRef]);

	const renderItem = useCallback(({ item }: { item: Notify; }) => {
		return <Notification {...item} />;
	}, []);

	const keyExtractor = useCallback((item: Notify) => item.id, []);

	const renderNotifications = useCallback((items: Notify[]) => {
		return (
			<FlatList
				ref={scrollViewRef}
				data={items}
				scrollEventThrottle={16}
				onScroll={options?.dataScope?.onScroll}
				renderItem={renderItem}
				keyExtractor={(item, index) => `${item.id}-${index}`}
				removeClippedSubviews={true}
				maxToRenderPerBatch={10}
				windowSize={10}
				initialNumToRender={10}
			/>
		);
	}, [scrollViewRef, options, renderItem, keyExtractor]);

	return (
		<View style={{ flex: 1 }}>
			<AsyncDataRender
				status={status}
				data={data?.items}
				renderContent={renderNotifications}
				messageHeightPercent={20}
			/>
		</View>
	);
});
