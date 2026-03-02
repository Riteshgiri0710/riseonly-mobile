import { GroupBtnsType } from '@config/types';
import { checker } from '@lib/helpers';
import { localStorage } from '@storage/index';
import { makeAutoObservable, runInAction } from 'mobx';
import { mobxState, useMobxForm } from 'mobx-toolbox';
import { Animated } from 'react-native';
import { ReanimatedScrollEvent } from 'react-native-reanimated/lib/typescript/hook/commonTypes';
import { postActionsStore } from 'src/modules/post/stores';
import { EditProfileSchema } from 'src/modules/user/shared/schemas/profileSchema';
import { profileActionsStore } from '../profile-actions/profile-actions';
import { EditProfileBody } from '../profile-actions/types';
import { profileServiceStore } from '../profile-service/profile-service';
import { Profile, UserMore } from '../types';
import { formatDiffData } from '@lib/text';

class ProfileStore {
	constructor() { makeAutoObservable(this); }

	_isRefreshTriggered = false;

	// INTERNET

	isNoInternet = mobxState(false)("isNoInternet");

	// PROFILES

	profile: Profile | null = null;
	setProfile = (profile: Profile | null) => this.profile = profile;

	user: Profile | null = null;
	setUser = (user: Profile | null) => this.user = user;

	getMyProfile = async () => {
		if (this.profile) return this.profile;

		const localProfile = await localStorage.get('profile');

		if (localProfile) {
			this.setProfile(localProfile as Profile);
			return localProfile as Profile;
		}

		if (!this.profile) {
			const { getUserProfile } = profileServiceStore;
			const p = await getUserProfile();
			return p;
		};

		return this.profile;
	};

	// TABS

	profileTab = mobxState(0)("profileTab", { reset: true });
	tabCount = 4;
	scrollPosition = 0;
	openedPage = mobxState(0)("openedPage");

	setScrollPosition = (position: number) => {
		this.scrollPosition = position;
	};

	setProfileTab = (index: number) => {
		console.log('[setProfileTab]: index', index);
		this.profileTab.setProfileTab(index);
		this.openedPage.setOpenedPage(index);
	};

	handleSwap = (index: number) => {
		console.log('[handleSwap]: index', index);
		this.openedPage.setOpenedPage(index);
	};

	// REFRESH CONTROL

	refreshing = mobxState(false)("refreshing");
	postRefreshing = mobxState(false)("postRefreshing");

	onRefresh = (tag: string, isUser: boolean) => {
		const { getMyProfile } = profileActionsStore;
		const { getUserPostsAction } = postActionsStore;

		checker(tag, "onRefresh: tag is undefined");

		if (this.refreshing.refreshing || this.postRefreshing.postRefreshing) return;

		this.refreshing.setRefreshing(true);
		this.postRefreshing.setPostRefreshing(true);

		getMyProfile(false, tag, isUser, true, () => {
			this.refreshing.setRefreshing(false);
		});
		getUserPostsAction(tag, false, true, () => {
			this.postRefreshing.setPostRefreshing(false);
		});
	};

	handleScroll = (event: ReanimatedScrollEvent, progress: Animated.Value) => {
		const offsetY = event.contentOffset.y;

		if (offsetY < 0) {
			const MAX_PULL_DISTANCE = 100;
			const progressValue = Math.min(Math.abs(offsetY) / MAX_PULL_DISTANCE, 1);
			if (progress && typeof progress.setValue === 'function') {
				progress.setValue(progressValue);
			}
		} else {
			if (progress && typeof progress.setValue === 'function') {
				progress.setValue(0);
			}
		}
	};

	// PRELOAD

	preloadProfile = async () => {
		const { getUserProfile } = profileServiceStore;

		const profile = await localStorage.get('profile');

		if (profile) {
			this.setProfile(profile as Profile);
			return profile as Profile;
		}
		else {
			const p = await getUserProfile();
			this.setProfile(p);
			return p;
		}

		this.resetForm();
	};

	// PROFILE DATA

	userToShow: null | Profile = null;
	setUserToShow = (user: Profile | null) => {
		runInAction(() => {
			this.userToShow = user;
		});
	};

	smartProfileReplace = (updatedData: EditProfileBody) => {
		if (!this.profile) return;

		runInAction(() => {
			for (const key in updatedData) {
				if (key === "more" && updatedData.more) {
					const updatedMore = updatedData.more;

					Object.entries(updatedMore).forEach(([k, v]) => {
						const moreKey = k as keyof UserMore;
						if (v !== undefined) {
							if (profileStore.profile && profileStore.profile.more?.[moreKey] !== v) {
								(profileStore.profile.more as any)[moreKey] = v;
							}
							if (profileStore.userToShow && profileStore.userToShow.more?.[moreKey] !== v) {
								// @ts-ignore
								profileStore.userToShow.more[moreKey] = v;
							}
							if (profileActionsStore.myProfile.data?.more?.[moreKey] !== v) {
								(profileActionsStore.myProfile.data?.more as any)[moreKey] = v;
							}
						}
					});
				} else {
					const typedKey = key as keyof EditProfileBody;
					const newValue = updatedData[typedKey];

					if (newValue !== undefined && profileStore.profile) {
						if (profileStore.profile?.[typedKey] !== newValue) {
							// @ts-ignore
							profileStore.profile[typedKey] = newValue;
						}
						if (profileStore.userToShow?.[typedKey] !== newValue) {
							// @ts-ignore
							profileStore.userToShow[typedKey] = newValue;
						}
						if (profileActionsStore.myProfile.data?.[typedKey] !== newValue) {
							(profileActionsStore.myProfile.data as any)[typedKey] = newValue;
						}
					}
				}

			}
		});
	};

	// FORMS

	editProfileForm = useMobxForm({
		name: "",
		description: "",
		tag: "",
		hb: ""
	}, EditProfileSchema, {
		instaValidate: true,
		resetErrIfNoValue: true
	});

	resetForm = () => {
		if (!this.profile) return;
		const newForm = {
			name: this.profile.name,
			description: this.profile?.more?.description || "",
			tag: this.profile?.tag,
			hb: this.profile?.more?.hb || ""
		};
		this.editProfileForm = useMobxForm(newForm, EditProfileSchema);
		this.datePickerOpen.setDatePickerOpen(false);
	};

	// DATE PICKER

	datePickerOpen = mobxState(false)("datePickerOpen");

	// PRIVACY SETTINGS

	selectedPrivacy = mobxState<GroupBtnsType | null>(null)("selectedPrivacy");
	privacySettingsItems = mobxState<GroupBtnsType[]>([])("privacySettingsItems");

	// DELETE HB

	onDeleteHb = () => {
		const { editProfileAction } = profileActionsStore;

		const hbValueBefore = this.editProfileForm.values.hb;
		this.editProfileForm.values.hb = "";
		this.datePickerOpen.setDatePickerOpen(false);

		profileServiceStore.onEditProfileError = () => {
			this.editProfileForm.values.hb = hbValueBefore;
		};

		editProfileAction(
			{ more: { hb: "" } }
		);
	};

	// PRIVACY

	privacySettingItems = mobxState<GroupBtnsType[]>([])("privacySettingItems");

	// PROFILE PAGE

	showRightProfile = (tag?: string) => {
		const { getUserAction } = profileActionsStore;

		runInAction(() => {
			if (!tag) {
				this.setUserToShow(this.profile);
				return;
			}

			if (tag !== this.profile?.tag) {
				this.setUserToShow(null);
				getUserAction(tag);
				return;
			}

			this.setUserToShow(this.profile);
		});
	};

}

export const profileStore = new ProfileStore();