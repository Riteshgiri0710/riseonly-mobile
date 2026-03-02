import { checker } from '@lib/helpers';
import { mobxSaiWs } from '@lib/mobx-toolbox/mobxSaiWs';
import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';
import { searchInteractionsStore } from '@modules/search/stores/user';
import { profileStore } from '@modules/user/stores/profile';
import { globalSearchInteractionsStore } from '@stores/global-interactions';
import { makeAutoObservable } from "mobx";
import { mobxState } from 'mobx-toolbox';
import { tagServicesStore } from '../tag-services/tag-services';
import { CheckTagExistResponse, GlobalSearchByTagRequest, GlobalSearchByTagResponse } from './types';

class TagActionsStore {
	constructor() { makeAutoObservable(this); }

	// CHECK TAG EXIST ACTION

	checkTagExist: MobxSaiWsInstance<CheckTagExistResponse> = {};

	checkTagExistAction = (tag: string, addictionSuccessHandler: (data: CheckTagExistResponse) => void) => {
		const { checkTagExistSuccessHandler, checkTagExistErrorHandler } = tagServicesStore;

		this.checkTagExist = mobxSaiWs(
			{ tag },
			{
				id: ["checkTagExistAction", tag],
				service: "tag",
				method: "check_tag_exist",
				fetchIfHaveData: false,
				onCacheUsed: addictionSuccessHandler,
				maxCacheData: 10,
				onSuccess: (data) => {
					checkTagExistSuccessHandler(data);
					addictionSuccessHandler(data);
				},
				onError: checkTagExistErrorHandler,
			}
		);
	};

	globalEntitys: MobxSaiWsInstance<GlobalSearchByTagResponse> = {};
	SEARCH_GLOBAL_LIMIT = 20;

	searchGlobalEntitysAction = async () => {
		const { globalSearchByTagSuccessHandler, globalSearchByTagErrorHandler } = tagServicesStore;
		const { getMyProfile } = profileStore;
		const { queryString: { queryString } } = globalSearchInteractionsStore;
		const { searchUserScrollRef: { searchUserScrollRef } } = searchInteractionsStore;

		checker(searchUserScrollRef, "getSearchUsersAction: searchUserScrollRef is not loaded yet");

		const user = await getMyProfile();

		const params = mobxState<GlobalSearchByTagRequest>({
			relative_id: null,
			limit: this.SEARCH_GLOBAL_LIMIT,
			up: false,
			tag: queryString.slice(1),
			user_id: user?.id ?? null,
		})("params");

		const q = params.params.tag || "empty";

		this.globalEntitys = mobxSaiWs(
			params.params,
			{
				id: ["searchGlobalEntitysAction", q, user.id],
				service: "tag",
				method: "global_search_by_tag",
				fetchIfHaveData: false,
				fetchIfPending: false,
				maxCacheData: 10,
				onSuccess: globalSearchByTagSuccessHandler,
				onError: globalSearchByTagErrorHandler
			}
		);
	};

	// SEARCH BY TAG FOR NAVIGATION (on tag click in messages)

	searchByTagForNavigation: MobxSaiWsInstance<GlobalSearchByTagResponse> = {};

	searchByTagAndNavigateAction = async (tag: string) => {
		const tagClean = tag.startsWith('@') ? tag.slice(1) : tag;
		if (!tagClean) return;

		const {
			searchByTagAndNavigateSuccessHandler,
			searchByTagAndNavigateErrorHandler,
			searchByTagAndNavigateCacheUsedHandler,
		} = tagServicesStore;
		const { getMyProfile } = profileStore;

		const user = await getMyProfile();
		if (!user?.id) return;

		const params = mobxState<GlobalSearchByTagRequest>({
			relative_id: null,
			limit: 5,
			up: false,
			tag: tagClean,
			user_id: user.id,
		})("params");

		this.searchByTagForNavigation = mobxSaiWs(
			params.params,
			{
				id: ["searchByTagAndNavigateAction", tagClean, user.id],
				service: "tag",
				method: "global_search_by_tag",
				fetchIfHaveData: false,
				fetchIfPending: false,
				maxCacheData: 5,
				onCacheUsed: searchByTagAndNavigateCacheUsedHandler,
				onSuccess: searchByTagAndNavigateSuccessHandler,
				onError: searchByTagAndNavigateErrorHandler,
			}
		);
	};
}

export const tagActionsStore = new TagActionsStore();