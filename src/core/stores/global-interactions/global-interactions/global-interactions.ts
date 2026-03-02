import { createInstance } from '@api/api';
import { logger } from '@lib/helpers';
import { formatDiffData } from '@lib/text';
import { authActionsStore, authServiceStore } from '@modules/auth/stores';
import { profileStore } from '@modules/user/stores/profile';
import { initAppStorage, initLocalStorage } from '@storage/index';
import { eventActionsStore, eventServicesStore } from '@stores/events';
import { makeAutoObservable } from 'mobx';

class GlobalInteractionsStore {
	constructor() { makeAutoObservable(this); }

	initStorages = async () => {
		await initAppStorage();
		await initLocalStorage();
	};

	initializeApp = async () => {
		const { setAwayAction } = eventActionsStore;
		const { presubscribeToChats } = eventServicesStore;
		const { syncDeviceTokenAction } = authActionsStore;
		const { initTokensAndOtherData } = authServiceStore;
		const { preloadProfile } = profileStore;

		this.initStorages();
		createInstance("rust");

		const profileFromPreload = await preloadProfile();

		const userId = profileFromPreload?.id || "";

		setAwayAction("online", userId);

		initTokensAndOtherData();

		await presubscribeToChats(userId);

		logger.info(
			'App',
			'App initialized and ready for logs. To use logs use: logger.info() and other functions'
		);

		setTimeout(async () => {
			const deviceToken = authServiceStore.deviceToken;

			if (profileFromPreload && deviceToken) {
				logger.info('App', `Syncing device token for user: ${profileFromPreload.id}`);
				syncDeviceTokenAction(profileFromPreload.id);
			}
		}, 2000);
	};
}

export const globalInteractionsStore = new GlobalInteractionsStore();