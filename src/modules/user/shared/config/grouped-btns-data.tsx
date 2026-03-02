import { appName, getCurrentPrivacyStatus, getSessionDevice, getSessionLocation, todoNotify } from '@config/const';
import { formatSubscriptionPrice, getMonthsFromProductId, getSubscriptionData, getSubscriptionPeriodLabel, getSubscriptionPeriodPrice, memoryUsageColors } from '@config/ts';
import { getPrivacySettingsIcon, getSelectedLanguageSettingsIcon, getSessionIcon } from '@config/tsx';
import { GroupBtnsType, ViewPrivacyT } from '@config/types';
import { Box, CheckboxUi, LoaderUi, MainText, SecondaryText } from '@core/ui';
import { Ionicons } from '@expo/vector-icons';
import { LanguageIcon } from '@icons/MainPage/Settings/LanguageIcon';
import { MemorySettingsIcon } from '@icons/MainPage/Settings/MemorySettingsIcon';
import { ModerationSettingsIcon } from '@icons/MainPage/Settings/ModerationSettingsIcon';
import { NotificationSettingsIcon } from '@icons/MainPage/Settings/NotificationSettingsIcon';
import { PrivacySettingsIcon } from '@icons/MainPage/Settings/PrivacySettingsIcon';
import { ProfileSettingsIcon } from '@icons/MainPage/Settings/ProfileSettingsIcon';
import { SessionsSettingsIcon } from '@icons/MainPage/Settings/SessionsSettingsIcon';
import { AppereanceColoredIcon } from '@icons/Ui/AppereanceColoredIcon';
import { ArrowRightIcon } from '@icons/Ui/ArrowRightIcon';
import { CustomizationColoredIcon } from '@icons/Ui/CustomizationColoredIcon';
import { LogoColoredIcon } from '@icons/Ui/LogoColoredIcon';
import { addToEveryItemInArray } from '@lib/arr';
import { navigate } from '@lib/navigation';
import { formatBytes, formatPercent } from '@lib/text';
import { filledIconGroupedBtnsSize } from '@lib/theme';
import { MemoryUsageStats, memoryStore } from '@stores/memory';
import i18n from 'i18n';
import i18next, { TFunction } from 'i18next';
import { mobxDebouncer } from "mobx-toolbox";
import { authServiceStore } from 'src/modules/auth/stores';
import { GetSessionsResponse, sessionActionsStore, sessionInteractionsStore, sessionServiceStore } from 'src/modules/session/stores';
import { themeStore } from 'src/modules/theme/stores';
import { GetPrivacySettingsResponse, profileActionsStore, profileStore } from 'src/modules/user/stores/profile';
import { subscriptionInteractionsStore } from 'src/modules/user/stores/subscription';

const LEFT_ICON_HEIGHT = 13;
const LEFT_ICON_WIDTH = 15;
const LEFT_ICON_COLOR = themeStore.currentTheme.secondary_100;

const leftIcon = <ArrowRightIcon height={LEFT_ICON_HEIGHT} width={LEFT_ICON_WIDTH} color={LEFT_ICON_COLOR} />;

// ALL SETTINGS LIST

