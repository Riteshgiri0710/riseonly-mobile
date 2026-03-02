import { logger } from '@lib/helpers';
import NetInfo, { NetInfoSubscription } from "@react-native-community/netinfo";
import { makeAutoObservable } from 'mobx';
import { AppState, AppStateStatus } from 'react-native';
import { eventActionsStore } from '../event-actions/event-actions';

class EventInteractionsStore {
	constructor() {
		makeAutoObservable(this);

		this.appStateSub = AppState.addEventListener("change", this.handleAppStateChange);
		this.netInfoUnsub = NetInfo.addEventListener(state => {
			this.isConnected = !!state.isConnected;
			console.log("🌐 NetInfo changed:", this.isConnected);
		});
	}

	private appStateSub?: { remove: () => void; };
	private netInfoUnsub?: NetInfoSubscription;

	appState: AppStateStatus = "active";
	isConnected: boolean = true;

	handleAppStateChange = (nextState: AppStateStatus) => {
		const { setAwayAction } = eventActionsStore;
		console.log("📱 App state changed:", this.appState, "->", nextState);
		this.appState = nextState;

		if (nextState === "background") {
			logger.info("handleAppStateChange", "offline");
			setAwayAction("offline");
			return;
		}

		if (nextState === "active") {
			logger.info("handleAppStateChange", "online");
			setAwayAction("online");
		}
	};

	dispose() {
		this.appStateSub?.remove();
		this.netInfoUnsub?.();
	}
}

export const eventInteractionsStore = new EventInteractionsStore();
