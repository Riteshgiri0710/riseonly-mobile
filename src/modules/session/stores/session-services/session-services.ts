import { showNotify } from '@config/const';
import { VirtualList } from '@config/types';
import i18next from 'i18next';
import { makeAutoObservable } from 'mobx';
import { mobxState } from 'mobx-toolbox';
import { authActionsStore } from 'src/modules/auth/stores';
import { sessionActionsStore } from '../session-actions/session-actions';
import { DeleteSessionsBody, GetSessionsResponse } from '../session-actions/types';
import { sessionInteractionsStore } from '../session-interactions/session-interactions';

class SessionServiceStore {
	constructor() { makeAutoObservable(this); }

	// STATES

	sessionIsAllDelete = mobxState(false)('sessionIsAllDelete');

	// PRE FUNCTIONS

	preDeleteSession = (body: DeleteSessionsBody) => {
		const { sessionIsAllDelete } = this.sessionIsAllDelete;
		const { selectedSession: { selectedSession } } = sessionInteractionsStore;

		if (!sessionActionsStore.sessions.data) return;

		if (!sessionIsAllDelete && selectedSession) {
			body.sessionIdToTerminate = selectedSession.id;
			sessionActionsStore.sessions.data.sessions = sessionActionsStore.sessions?.data?.sessions?.filter(t => t.id !== selectedSession.id);
		} else {
			sessionActionsStore.sessions.data.sessions = sessionActionsStore.sessions?.data?.sessions?.slice(0, 1);
		}
	};

	// SESSION HANDLERS

	deleteSessionsSuccessHandler = (message: string) => {
		const { logOutAction } = authActionsStore;

		if (message === "Session closed successfully. You have been logged out.") {
			logOutAction();
			return;
		}
		if (message === "All other sessions deleted successfully. Your current session remains active.") {
			showNotify("success", {
				message: i18next.t("delete_all_other_sessions_success")
			});
			return;
		}
		showNotify("success", {
			message: i18next.t("delete_session_success")
		});
	};

	deleteSessionsErrorHandler = (sessionsListBefore: GetSessionsResponse[]) => {
		const { sessions } = sessionActionsStore;
		const { sessionIsAllDelete } = this.sessionIsAllDelete;

		if (!sessions.data || !sessionsListBefore) return;

		showNotify("error", {
			message: i18next.t(sessionIsAllDelete ? "sessions_delete_error" : "session_delete_error")
		});

		return true;
	};

	// GET USER SESSIONS

	getUserSessionsSuccessHandler = (data: VirtualList<GetSessionsResponse[]>) => { };

	getUserSessionsErrorHandler = (message: string) => {
		showNotify("error", {
			title: i18next.t("getSessionsNotify_error_title"),
			message: i18next.t("getSessionsNotify_error_message")
		});
	};

}

export const sessionServiceStore = new SessionServiceStore();