export const getSettingsBtns = (): GroupBtnsType[] => {
	const height = themeStore.groupedBtnsHeight;

	const settingsButtons: GroupBtnsType[] = [
		// ACCOUNT
		{
			group: "account",
			text: i18next.t("settings_profile_title"),
			url: 'ProfileSettings',
			icon: <ProfileSettingsIcon size={filledIconGroupedBtnsSize} />,
			leftIcon,
			height
		},
		{
			group: "account",
			text: i18next.t("settings_privacy_title"),
			url: 'PrivacySettings',
			icon: <PrivacySettingsIcon size={filledIconGroupedBtnsSize} />,
			leftIcon,
			height
		},
		{
			group: "account",
			text: i18next.t("settings_sessions_title"),
			url: 'SessionsSettings',
			icon: <SessionsSettingsIcon size={filledIconGroupedBtnsSize} />,
			leftIcon,
			height
		},
		{
			group: "account",
			text: i18next.t("settings_goals_plans_title"),
			url: 'GoalsPlansSettings',
			icon: <NotificationSettingsIcon size={filledIconGroupedBtnsSize} />,
			leftIcon,
			height
		},
		{
			group: "account",
			text: i18next.t("settings_notify_title"),
			url: 'NotificationsSettings',
			icon: <NotificationSettingsIcon size={filledIconGroupedBtnsSize} />,
			leftIcon,
			height
		},

		// SUBSCRIPTION
		{
			group: "subscription",
			text: i18next.t("settings_subscription_title"),
			url: 'SubscriptionSettings',
			icon: <AppereanceColoredIcon size={filledIconGroupedBtnsSize} />,
			leftIcon,
			height
		},
		{
			group: "subscription",
			text: i18next.t("settings_customization_title"),
			url: 'CustomizationSettings',
			icon: <CustomizationColoredIcon size={filledIconGroupedBtnsSize} />,
			leftIcon,
			height
		},

		// APP
		{
			group: "app",
			text: i18next.t("settings_memory_title"),
			url: 'MemorySettings',
			icon: <MemorySettingsIcon size={filledIconGroupedBtnsSize} />,
			leftIcon,
			height
		},
		{
			group: "app",
			text: i18next.t("settings_moderations_title"),
			url: 'ModerationSettings',
			icon: <ModerationSettingsIcon size={filledIconGroupedBtnsSize} />,
			leftIcon,
			height
		},
		{
			group: "app",
			text: i18next.t("settings_language_title"),
			url: 'LanguageSettings',
			icon: <LanguageIcon size={filledIconGroupedBtnsSize} />,
			leftIcon,
			height
		},

		// LOUGOUT
		{
			group: "logout",
			text: i18next.t("settings_logout_title"),
			textColor: themeStore.currentTheme.error_100,
			callback: () => {
				authServiceStore.fullClear();
			},
			height
		},
	];

	return settingsButtons;
};

// PRIVACY SETTINGS

export const getPrivacySettingsBtns = (privacy: GetPrivacySettingsResponse, t: TFunction): GroupBtnsType[] => {
	const height = themeStore.groupedBtnsHeight;

	const callback = (currentPrivacy: GroupBtnsType, t: TFunction) => {
		profileStore.selectedPrivacy.setSelectedPrivacy(currentPrivacy);
		navigate("PrivacySetting");
	};

	const settingsButtons: GroupBtnsType[] = [
		// PROFILE 
		{
			groupTitle: i18next.t("settings_profile_title"), // PHONE
			group: "profile",
			height,
			text: i18next.t("privacy_settings_phonenumber"),
			leftText: getCurrentPrivacyStatus(privacy.phone_rule),
			callback,
			field: "phone_rule",
			leftIcon,
		},
		{
			groupTitle: i18next.t("settings_profile_title"), // AVATAR
			group: "profile",
			height,
			text: i18next.t("privacy_settings_avatar"),
			leftText: getCurrentPrivacyStatus(privacy.profile_photo_rule),
			field: "profile_photo_rule",
			callback,
			leftIcon,
		},
		{
			groupTitle: i18next.t("settings_profile_title"), // DESCRIPTION
			group: "profile",
			height,
			text: i18next.t("privacy_settings_description"),
			leftText: getCurrentPrivacyStatus(privacy.description_rule),
			callback,
			field: "description_rule",
			leftIcon,
		},
		{
			groupTitle: i18next.t("settings_profile_title"), // HB
			group: "profile",
			height,
			text: i18next.t("privacy_settings_hb"),
			leftText: getCurrentPrivacyStatus(privacy.hb_rule),
			callback,
			field: "hb_rule",
			leftIcon,
		},
		{
			groupTitle: i18next.t("settings_profile_title"), // FRIEND LIST
			group: "profile",
			height,
			text: i18next.t("privacy_settings_friends"),
			leftText: getCurrentPrivacyStatus(privacy.friend_rule),
			callback,
			field: "friend_rule",
			leftIcon,
		},
		{
			groupTitle: i18next.t("settings_profile_title"), // PLAN
			group: "profile",
			height,
			text: i18next.t("privacy_settings_plans"),
			leftText: getCurrentPrivacyStatus(privacy.plan_rule),
			callback,
			field: "plan_rule",
			leftIcon,
		},
		{
			groupTitle: i18next.t("settings_profile_title"), // GOALS
			group: "profile",
			height,
			text: i18next.t("privacy_settings_goals"),
			leftText: getCurrentPrivacyStatus(privacy.goal_rule),
			callback,
			field: "goal_rule",
			leftIcon,
		},

		// CHATS
		{
			groupTitle: i18next.t("chats_title"), // MESSAGES
			group: "chats",
			height,
			text: i18next.t("privacy_settings_messages"),
			leftText: getCurrentPrivacyStatus("ALL"),
			callback: (currentPrivacy: GroupBtnsType) => {
				todoNotify();
			},
			leftIcon,
		},
		{
			groupTitle: i18next.t("chats_title"), // LAST SEEN
			group: "chats",
			height,
			text: i18next.t("privacy_settings_lastseen"),
			leftText: getCurrentPrivacyStatus(privacy.last_seen_rule),
			field: "Lastseen_rule",
			callback,
			leftIcon,
		},
		{
			groupTitle: i18next.t("chats_title"), // IN CHAT REALTIME
			group: "chats",
			height,
			text: i18next.t("privacy_settings_inchat"),
			leftText: getCurrentPrivacyStatus("ALL"),
			callback: (currentPrivacy: GroupBtnsType) => {
				todoNotify();
			},
			leftIcon,
		},
	];

	const res = settingsButtons.map((item, index) => ({ ...item, id: index }));

	return res;
};

