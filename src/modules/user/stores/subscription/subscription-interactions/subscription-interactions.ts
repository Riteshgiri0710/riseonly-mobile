import { logger } from '@lib/helpers';
import * as Linking from 'expo-linking';
import { makeAutoObservable } from 'mobx';
import { mobxState } from 'mobx-toolbox';
import { Platform } from 'react-native';
import type { Product, Purchase, PurchaseError, Subscription as RNIapSubscription } from 'react-native-iap';
import * as RNIap from 'react-native-iap';
import { profileActionsStore, profileStore } from 'src/modules/user/stores/profile';
import { subscriptionActionsStore } from '../subscription-actions/subscription-actions';

const PRODUCT_IDS = Platform.select({
	ios: [
		'riseonly_premium_1month'
	],
	android: [
		'riseonly_premium_1month'
	]
}) || [];

class SubscriptionInteractionsStore {
	constructor() {
		makeAutoObservable(this);
	}

	premiumModalOpen = mobxState(false)('premiumModalOpen');
	isLoadingProducts = mobxState(false)('isLoadingProducts');
	isPurchasing = mobxState(false)('isPurchasing');
	availableProducts = mobxState<(Product | RNIapSubscription)[]>([])('availableProducts');
	currentPurchase = mobxState<Purchase | null>(null)('currentPurchase');

	selectedSubscription = mobxState<Product | RNIapSubscription | null>(null)('selectedSubscription');
	cachedSubscriptions = mobxState<any[]>([])('cachedSubscriptions');
	iapLoading = mobxState(false)('iapLoading');
	iapInitialized = mobxState(false)('iapInitialized');
	buyLoading = mobxState(false)('buyLoading');

	successSubscriptionModalOpen = mobxState(false)('successSubscriptionModalOpen');

	private purchaseUpdateSubscription: any = null;
	private purchaseErrorSubscription: any = null;

	initializeIAP = async () => {
		try {
			logger.info('initializeIAP', 'Initializing IAP...');

			const isConnected = await RNIap.initConnection();
			if (!isConnected) {
				throw new Error('Failed to initialize IAP connection');
			}

			logger.info('initializeIAP', 'IAP initialized successfully');

			this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(async (purchase: Purchase) => {
				logger.info('purchaseUpdatedListener', JSON.stringify(purchase));
				await this.handlePurchaseUpdate(purchase);
			});

			this.purchaseErrorSubscription = RNIap.purchaseErrorListener((error: PurchaseError) => {
				logger.error('purchaseErrorListener', JSON.stringify(error));
				if (error.code !== 'E_USER_CANCELLED') {
					logger.error('purchaseErrorListener', `Purchase failed: ${error.message}`);
				}
			});

			await this.loadSubscriptionProducts();
		} catch (error) {
			logger.error('initializeIAP', JSON.stringify(error));
		}
	};

	cleanupIAP = async () => {
		try {
			logger.info('cleanupIAP', 'Cleaning up IAP...');

			if (this.purchaseUpdateSubscription) {
				this.purchaseUpdateSubscription.remove();
				this.purchaseUpdateSubscription = null;
			}

			if (this.purchaseErrorSubscription) {
				this.purchaseErrorSubscription.remove();
				this.purchaseErrorSubscription = null;
			}

			await RNIap.endConnection();
			logger.info('cleanupIAP', 'IAP cleaned up');
		} catch (error) {
			logger.error('cleanupIAP', JSON.stringify(error));
		}
	};

	loadSubscriptionProducts = async () => {
		this.isLoadingProducts.setIsLoadingProducts(true);

		try {
			logger.info('loadSubscriptionProducts', `Loading products: ${JSON.stringify(PRODUCT_IDS)}`);

			const products = Platform.OS === 'ios'
				? await RNIap.getSubscriptions({ skus: PRODUCT_IDS })
				: await RNIap.getSubscriptions({ skus: PRODUCT_IDS });

			logger.info('loadSubscriptionProducts', `Products loaded: ${JSON.stringify(products)}`);
			this.availableProducts.setAvailableProducts(products);
		} catch (error) {
			logger.error('loadSubscriptionProducts', JSON.stringify(error));
			throw error;
		} finally {
			this.isLoadingProducts.setIsLoadingProducts(false);
		}
	};

	purchaseSubscription = async (productId: string) => {
		this.isPurchasing.setIsPurchasing(true);

		try {
			logger.info('purchaseSubscription', `Initiating purchase for product: ${productId}`);
			logger.info('purchaseSubscription', `Available products: ${JSON.stringify(this.availableProducts.availableProducts)}`);

			// Check if product is available
			const product = this.availableProducts.availableProducts.find(p => p.productId === productId);
			if (!product) {
				logger.error('purchaseSubscription', `Product not found: ${productId}`);
				logger.info('purchaseSubscription', `Available product IDs: ${JSON.stringify(this.availableProducts.availableProducts.map(p => p.productId))}`);
				throw new Error(`Product ${productId} not available in store`);
			}

			logger.info('purchaseSubscription', `Found product: ${JSON.stringify(product)}`);

			if (Platform.OS === 'ios') {
				await RNIap.requestSubscription({ sku: productId });
			} else {
				await RNIap.requestSubscription({ sku: productId });
			}

			logger.info('purchaseSubscription', 'Purchase request sent');
		} catch (error: any) {
			logger.error('purchaseSubscription', JSON.stringify(error));

			if (error.code === 'E_USER_CANCELLED') {
				logger.info('purchaseSubscription', 'User cancelled purchase');
			} else {
				throw error;
			}
		} finally {
			this.isPurchasing.setIsPurchasing(false);
		}
	};

