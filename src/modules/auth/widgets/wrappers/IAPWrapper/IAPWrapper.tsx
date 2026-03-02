import { logger } from '@lib/helpers';
import { localStorage } from '@storage/index';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect, useLayoutEffect } from 'react';
import { Platform } from 'react-native';
import { profileStore } from 'src/modules/user/stores/profile';
import { subscriptionInteractionsStore } from 'src/modules/user/stores/subscription';

import {
	Subscription,
	clearTransactionIOS,
	endConnection,
	flushFailedPurchasesCachedAsPendingAndroid,
	initConnection,
	setup,
	useIAP
} from "react-native-iap";

const subscriptionSkus = Platform.select({
	ios: ["riseonly_1month_premium", "riseonly_3month_premium", "riseonly_6month_premium", "riseonly_12month_premium"],
	android: ["riseonly_1month_premium", "riseonly_3month_premium", "riseonly_6month_premium", "riseonly_12month_premium"]
});

const initIAP = async () => {
	try {
		if (Platform.OS === 'ios') {
			await setup({ storekitMode: 'STOREKIT2_MODE' });
		}

		await initConnection();

		if (Platform.OS === 'android') {
			await flushFailedPurchasesCachedAsPendingAndroid();
		}

		logger.info('IAPWrapper', 'IAP initialized successfully');
	} catch (error) {
		logger.error('IAPWrapper Failed to initialize IAP', error);
	}
};

const disconnectIAP = async () => {
	try {
		await endConnection();
		logger.info('IAPWrapper', 'IAP disconnected');
	} catch (error) {
		logger.error('IAPWrapper', `Failed to disconnect IAP: ${error}`);
	}
};

export const IAPWrapper = observer(({ children }: { children: React.ReactNode; }) => {
	const {
		cachedSubscriptions: { setCachedSubscriptions },
		iapInitialized: { iapInitialized, setIapInitialized },
		currentPurchase: { setCurrentPurchase },
		selectedSubscription: { setSelectedSubscription },
	} = subscriptionInteractionsStore;

	const {
		connected,
		subscriptions,
		getSubscriptions,
		currentPurchase,
		getPurchaseHistory,
	} = useIAP();

	const handleGetPurchaseHistory = async () => {
		try {
			await getPurchaseHistory();
		} catch (error) {
			logger.error('IAPWrapper', `[getPurchaseHistory] ${error}`);
		}
	};

	const handleGetSubscriptions = async () => {
		try {
			await getSubscriptions({ skus: subscriptionSkus as string[] });
		} catch (error) {
			logger.error('IAPWrapper', `[getSubscriptions] ${error}`);
		}
	};

	const getSubscriptionsCache = async () => {
		const subscriptionsCache = await localStorage.get("subscriptionsCache");

		if (!subscriptionsCache) {
			return;
		}

		setCachedSubscriptions(subscriptionsCache as any[]);
	};

	useLayoutEffect(() => {
		const initializeIAPAndClear = async () => {
			try {
				await initIAP();

				if (Platform.OS === 'ios') {
					await clearTransactionIOS();
				}

				setIapInitialized(true);
			} catch (error) {
				logger.error('IAPWrapper', `Failed to initialize IAP: ${error}`);
			}
		};

		initializeIAPAndClear();

		return () => {
			disconnectIAP();
		};
	}, []);

	useEffect(() => {
		if (iapInitialized && connected) {
			handleGetPurchaseHistory();
			handleGetSubscriptions();
		}
	}, [iapInitialized, connected]);

	useEffect(() => {
		if (!currentPurchase) return;

		setCurrentPurchase(currentPurchase);
	}, [currentPurchase]);

	useEffect(() => {
		getSubscriptionsCache();
	}, []);

	useEffect(() => {
		if (!subscriptions || subscriptions.length === 0 || !profileStore?.profile?.subscription_id) return;

		localStorage.set("subscriptionsCache", subscriptions);
		setCachedSubscriptions(subscriptions);

		const updateSelectedSubscription = () => {
			const subscriptionId = profileStore.profile?.subscription_id;
			let finalSubscriptions = [...subscriptions];

			const currentSubscription = finalSubscriptions.find(sub => sub.productId === subscriptionId);

			if (subscriptionId) {
				finalSubscriptions = finalSubscriptions
					.filter(sub => sub.productId !== subscriptionId)
					.sort((a, b) => {
						const localizedPriceA = (a as any).localizedPrice || '';
						const localizedPriceB = (b as any).localizedPrice || '';

						const priceNumberA = parseFloat(localizedPriceA.replace(/[^0-9.,]/g, '').replace(',', '.'));
						const priceNumberB = parseFloat(localizedPriceB.replace(/[^0-9.,]/g, '').replace(',', '.'));

						return priceNumberA - priceNumberB;
					});
			}

			let res: Subscription[] = [];

			if (currentSubscription) {
				const currentSubscriptionLocalizedPrice = (currentSubscription as any).localizedPrice || "";
				const currentSubscriptionPrice = parseFloat(currentSubscriptionLocalizedPrice.replace(/[^0-9.,]/g, '').replace(',', '.'));

				res = finalSubscriptions.filter((a) => {
					const localizedPriceA = (a as any).localizedPrice || '';

					const priceNumberA = parseFloat(localizedPriceA.replace(/[^0-9.,]/g, '').replace(',', '.'));

					return priceNumberA > currentSubscriptionPrice;
				});
			}

			setSelectedSubscription(res?.[0] || null);
		};

		updateSelectedSubscription();

		const dispose = reaction(
			() => profileStore.profile?.subscription_id,
			() => {
				updateSelectedSubscription();
			}
		);

		return () => dispose();
	}, [subscriptions]);

	return children;
});