export const getPrivacySettingsStatuses = (tKey: string = "", mode: "default" | "todo" = 'default', t: TFunction) => {
	const height = themeStore.groupedBtnsHeight;

	const onClickHandler = (item: GroupBtnsType) => {
		if (mode == "todo") {
			todoNotify();
			return [];
		}

		const currentPrivacy = profileStore.selectedPrivacy.selectedPrivacy;
		const privacy = profileActionsStore.privacy?.data;

		if (!currentPrivacy?.field || !currentPrivacy || !privacy || !item.actionKey) return;

		const currentStatus = privacy[currentPrivacy.field as keyof GetPrivacySettingsResponse];
		if (item.actionKey == currentStatus) return;

		if (!profileStore.selectedPrivacy.selectedPrivacy) return;

		// @ts-ignore игнорим эт норм
		profileActionsStore.privacy!.data![currentPrivacy.field as keyof GetPrivacySettingsResponse] = item.actionKey.toUpperCase();
		if (!profileActionsStore.privacy.data) return;
		profileStore.privacySettingsItems.setPrivacySettingsItems(getPrivacySettingsBtns(profileActionsStore.privacy!.data, t));

		mobxDebouncer.debouncedAction(
			"privacy-settings-statuses",
			() => profileActionsStore.editProfilePrivacyAction(item),
			3000
		);
	};

	function leftIconFn(this: GroupBtnsType) {
		return getPrivacySettingsIcon(this.actionKey!.toUpperCase() as ViewPrivacyT);
	}

	const tFunc = (t != undefined) ? t : i18n.t;

	const settingsButtons: GroupBtnsType[] = [
		{
			groupTitle: tFunc(tKey), // ALL
			group: "status",
			height,
			text: t("privacy_all_status"),
			callback: (item: GroupBtnsType) => onClickHandler(item),
			actionKey: "All",
			leftIcon: leftIconFn,
		},
		{
			groupTitle: tFunc(tKey), // NONE
			group: "status",
			height,
			text: t("privacy_none_status"),
			callback: (item: GroupBtnsType) => onClickHandler(item),
			actionKey: "None",
			leftIcon: leftIconFn,
		},
		{
			groupTitle: tFunc(tKey), // NONE
			group: "status",
			height,
			text: t("privacy_contacts_status"),
			callback: (item: GroupBtnsType) => onClickHandler(item),
			actionKey: "Contacts",
			leftIcon: leftIconFn,
		},
		{
			groupTitle: tFunc(tKey), // FRIENDS
			group: "status",
			height,
			text: t("privacy_friends_status"),
			callback: (item: GroupBtnsType) => onClickHandler(item),
			actionKey: "Friends",
			leftIcon: leftIconFn,
		},
	];

	return settingsButtons;
};