	restorePurchases = async () => {
		try {
			logger.info('restorePurchases', 'Restoring purchases...');

			const purchases = await RNIap.getAvailablePurchases();
			logger.info('restorePurchases', `Available purchases: ${JSON.stringify(purchases)}`);

			if (purchases.length === 0) {
				logger.info('restorePurchases', 'No purchases to restore');
				return;
			}

			const receipts = purchases.map(purchase => ({
				platform: Platform.OS === 'ios' ? 'ios' as const : 'android' as const,
				receipt: purchase.transactionReceipt || '',
				transactionId: purchase.transactionId,
				productId: purchase.productId,
				purchaseToken: Platform.OS === 'android' ? purchase.purchaseToken : undefined
			}));

			await subscriptionActionsStore.restorePurchasesAction(receipts);

			logger.info('restorePurchases', 'Purchases restored successfully');
		} catch (error) {
			logger.error('restorePurchases', JSON.stringify(error));
			throw error;
		}
	};

	openSubscriptionManagement = () => {
		const url = Platform.select({
			ios: 'https://apps.apple.com/account/subscriptions',
			android: 'https://play.google.com/store/account/subscriptions'
		});

		if (url) {
			Linking.openURL(url).catch(error => {
				logger.error('openSubscriptionManagement', JSON.stringify(error));
			});
		}
	};

	private handlePurchaseUpdate = async (purchase: Purchase) => {
		try {
			logger.info('handlePurchaseUpdate', `Handling purchase: ${JSON.stringify(purchase)}`);

			const receipt = {
				platform: Platform.OS === 'ios' ? 'ios' as const : 'android' as const,
				receipt: purchase.transactionReceipt || '',
				transactionId: purchase.transactionId,
				productId: purchase.productId,
				purchaseToken: Platform.OS === 'android' ? purchase.purchaseToken : undefined
			};

			await subscriptionActionsStore.verifyPurchaseAction(receipt);

			if (Platform.OS === 'ios') {
				await RNIap.finishTransaction({ purchase, isConsumable: false });
			} else if (Platform.OS === 'android' && purchase.purchaseToken) {
				await RNIap.acknowledgePurchaseAndroid({ token: purchase.purchaseToken });
			}

			logger.info('handlePurchaseUpdate', 'Purchase finalized');
		} catch (error) {
			logger.error('handlePurchaseUpdate', JSON.stringify(error));
		}
	};

	handleBuySubscription = async (requestSubscription: any, finishTransaction: any) => {
		const {
			selectedSubscription: { selectedSubscription },
			buyLoading: { setBuyLoading }
		} = this;

		if (!selectedSubscription) return;

		setBuyLoading(true);

		try {
			await requestSubscription({
				sku: selectedSubscription.productId,
			});

			await this.handlePurchaseVerification(finishTransaction);
		} catch (error) {
			console.error('[handleBuySubscription]', error);
			setBuyLoading(false);
		}
	};

	handlePurchaseVerification = async (finishTransaction: any) => {
		const { profile } = profileStore;
		const { getMyProfile } = profileActionsStore;
		const {
			currentPurchase: { currentPurchase },
			buyLoading: { setBuyLoading }
		} = this;

		return new Promise((resolve) => {
			const checkPurchase = setInterval(async () => {
				const purchase = currentPurchase;

				if (!purchase) return;

				clearInterval(checkPurchase);

				try {
					let receiptData = purchase.transactionReceipt;

					if ((!receiptData || receiptData === '') && Platform.OS === 'ios') {
						receiptData = (purchase as any).verificationResultIOS;
					}

					if (!receiptData || receiptData === '') {
						console.error('[handlePurchaseVerification] No receipt data');
						setBuyLoading(false);
						resolve(null);
						return;
					}

					const receipt = {
						platform: Platform.OS as 'ios' | 'android',
						receipt: receiptData,
						transactionId: purchase.transactionId,
						productId: purchase.productId,
						purchaseToken: Platform.OS === 'android' ? purchase.purchaseToken : undefined
					};

					console.log('[handlePurchaseVerification] Verifying purchase:', receipt.productId);

					await subscriptionActionsStore.verifyPurchaseAction(receipt);

					if (Platform.OS === 'ios') {
						await finishTransaction({ purchase, isConsumable: false });
					}

					await getMyProfile(false, profile?.tag || '', true, true);

					setBuyLoading(false);
					resolve(purchase);
				} catch (error) {
					console.error('[handlePurchaseVerification] Error:', error);
					setBuyLoading(false);
					resolve(null);
				}
			}, 500);

			setTimeout(() => {
				clearInterval(checkPurchase);
				setBuyLoading(false);
				resolve(null);
			}, 30000);
		});
	};
}

export const subscriptionInteractionsStore = new SubscriptionInteractionsStore();
