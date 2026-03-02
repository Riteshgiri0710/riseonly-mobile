import appImg from "@images/AppLogo.png";
import errorrImg from "@images/ErrorImg.png";
import infoImg from "@images/InfoImg.png";
import successImg from "@images/SuccessImg.png";
import warningImg from "@images/WarningImg.png";
import { Notifier } from '@lib/notifier';
import i18next from 'i18next';
import { makeAutoObservable } from 'mobx';
import { mobxState, MobxUpdateInstance } from 'mobx-toolbox';
import { MutableRefObject } from 'react';
import { ImageSourcePropType } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';
import { Notify, NotifyData, NotifyType } from '../types';

class NotifyInteractionsStore {
	constructor() {
		makeAutoObservable(this);
	}

	// NOTIFY

	showNotify = (type: NotifyType, notifyData: NotifyData) => {
		const { currentTheme } = themeStore;

		const titleByType = {
			success: i18next.t("notify_success_title"),
			error: i18next.t("notify_error_title"),
			warning: i18next.t("notify_warning_title"),
			info: i18next.t("notify_info_title"),
			system: "Riseonly"
		};

		const imageByType = {
			success: successImg,
			error: errorrImg,
			warning: warningImg,
			info: infoImg,
			system: appImg
		};

		Notifier.showNotification({
			title: notifyData?.title || titleByType[type],
			description: notifyData?.message || `[DEV]: You doesnt provide message\ntype: ${type}\ntitle: ${notifyData?.title}`,
			duration: notifyData?.duration || 5000,
			position: notifyData?.position || "top",
			offset: notifyData?.offset || 0,
			onHidden: notifyData?.onHidden,
			onPress: notifyData?.onPress,
			hideOnPress: notifyData?.hideOnPress,
			componentProps: {
				imageSource: imageByType[type] as ImageSourcePropType,
				containerStyle: {
					backgroundColor: currentTheme.bg_300,
					borderWidth: 0.3,
					borderColor: currentTheme.border_200,
				},
				titleStyle: {
					color: currentTheme.text_100
				},
				descriptionStyle: {
					color: currentTheme.text_100
				}
			},
		});
	};

	// NOTIFICATIONS TABS

	activeTab = mobxState(0)("activeTab");
	scrollPosition = mobxState(0)("scrollPosition");
	scrollViewRef = mobxState<MutableRefObject<null> | null>(null)("scrollViewRef");
	openedPage = mobxState(0)("openedPage");

	// UPDATERS

	notificationUpdater: MobxUpdateInstance<Notify> | null = null;
	setNotificationUpdater = (updater: MobxUpdateInstance<Notify>) => this.notificationUpdater = updater;

	// REFRESH

	refreshing = mobxState(false)("refreshing");

}

export const notifyInteractionsStore = new NotifyInteractionsStore();