export const getPhoneNumberPrivacySettingsBtns = (t: TFunction) => {
	const statuses = getPrivacySettingsStatuses("phonenumber_privacy_settings_group_btns_title", "default", t);

	const settingsButtons: GroupBtnsType[] = [
		...statuses
	];

	return settingsButtons;
};

export const getHbPrivacySettingsBtns = (t: TFunction) => {
	const statuses = getPrivacySettingsStatuses("hb_privacy_settings_group_btns_title", "default", t);

	const settingsButtons: GroupBtnsType[] = [
		...statuses
	];

	return settingsButtons;
};

export const getDescriptionPrivacySettingsBtns = (t: TFunction) => {
	const statuses = getPrivacySettingsStatuses("description_privacy_settings_group_btns_title", "default", t);

	const settingsButtons: GroupBtnsType[] = [
		...statuses
	];

	return settingsButtons;
};

export const getPlansPrivacySettingsBtns = (t: TFunction) => {
	const statuses = getPrivacySettingsStatuses("plans_privacy_settings_group_btns_title", "default", t);

	const settingsButtons: GroupBtnsType[] = [
		...statuses
	];

	return settingsButtons;
};

export const getGoalsPrivacySettingsBtns = (t: TFunction) => {
	const statuses = getPrivacySettingsStatuses("goals_privacy_settings_group_btns_title", "default", t);

	const settingsButtons: GroupBtnsType[] = [
		...statuses
	];

	return settingsButtons;
};

export const getFriendsPrivacySettingsBtns = (t: TFunction) => {
	const statuses = getPrivacySettingsStatuses("friends_privacy_settings_group_btns_title", "default", t);

	const settingsButtons: GroupBtnsType[] = [
		...statuses
	];

	return settingsButtons;
};

export const getLastSeenSettingsBtns = (t: TFunction) => {
	const statuses = getPrivacySettingsStatuses("last_seen_privacy_settings_group_btns_title", "default", t);

	const settingsButtons: GroupBtnsType[] = [
		...statuses
	];

	return settingsButtons;
};

export const getProfilePhotoSettingsBtns = (t: TFunction) => {
	const statuses = getPrivacySettingsStatuses("profile_photo_privacy_settings_group_btns_title", "default", t);

	const settingsButtons: GroupBtnsType[] = [
		...statuses
	];

	return settingsButtons;
};

export const getCurrentPrivacySettingBtns = (t: TFunction): GroupBtnsType[] => {
	const funcObj = {
		"phoneRule": getPhoneNumberPrivacySettingsBtns,
		"hbRule": getHbPrivacySettingsBtns,
		"descriptionRule": getDescriptionPrivacySettingsBtns,
		"goalRule": getGoalsPrivacySettingsBtns,
		"planRule": getPlansPrivacySettingsBtns,
		"friendRule": getFriendsPrivacySettingsBtns,
		"lastSeenRule": getLastSeenSettingsBtns,
		"profile_photo_rule": getProfilePhotoSettingsBtns
	};

	const selectedPrivacy = profileStore.selectedPrivacy.selectedPrivacy;
	if (!selectedPrivacy?.field) return [];

	return (funcObj as any)[selectedPrivacy.field]?.() || getPrivacySettingsStatuses("", "todo", t);
};

// SESSION SETTINGS

