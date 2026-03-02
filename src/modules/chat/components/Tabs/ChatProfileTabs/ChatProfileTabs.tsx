import { RootStackParamList } from '@app/router';
import { getIconColor } from '@core/config/const';
import { AnimatedTabs } from '@core/ui';
import { RouteProp, useRoute } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { chatsInteractionsStore } from 'src/modules/chat/stores/chats';
import { themeStore } from 'src/modules/theme/stores';
import { ChatProfileFavTab } from './pages/ChatProfileFavTab';
import { ChatProfileGroupsTab } from './pages/ChatProfileGroupsTab';
import { ChatProfileLinkTab } from './pages/ChatProfileLinkTab';
import { ChatProfileMediaTab } from './pages/ChatProfileMediaTab';
import { ChatProfileMembersTab } from './pages/ChatProfileMembersTab';
import { ChatProfileVoiceTab } from './pages/ChatProfileVoiceTab';

interface ChatProfileTabsProps {
	scrollY?: SharedValue<number>;
}

export const ChatProfileTabs = observer(({ scrollY }: ChatProfileTabsProps) => {
	const { currentTheme } = themeStore;
	const {
		chatProfileTab: { chatProfileTab, setChatProfileTab },
		tabScrollPosition: { tabScrollPosition, setTabScrollPosition },
		handleSwap
	} = chatsInteractionsStore;

	const { t } = useTranslation();
	const { params } = useRoute<RouteProp<RootStackParamList, "ChatProfile">>();

	const getTabs = () => {
		const tabs = [
			{ content: ChatProfileMediaTab, text: t("chat_profile_tab_media") },
			{ content: ChatProfileFavTab, text: t("chat_profile_tab_fav") },
			{ content: ChatProfileLinkTab, text: t("chat_profile_tab_link") },
			{ content: ChatProfileVoiceTab, text: t("chat_profile_tab_voice") },
			{ content: ChatProfileGroupsTab, text: t("chat_profile_tab_groups") },
			// { content: ChatProfileFileTab, text: t("chat_profile_tab_file") },
			// { content: ChatProfileMusicTab, text: t("chat_profile_tab_music") },
			// { content: ChatProfileGifTab, text: "GIF" },
		];

		if (params?.selectedChat?.type === "GROUP") {
			tabs.unshift({ content: ChatProfileMembersTab, text: t("chat_profile_tab_members") });
		}

		return tabs;
	};

	const tabs = useMemo(() => getTabs(), [params.selectedChat]);

	return (
		<AnimatedTabs
			tabs={tabs}
			tabStyle={{ paddingVertical: 12 }}
			pagesStyle={{ backgroundColor: currentTheme.bg_100 }}
			activeTab={chatProfileTab}
			setActiveTab={setChatProfileTab}
			scrollPosition={tabScrollPosition}
			setScrollPosition={setTabScrollPosition}
			bouncing={true}
			containerStyle={s.container}
			getIconColor={getIconColor}
			onSwap={handleSwap}
			useParentScroll={true}
			scrollY={scrollY}
		/>
	);
});

const s = StyleSheet.create({
	container: {
		marginTop: 0,
		marginBottom: 20,
		flex: 1,
	},
});