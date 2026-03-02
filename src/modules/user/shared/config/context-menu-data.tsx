import { ContextMenuItem, PremiumIconUi } from '@core/ui';
import { SettingsIcon } from '@icons/MainPage/Sidebar/SettingsIcon';
import { navigate } from '@lib/navigation';
import i18next from 'i18next';
import { Dispatch, SetStateAction } from 'react';
import { themeStore } from 'src/modules/theme/stores';
import { User, profileStore } from 'src/modules/user/stores/profile';
import { subscriptionInteractionsStore } from 'src/modules/user/stores/subscription';

// SUBSCRIPTION

export const getPremiumContextMenuItems = (
	setPremiumContextMenuOpen: Dispatch<SetStateAction<boolean>>,
	profileToShow: User
) => {
	const { profile } = profileStore;
	const {
		premiumModalOpen: { setPremiumModalOpen },
	} = subscriptionInteractionsStore;

	const isYou = profileToShow?.id == profile?.id;
	const label = isYou ? i18next.t("contextMenu_your_subscription") : `${profileToShow.name} ${i18next.t('contextMenu_subscription')}`;

	const premiumContextMenuItems: ContextMenuItem[] = [
		{
			id: 1,
			label,
			jsxIcon: <PremiumIconUi isPremium />,
			callback: () => {
				setPremiumContextMenuOpen(false);
				setPremiumModalOpen(true);
			},
		},
	];

	if (isYou) {
		premiumContextMenuItems.push({
			id: 2,
			label: i18next.t("context_menu_subscription_settings"),
			jsxIcon: <SettingsIcon color={themeStore.currentTheme.text_100} size={20} />,
			callback: () => navigate("SubscriptionSettings"),
			textColor: themeStore.currentTheme.text_100,
		});
	} else {
		premiumContextMenuItems.push({
			id: 2,
			label: i18next.t("context_menu_subscription_buy"),
			jsxIcon: <SettingsIcon color={themeStore.currentTheme.text_100} size={18} />,
			callback: () => navigate("SubscriptionSettings"),
			textColor: themeStore.currentTheme.text_100
		});
	}

	return premiumContextMenuItems;
};