export const getSessionInfoBtns = (t: TFunction, session: GetSessionsResponse) => {
	const height = themeStore.groupedBtnsHeight;

	const settingsButtons: GroupBtnsType[] = [
		{
			group: "info",
			text: t("session_info_device"),
			height,
			leftText: getSessionDevice(session.device_info)
		},
		{
			group: "info",
			text: t("session_info_location"),
			height,
			leftText: getSessionLocation(session.location)
		}
	];

	return settingsButtons;
};

export const getSessionSettings = (list: GetSessionsResponse[], t: TFunction) => {
	const {
		deleteSessionAction
	} = sessionActionsStore;
	const {
		sessionSheet: { setSessionSheet },
		selectedSession: { setSelectedSession }
	} = sessionInteractionsStore;
	const {
		sessionIsAllDelete: { setSessionIsAllDelete }
	} = sessionServiceStore;

	const height = "auto";

	const callback = (session: GetSessionsResponse) => {
		setSessionSheet(true);
		setSelectedSession(session);
	};

	const res = list.map((item, index) => {
		const groupBtns: GroupBtnsType = {
			group: index == 0 ? "first" : "second",
			height,
			btnRightPaddingVertical: 5,
			btnRightMainTextPx: 14,
			btn: index == 0 ? {
				btnText: t("sessions_settings_delete_other_sessions"),
				btnCallback: () => {
					setSessionIsAllDelete(true);
					deleteSessionAction();
				},
				btnColor: themeStore.currentTheme.error_100 as string,
				btnIcon: sessionActionsStore?.deleteSession?.status === "pending" ? (
					<LoaderUi
						color={themeStore.currentTheme.error_100}
						size={"small"}
					/>
				) : (
					<Ionicons
						name="trash-outline"
						size={19}
						color={themeStore.currentTheme.error_100}
					/>
				)
			} : undefined,
			btnDisabled: list.length == 1,
			text: getSessionDevice(item.device_info),
			pretitle: `${appName} Mobile`,
			subtitle: `${getSessionLocation(item.location)} | `,
			subtitleRealTimeDate: item.last_accessed_at,
			icon: getSessionIcon(item.device_info, 28),
			callback: () => callback(item)
		};
		if (index == 0) {
			groupBtns.groupTitle = t("sessions_settings_current_session");
			groupBtns.endGroupTitle = t("sessions_settings_end_other_sessions");
		}
		else groupBtns.groupTitle = t("sessions_settings_other_sessions");
		return groupBtns;
	});
	return res;
};

// LANGUAGE SETTINGS

export const getLanguageSettingsBtns = (t: TFunction, i18nInstance: any) => {
	const height = themeStore.groupedBtnsHeight;

	function leftIconFn(this: GroupBtnsType) {
		return getSelectedLanguageSettingsIcon(this.actionKey!.toLowerCase());
	}

	const onClickHandler = (item: GroupBtnsType) => {
		i18nInstance.changeLanguage(item.actionKey?.toLowerCase());
	};

	return [
		{
			groupTitle: t("language_settings_interface_lang"),
			group: "languages",
			height,
			text: t("ru"),
			callback: onClickHandler,
			leftIcon: leftIconFn,
			actionKey: "ru"
		},
		{
			groupTitle: t("language_settings_interface_lang"),
			group: "languages",
			height,
			text: t("en"),
			callback: onClickHandler,
			leftIcon: leftIconFn,
			actionKey: "en"
		},
	];
};

// MEMORY SETTINGS

export const getCachedDataBtns = (t: TFunction): GroupBtnsType[] => {
	const {
		selectedCachedData: { setSelectedCachedData },
	} = memoryStore;
	const height = themeStore.groupedBtnsHeight;

	const settingsButtons: GroupBtnsType[] = [
		{
			group: "cached_data",
			groupTitle: t("memory_settings_cached_data_title"),
			text: t("memory_settings_personal_chats"),
			callback: () => {
				setSelectedCachedData("personal_chats");
				navigate("CachedChats");
			},
			height
		},
		{
			group: "cached_data",
			text: t("memory_settings_groups"),
			callback: () => {
				setSelectedCachedData("groups");
				navigate("CachedDatas");
			},
			height
		},
		{
			group: "cached_data",
			text: t("memory_settings_profiles"),
			callback: () => {
				setSelectedCachedData("profiles");
				navigate("CachedDatas");
			},
			height
		}
	];

	return settingsButtons;
};

