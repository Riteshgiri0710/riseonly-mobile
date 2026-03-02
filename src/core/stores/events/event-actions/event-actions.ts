import { logger } from '@lib/helpers';
import { debouncedAction } from '@lib/mobx-toolbox/mobxDebouncer';
import { mobxSaiWs, registerEventHandlers } from '@lib/mobx-toolbox/mobxSaiWs';
import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';
import { authServiceStore } from '@modules/auth/stores';
import { makeAutoObservable } from "mobx";
import { profileStore } from 'src/modules/user/stores/profile';
import { eventServicesStore } from '../event-services/event-services';

class EventActionsStore {
	constructor() {
		makeAutoObservable(this);
		this.initEventHandlers();
	}

	initEventHandlers = () => {
		registerEventHandlers([
			{ type: "user_online_status_changed", handler: eventServicesStore.onlineStatusChangedSuccessHandler },
			{ type: "message_typing", handler: eventServicesStore.messageTypingSuccessHandler },
			{ type: "message_created", handler: eventServicesStore.messageCreatedSuccessHandler },
			{ type: "message_edited", handler: eventServicesStore.messageEditedSuccessHandler },
			{ type: "message_deleted", handler: eventServicesStore.messageDeletedSuccessHandler },
			{ type: "chat_read", handler: eventServicesStore.chatReadSuccessHandler },
			{ type: "reaction_added", handler: eventServicesStore.reactionAddedSuccessHandler },
			{ type: "reaction_removed", handler: eventServicesStore.reactionRemovedSuccessHandler },
			{ type: "link_preview_ready", handler: eventServicesStore.linkPreviewReadySuccessHandler }
		]);
	};

	// AWAY STATUS

	away: MobxSaiWsInstance<any> = {};
	lastWasAway: "online" | "offline" | null = null;

	setAwayAction = async (status: "online" | "offline", userId?: string) => {
		const { checkAuth } = authServiceStore;

		const authStatus = await checkAuth();

		if (authStatus === "unauthenticated") return;

		let user_id = userId;

		if (!user_id) {
			const { getMyProfile } = profileStore;

			const profile = await getMyProfile();
			user_id = profile.id;
		}

		const message = {
			user_id,
			status
		};

		debouncedAction(
			"setAwayAction",
			() => {
				if (this.lastWasAway === status) return;

				this.lastWasAway = status;

				this.away = mobxSaiWs(
					message,
					{
						id: "setAwayAction",
						service: "gateway",
						method: "set_away",
						fetchIfHaveData: true,
						fetchIfPending: true
					}
				);
			},
			{ delay: 100 }
		);
	};

	// PRESENCE SUBSCRIBE

	presenceSubscribe: MobxSaiWsInstance<any> = {};

	presenceSubscribeAction = (userIds: string[]) => {
		if (userIds.length === 0) {
			logger.warn("presenceSubscribeAction", "No user IDs to subscribe to");
			return;
		};

		const message = {
			users: userIds
		};

		this.presenceSubscribe = mobxSaiWs(
			message,
			{
				id: "presenceSubscribeAction",
				service: "gateway",
				method: "presence_subscribe",
				fetchIfHaveData: true,
				fetchIfPending: true
			}
		);
	};
}

export const eventActionsStore = new EventActionsStore();