import { logger } from '@lib/helpers';
import NetInfo from '@react-native-community/netinfo';
import { eventInteractionsStore } from '@stores/events';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { profileStore } from 'src/modules/user/stores/profile';

export const NetInfoWrapper = observer(({ children }: { children: React.ReactNode; }) => {
	const { isNoInternet: { setIsNoInternet } } = profileStore;
	const { dispose } = eventInteractionsStore;

	useEffect(() => {
		const unsubscribe = NetInfo.addEventListener(state => {
			logger.info('NetInfoWrapper changed', `NetInfo changed: ${state.isConnected}`);

			if (state.isConnected) {
				logger.info('NetInfoWrapper changed', 'NetInfo is connected');
			} else {
				logger.info('NetInfoWrapper changed', 'NetInfo is not connected');
			}

			if (!state.isConnected) return;

			setIsNoInternet(!state.isConnected);
		});

		NetInfo.fetch().then(state => {
			logger.info('NetInfoWrapper fetch', `NetInfo fetched: ${state.isConnected}`);

			if (state.isConnected) {
				logger.info('NetInfoWrapper fetch', 'NetInfo is connected');
			} else {
				logger.info('NetInfoWrapper fetch', 'NetInfo is not connected');
			}

			if (!state.isConnected) return;
			setIsNoInternet(!state.isConnected);
		});

		return () => {
			unsubscribe();
			dispose();
		};
	}, []);

	return children;
});