export const getMemoryUsageBtns = (t: TFunction, memoryUsage: MemoryUsageStats): GroupBtnsType[] => {
	const { whichCacheItem: { setWhichCacheItem } } = memoryStore;
	const height = themeStore.groupedBtnsHeight;

	const settingsButtons: GroupBtnsType[] = [
		{
			group: "memory_usage",
			text: t("memory_settings_videos"),
			leftIcon: (
				<Box align='flex-end'>
					<MainText px={15}>{formatBytes(memoryUsage.videos)}</MainText>
					<SecondaryText px={11}>{formatPercent(memoryUsage.videos / memoryUsage.total)}</SecondaryText>
				</Box>
			),
			callback: () => {
				setWhichCacheItem("CachedVideos");
				navigate("CachedMedia");
			},
			icon: <Box width={28} height={28} bgColor={memoryUsageColors.video} bRad={10} />,
			height
		},
		{
			group: "memory_usage",
			text: t("memory_settings_images"),
			leftIcon: (
				<Box align='flex-end'>
					<MainText px={15}>{formatBytes(memoryUsage.images)}</MainText>
					<SecondaryText px={11}>{formatPercent(memoryUsage.images / memoryUsage.total)}</SecondaryText>
				</Box>
			),
			callback: () => {
				setWhichCacheItem("CachedImages");
				navigate("CachedMedia");
			},
			icon: <Box width={28} height={28} bgColor={memoryUsageColors.image} bRad={10} />,
			height
		},
		{
			group: "memory_usage",
			text: t("memory_settings_photos"),
			leftIcon: (
				<Box align='flex-end'>
					<MainText px={15}>{formatBytes(memoryUsage.photos)}</MainText>
					<SecondaryText px={11}>{formatPercent(memoryUsage.photos / memoryUsage.total)}</SecondaryText>
				</Box>
			),
			callback: () => {
				setWhichCacheItem("CachedPhotos");
				navigate("CachedMedia");
			},
			icon: <Box width={28} height={28} bgColor={memoryUsageColors.photo} bRad={10} />,
			height
		},
		{
			group: "memory_usage",
			text: t("memory_settings_files"),
			leftIcon: (
				<Box align='flex-end'>
					<MainText px={15}>{formatBytes(memoryUsage.files)}</MainText>
					<SecondaryText px={11}>{formatPercent(memoryUsage.files / memoryUsage.total)}</SecondaryText>
				</Box>
			),
			callback: () => {
				setWhichCacheItem("CachedFiles");
				navigate("CachedMedia");
			},
			icon: <Box width={28} height={28} bgColor={memoryUsageColors.file} bRad={10} />,
			height
		},
		{
			group: "memory_usage",
			text: t("memory_settings_stories"),
			leftIcon: (
				<Box align='flex-end'>
					<MainText px={15}>{formatBytes(memoryUsage.stories)}</MainText>
					<SecondaryText px={11}>{formatPercent(memoryUsage.stories / memoryUsage.total)}</SecondaryText>
				</Box>
			),
			callback: () => {
				setWhichCacheItem("CachedStories");
				navigate("CachedMedia");
			},
			icon: <Box width={28} height={28} bgColor={memoryUsageColors.story} bRad={10} />,
			height
		},
		{
			group: "memory_usage",
			text: t("memory_settings_audio"),
			leftIcon: (
				<Box align='flex-end'>
					<MainText px={15}>{formatBytes(memoryUsage.audio)}</MainText>
					<SecondaryText px={11}>{formatPercent(memoryUsage.audio / memoryUsage.total)}</SecondaryText>
				</Box>
			),
			callback: () => {
				setWhichCacheItem("CachedAudio");
				navigate("CachedMedia");
			},
			icon: <Box width={28} height={28} bgColor={memoryUsageColors.audio} bRad={10} />,
			height
		},
		{
			group: "memory_usage",
			text: t("memory_settings_other"),
			leftIcon: (
				<Box align='flex-end'>
					<MainText px={15}>{formatBytes(memoryUsage.other)}</MainText>
					<SecondaryText px={11}>{formatPercent(memoryUsage.other / memoryUsage.total)}</SecondaryText>
				</Box>
			),
			callback: () => {
				setWhichCacheItem("CachedOther");
				navigate("CachedMedia");
			},
			icon: <Box width={28} height={28} bgColor={memoryUsageColors.other} bRad={10} />,
			height
		}
	];

	return settingsButtons;
};

