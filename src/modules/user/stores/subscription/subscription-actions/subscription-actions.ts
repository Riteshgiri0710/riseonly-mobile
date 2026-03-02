import { checker } from '@lib/helpers';
import { MobxSaiWsInstance, mobxSaiWs } from '@lib/mobx-toolbox/mobxSaiWs';
import { makeAutoObservable } from 'mobx';
import { profileStore } from 'src/modules/user/stores/profile';
import { subscriptionServiceStore } from '../subscription-services/subscription-services';
import type {
	IAPPurchaseReceipt,
	SubscriptionStatusResponse,
	VerifyPurchaseResponse
} from './types';

class SubscriptionActionsStore {
	constructor() { makeAutoObservable(this); }

	// VERIFY IAP PURCHASE

	verifyPurchase: MobxSaiWsInstance<VerifyPurchaseResponse> = {};

	verifyPurchaseAction = async (receipt: IAPPurchaseReceipt) => {
		const { verifyPurchaseSuccessHandler, verifyPurchaseErrorHandler } = subscriptionServiceStore;
		const { profile } = profileStore;

		checker(profile, "verifyPurchaseAction: profile is not loaded");

		this.verifyPurchase = mobxSaiWs(
			{
				user_id: profile.id,
				...receipt
			},
			{
				id: "verifyPurchase",
				fetchIfHaveData: true,
				fetchIfPending: false,
				service: "subscription",
				method: "verify_purchase",
				onSuccess: verifyPurchaseSuccessHandler,
				onError: verifyPurchaseErrorHandler,
			}
		);
	};

	// GET SUBSCRIPTION STATUS

	subscriptionStatus: MobxSaiWsInstance<SubscriptionStatusResponse> = {};

	getSubscriptionStatusAction = async () => {
		const { getStatusSuccessHandler, getStatusErrorHandler } = subscriptionServiceStore;
		const { profile } = profileStore;

		checker(profile, "getSubscriptionStatusAction: profile is not loaded");

		this.subscriptionStatus = mobxSaiWs(
			{ user_id: profile.id },
			{
				id: "getSubscriptionStatus",
				needPending: true,
				fetchIfHaveData: false,
				service: "subscription",
				method: "get_status",
				onSuccess: getStatusSuccessHandler,
				onError: getStatusErrorHandler,
			}
		);
	};

	// RESTORE PURCHASES

	restorePurchases: MobxSaiWsInstance<VerifyPurchaseResponse[]> = {};

	restorePurchasesAction = async (receipts: IAPPurchaseReceipt[]) => {
		const { restorePurchasesSuccessHandler, restorePurchasesErrorHandler } = subscriptionServiceStore;
		const { profile } = profileStore;

		checker(profile, "restorePurchasesAction: profile is not loaded");

		console.log('[restorePurchasesAction] Restoring purchases:', {
			count: receipts.length
		});

		const body = {
			receipts,
			user_id: profile.id
		};

		this.restorePurchases = mobxSaiWs(
			body,
			{
				id: "restorePurchases",
				fetchIfHaveData: true,
				fetchIfPending: false,
				service: "subscription",
				method: "restore_purchases",
				onSuccess: restorePurchasesSuccessHandler,
				onError: restorePurchasesErrorHandler,
			}
		);
	};

	// CANCEL SUBSCRIPTION

	cancelSubscription: MobxSaiWsInstance<void> = {};

	cancelSubscriptionAction = async () => {
		const { cancelSubscriptionSuccessHandler, cancelSubscriptionErrorHandler } = subscriptionServiceStore;
		const { profile } = profileStore;

		checker(profile, "cancelSubscriptionAction: profile is not loaded");

		console.log('[cancelSubscriptionAction] Cancelling subscription');

		this.cancelSubscription = mobxSaiWs(
			{ user_id: profile.id },
			{
				id: "cancelSubscription",
				fetchIfHaveData: true,
				fetchIfPending: false,
				service: "subscription",
				method: "cancel",
				onSuccess: cancelSubscriptionSuccessHandler,
				onError: cancelSubscriptionErrorHandler,
			}
		);
	};
}

export const subscriptionActionsStore = new SubscriptionActionsStore();
