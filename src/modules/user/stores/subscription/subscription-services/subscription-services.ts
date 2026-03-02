import { showNotify } from '@core/config/const';
import i18next from 'i18next';
import { makeAutoObservable } from 'mobx';
import { profileStore } from 'src/modules/user/stores/profile';
import { SubscriptionStatusResponse, VerifyPurchaseResponse } from '../subscription-actions/types';


class SubscriptionServiceStore {
	constructor() {
		makeAutoObservable(this);
	}

	verifyPurchaseSuccessHandler = async (data: VerifyPurchaseResponse) => {
		const { profile } = profileStore;

		if (!profile) return;

		if (profile && data?.isActive) {
			profile.is_premium = true;

			if (data.expiresAt) {
				profile.subscription_end_date = data.expiresAt;
			}
			if (data.subscriptionId) {
				profile.subscription_id = data.subscriptionId;
			}

			showNotify('success', {
				title: i18next.t('notify_success_title'),
				message: i18next.t('subscription_purchase_success')
			});
		}
	};

	verifyPurchaseErrorHandler = async (data: any) => {
		showNotify('error', {
			title: i18next.t('notify_error_title'),
			message: i18next.t('subscription_purchase_error')
		});
	};

	// GET STATUS HANDLERS

	getStatusSuccessHandler = async (data: SubscriptionStatusResponse) => {
		const { profile } = profileStore;

		if (profile && data) {
			profile.is_premium = data.isPremium;

			if (data.subscriptionId) {
				profile.subscription_id = data.subscriptionId;
			}

			if (data.expiresAt) {
				profile.subscription_end_date = data.expiresAt;
			}
		}
	};

	getStatusErrorHandler = async (data: any) => {
		// Silent error handling
	};

	// RESTORE PURCHASES HANDLERS

	restorePurchasesSuccessHandler = async (data: VerifyPurchaseResponse[]) => {
		const { profile } = profileStore;

		if (profile && data && data.length > 0) {
			const activeSubscription = data.find((sub: VerifyPurchaseResponse) => sub.isActive);

			if (activeSubscription) {
				profile.is_premium = true;
				profile.subscription_id = activeSubscription?.subscriptionId;
				profile.subscription_end_date = activeSubscription?.expiresAt;

				showNotify('success', {
					title: i18next.t('notify_success_title'),
					message: i18next.t('subscription_restored_success')
				});
			}
		}
	};

	restorePurchasesErrorHandler = async (data: any) => {
		showNotify('error', {
			title: i18next.t('notify_error_title'),
			message: data.data?.message || i18next.t('subscription_restore_error')
		});
	};

	// CANCEL SUBSCRIPTION HANDLERS

	cancelSubscriptionSuccessHandler = async (data: void) => {
		const { profile } = profileStore;

		if (profile) {
			showNotify('success', {
				title: i18next.t('notify_success_title'),
				message: i18next.t('subscription_cancelled_success')
			});
		}
	};

	cancelSubscriptionErrorHandler = async (data: any) => {
		showNotify('error', {
			title: i18next.t('notify_error_title'),
			message: data.data?.message || i18next.t('subscription_cancel_error')
		});
	};
}

export const subscriptionServiceStore = new SubscriptionServiceStore();