export const getMemorySettingsBtns = (t: TFunction): GroupBtnsType[] => {
	const height = themeStore.groupedBtnsHeight;

	const settingsButtons: GroupBtnsType[] = [
		{
			group: "auto_delete",
			groupTitle: t("memory_settings_auto_delete_title"),
			text: t("memory_settings_personal_chats"),
			url: 'PersonalChatsAutoDeleteSettings',
			leftIcon: <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondary_100} />,
			height
		},
		{
			group: "auto_delete",
			text: t("memory_settings_groups"),
			url: 'GroupsAutoDeleteSettings',
			leftIcon: <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondary_100} />,
			height
		},
	];

	return settingsButtons;
};

// AUTO DELETE SETTINGS
export const getAutoDeleteSettingsBtns = (t: TFunction, currentValue: string, settingType: 'personalChats' | 'groups'): GroupBtnsType[] => {
	const height = themeStore.groupedBtnsHeight;

	const onClickHandler = (value: string) => {
		if (settingType === 'personalChats') {
			memoryStore.setPersonalChatsAutoDelete(value);
		} else {
			memoryStore.setGroupsAutoDelete(value);
		}
	};

	const settingsButtons: GroupBtnsType[] = [
		{
			group: "auto_delete",
			text: t("memory_settings_auto_delete_never"),
			callback: () => onClickHandler('never'),
			leftIcon: currentValue === 'never' ? (
				<Ionicons name="checkmark" size={20} color={themeStore.currentTheme.primary_100} />
			) : undefined,
			height
		},
		{
			group: "auto_delete",
			text: t("memory_settings_auto_delete_1_week"),
			callback: () => onClickHandler('1_week'),
			leftIcon: currentValue === '1_week' ? (
				<Ionicons name="checkmark" size={20} color={themeStore.currentTheme.primary_100} />
			) : undefined,
			height
		},
		{
			group: "auto_delete",
			text: t("memory_settings_auto_delete_1_month"),
			callback: () => onClickHandler('1_month'),
			leftIcon: currentValue === '1_month' ? (
				<Ionicons name="checkmark" size={20} color={themeStore.currentTheme.primary_100} />
			) : undefined,
			height
		},
		{
			group: "auto_delete",
			text: t("memory_settings_auto_delete_3_months"),
			callback: () => onClickHandler('3_months'),
			leftIcon: currentValue === '3_months' ? (
				<Ionicons name="checkmark" size={20} color={themeStore.currentTheme.primary_100} />
			) : undefined,
			height
		},
	];

	return settingsButtons;
};

// SUBSCRIPTION

