export interface IAPPurchaseReceipt {
	platform: 'ios' | 'android';
	receipt: string;
	transactionId?: string;
	productId: string;
	purchaseToken?: string;
}

export interface VerifyPurchaseResponse {
	success: boolean;
	subscriptionId: string;
	expiresAt: string;
	isActive: boolean;
}

export interface SubscriptionStatusResponse {
	isActive: boolean;
	isPremium: boolean;
	subscriptionId?: string;
	expiresAt?: string;
	status: 'active' | 'expired' | 'cancelled' | 'none';
	autoRenew: boolean;
	platform?: 'ios' | 'android' | 'stripe';
}

export interface SubscriptionProduct {
	productId: string;
	localizedPrice: string;
	price: number;
	currency: string;
	title: string;
	description: string;
}

