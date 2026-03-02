import { rust } from '@api/api';
import { VirtualList } from '@config/types';
import { mobxSaiWs } from '@lib/mobx-toolbox/mobxSaiWs';
import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';
import { makeAutoObservable, reaction } from 'mobx';
import { authServiceStore } from 'src/modules/auth/stores';
import { profileStore } from 'src/modules/user/stores/profile';
import { sessionInteractionsStore } from '../session-interactions/session-interactions';
import { sessionServiceStore } from '../session-services/session-services';
import { DeleteSessionsBody, DeleteSessionsResponse, GetSessionsResponse, SessionVirtualList } from './types';
class SessionActionsStore {
	constructor() { makeAutoObservable(this); }

	// GET USER SESSIONS

	sessions: MobxSaiWsInstance<SessionVirtualList<GetSessionsResponse[]>> = {};

	getSessionsAction = (fetchIfHaveData = false) => {
		const { getUserSessionsSuccessHandler, getUserSessionsErrorHandler } = sessionServiceStore;
		const { profile } = profileStore;

		if (!profile?.id) return;

		this.sessions = mobxSaiWs(
			{
				user_id: profile.id
			},
			{
				id: "getSessionsAction",
				service: "session",
				method: "get_user_sessions",
				fetchIfHaveData,
				onSuccess: getUserSessionsSuccessHandler,
				onError: getUserSessionsErrorHandler,
			}
		);
	};

	// DELETE USER SESSIONS

	deleteSession: MobxSaiWsInstance<DeleteSessionsResponse> = {};

	deleteSessionAction = () => {
		const { getTokensAndOtherData } = authServiceStore;
		const { profile } = profileStore;
		const {
			sessionIsAllDelete: { sessionIsAllDelete },
			deleteSessionsSuccessHandler,
			deleteSessionsErrorHandler,
			preDeleteSession,
		} = sessionServiceStore;
		const {
			sessionSheetOnCloseSignal: { setSessionSheetOnCloseSignal },
		} = sessionInteractionsStore;

		if (!this.sessions.data || !profile?.id) return;

		const sessionsListBefore = this.sessions.data.sessions;
		const body: DeleteSessionsBody = { isAll: sessionIsAllDelete };

		setSessionSheetOnCloseSignal(true);
		preDeleteSession(body);

		const tokensAndOtherData = getTokensAndOtherData();

		this.deleteSession = mobxSaiWs(
			{
				user_id: profile.id,
				session_id_to_terminate: body.sessionIdToTerminate || "",
				is_all: body.isAll,
				current_session_id: tokensAndOtherData.session_id || ""
			},
			{
				id: "deleteSessionAction",
				service: "session",
				method: "delete_user_sessions_advanced",
				fetchIfHaveData: true,
				fetchIfPending: false,
				onSuccess: deleteSessionsSuccessHandler,
				onError: deleteSessionsErrorHandler,
			}
		);

		const disposer = reaction(
			() => [this.deleteSession?.data, this.deleteSession?.error],
			(data) => {
				if (data[1] && deleteSessionsErrorHandler(sessionsListBefore)) return;
				if (!data[0]) return;
				deleteSessionsSuccessHandler(data[0].message);
				disposer();
			}
		);
	};
}

export const sessionActionsStore = new SessionActionsStore();

export const getSessions = async (): Promise<VirtualList<GetSessionsResponse[]>> => (await rust.get("/sessions/list")).data;
export const deleteSession = async (body: DeleteSessionsBody): Promise<DeleteSessionsResponse> => (await rust.delete("/sessions/delete", { data: body })).data;