export const getPremiumFeaturesBtns = (t: TFunction): GroupBtnsType[] => {
	const settingsButtons: GroupBtnsType[] = [
		{
			groupTitle: t('subscription_features_title'),
			icon: <CustomizationColoredIcon />,
			text: t('subscription_feature_customization'),
			subtitle: t('subscription_feature_customization_desc'),
		},
		{
			icon: <AppereanceColoredIcon />,
			text: t('subscription_feature_speed'),
			subtitle: t('subscription_feature_speed_desc'),
		},
		{
			icon: <LogoColoredIcon />,
			text: t('subscription_feature_views'),
			subtitle: t('subscription_feature_views_desc'),
		},
		{
			icon: <CustomizationColoredIcon />,
			text: t('subscription_feature_storage'),
			subtitle: t('subscription_feature_storage_desc'),
		},
		{
			icon: <AppereanceColoredIcon />,
			text: t('subscription_feature_priority'),
			subtitle: t('subscription_feature_priority_desc'),
		},
		{
			icon: <LogoColoredIcon />,
			text: t('subscription_feature_privacy'),
			subtitle: t('subscription_feature_privacy_desc'),
		},
		{
			icon: <CustomizationColoredIcon />,
			text: t('subscription_feature_chats'),
			subtitle: t('subscription_feature_chats_desc'),
		},
		{
			icon: <AppereanceColoredIcon />,
			text: t('subscription_feature_badge'),
			subtitle: t('subscription_feature_badge_desc'),
		}
	];

	return addToEveryItemInArray(settingsButtons, {
		group: 'features',
		subtitleLines: "auto",
		btnRightPaddingVertical: 10,
		btnRightMainTextPx: 17,
		btnRightSubtitlePx: 13,
		btnLeftStyle: { alignItems: "flex-start" },
		leftIcon
	});
};

export const getSubscriptionPlansBtns = (cachedSubscriptions: any, t: TFunction): GroupBtnsType[] => {
	const { profile } = profileStore;
	const {
		selectedSubscription: { selectedSubscription, setSelectedSubscription }
	} = subscriptionInteractionsStore;

	const { sortedPlans, decimalSeparator, thousandSeparator, currency, cheapPlanHalfYearPrice, cheapPlanYearPrice, cheapPlanPriceNumber } = getSubscriptionData(cachedSubscriptions);

	const subscriptionPlans: GroupBtnsType[] = sortedPlans
		.map((sub: any, index: number) => {
			const months = getMonthsFromProductId(sub.productId);
			const localizedPrice = (sub as any).localizedPrice || '';
			const priceString = localizedPrice.replace(/[^0-9.,]/g, '');
			const priceNumber = parseFloat(
				priceString.replace(new RegExp('\\' + thousandSeparator, 'g'), '').replace(decimalSeparator, '.')
			);
			const pricePerMonth = !isNaN(priceNumber) ? (priceNumber / months).toFixed(0) : '';

			const currentSubscriptionPrice = (selectedSubscription as any)?.localizedPrice || '';
			const currentPriceString = currentSubscriptionPrice.replace(/[^0-9.,]/g, '');
			const currentSubscriptionPriceNumber = parseFloat(
				currentPriceString.replace(new RegExp('\\' + thousandSeparator, 'g'), '').replace(decimalSeparator, '.')
			);

			const btnDisabled = priceNumber < currentSubscriptionPriceNumber;

			return {
				groupTitle: t('subscription_plans_group_title'),
				group: 'subscription_plans',
				icon: (
					<CheckboxUi
						isChecked={selectedSubscription?.productId === sub.productId}
						nonInteractive
					/>
				),
				text: getSubscriptionPeriodLabel(months, t),
				leftText: pricePerMonth ? `${localizedPrice}/${getSubscriptionPeriodPrice(months, t)}` : '',
				callback: () => {
					setSelectedSubscription(prev => {
						return prev?.productId === sub.productId ? null : sub;
					});
				},
				subtitle: profile?.subscription_id === sub.productId ? (
					t('subscription_current_plan')
				) : (
					<SecondaryText
						px={13}
						numberOfLines={1}
					>
						{index !== 0 && (
							<>
								<SecondaryText
									px={13}
									numberOfLines={1}
									strikethrough
								>
									{formatSubscriptionPrice(
										cheapPlanPriceNumber * months === cheapPlanHalfYearPrice ? cheapPlanHalfYearPrice : cheapPlanYearPrice,
										thousandSeparator,
										decimalSeparator,
										currency
									)}
								</SecondaryText>
								{" "}
							</>
						)}
						<SecondaryText
							px={13}
							numberOfLines={1}
						>
							{localizedPrice}
						</SecondaryText>
					</SecondaryText>
				),
				btnRightGap: 4,
				btnRightPaddingVertical: 8,
				btnDisabled
			};
		});

	return subscriptionPlans;
};

