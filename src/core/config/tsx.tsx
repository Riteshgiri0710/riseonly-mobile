import { Box, MainText, PreviewBgUi, SimpleButtonUi } from '@core/ui';
import { Ionicons } from '@expo/vector-icons';
import { CallIcon } from '@icons/MainPage/Chats/CallIcon';
import { ChatIcon2 } from '@icons/MainPage/Chats/ChatIcon2';
import { MoreIcon } from '@icons/MainPage/Chats/MoreIcon';
import { NotifyIcon } from '@icons/MainPage/NavBar';
import { SearchIcon } from '@icons/MainPage/Posts/SearchIcon';
import { CreatePostIcon } from '@icons/MainPage/Profile/CreatePostIcon';
import { GoalsIcon } from '@icons/MainPage/Profile/GoalsIcon';
import { GridPostsIcon } from '@icons/MainPage/Profile/GridPostsIcon';
import { PlansIcon } from '@icons/MainPage/Profile/PlansIcon';
import { GoogleIcon } from '@icons/MainPage/Settings/GoogleIcon';
import { IPhoneIcon } from '@icons/MainPage/Settings/IPhoneIcon';
import { SafIcon } from '@icons/MainPage/Settings/SafIcon';
import { AboutusIcon, ChatIcon, CooperationIcon, LeaderboardIcon, NewsIcon, PostIcon, ReportIcon, UserIcon, VacancyIcon } from '@icons/MainPage/Sidebar';
import { AssemblerIcon } from '@icons/ProfileStatuses/Assembler';
import { CIcon } from '@icons/ProfileStatuses/C';
import { CPlusPlusIcon } from '@icons/ProfileStatuses/CPlusPlus';
import { CSharpIcon } from '@icons/ProfileStatuses/CSharp';
import { DartIcon } from '@icons/ProfileStatuses/Dart';
import { GolangIcon } from '@icons/ProfileStatuses/Golang';
import { JavaIcon } from '@icons/ProfileStatuses/Java';
import { JsIcon } from '@icons/ProfileStatuses/JsIcon';
import { KotlinIcon } from '@icons/ProfileStatuses/Kotlin';
import { LuaIcon } from '@icons/ProfileStatuses/Lua';
import { PascalIcon } from '@icons/ProfileStatuses/Pascal';
import { PerlIcon } from '@icons/ProfileStatuses/Perl';
import { PhpIcon } from '@icons/ProfileStatuses/Php';
import { PythonIcon } from '@icons/ProfileStatuses/Python';
import { RubyIcon } from '@icons/ProfileStatuses/Ruby';
import { RustIcon } from '@icons/ProfileStatuses/Rust';
import { SwiftIcon } from '@icons/ProfileStatuses/Swift';
import { TsIcon } from '@icons/ProfileStatuses/TsIcon';
import { EditIcon } from '@icons/Ui/EditIcon';
import { ShareIcon } from '@icons/Ui/ShareIcon';
import { checker } from '@lib/helpers';
import { getCurrentRoute, navigate } from '@lib/navigation';
import { pxNative } from '@lib/theme';
import i18n from 'i18n';
import { TFunction } from 'i18next';
import { observer } from 'mobx-react-lite';
import React, { ReactNode } from 'react';
import { ChatInfo, chatsInteractionsStore } from 'src/modules/chat/stores/chats';
import { themeStore } from 'src/modules/theme/stores';
import { GetPrivacySettingsResponse, Profile, User, profileActionsStore, profileStore } from 'src/modules/user/stores/profile';
import { todoNotify } from './const';
import { NavBtnType, ProfileBtnsT, ViewPrivacyT } from './types';

export const getNavBtns = (type: 'mobile' | 'pc' = 'pc', size: number = 20, currentRouteProps: string): NavBtnType[] => {
	const url = currentRouteProps;
	const currentRoute = getCurrentRoute();

	const params = currentRoute?.params as any || {};

	const mainColor = themeStore.currentTheme.primary_100;
	const secondaryColor = themeStore.currentTheme.secondary_100;

	const isProfileRoute = url === 'Profile' ||
		(url === 'MainTabs' && params?.screen === 'Profile');
	const profileTag = profileStore?.profile?.tag || '';

	const pcArr = [
		{ text: "navbtn_posts", to: 'Posts', allowUrls: [], icon: <PostIcon size={size} color={url === 'Posts' ? mainColor : secondaryColor} /> },
		{ text: "navbtn_profile", to: "Profile", params: { tag: profileTag }, allowUrls: [], icon: <UserIcon size={size} color={isProfileRoute ? mainColor : secondaryColor} /> },
		{ text: "navbtn_chats", to: 'Chats', allowUrls: [], icon: <ChatIcon size={size} color={url === 'Chats' ? mainColor : secondaryColor} /> },
		{ text: "navbtn_news", to: 'News', allowUrls: [], icon: <NewsIcon size={size} color={url === 'News' ? mainColor : secondaryColor} /> },
		{ text: "navbtn_vacancy", to: 'Vacancy', allowUrls: [], icon: <VacancyIcon size={size} color={url === 'Vacancy' ? mainColor : secondaryColor} /> },
		{ text: "navbtn_leaderboard", to: 'Leaderboard', allowUrls: [], icon: <LeaderboardIcon size={size} color={url === 'Leaderboard' ? mainColor : secondaryColor} /> },
		{ text: "navbtn_aboutus", to: 'AboutUs', allowUrls: [], icon: <AboutusIcon size={size} color={url === 'AboutUs' ? mainColor : secondaryColor} /> },
		{ text: "navbtn_cooperation", to: 'Cooperation', allowUrls: [], icon: <CooperationIcon size={size} color={url === 'Cooperation' ? mainColor : secondaryColor} /> },
	];

	const mobileArr = [
		{ text: "navbtn_posts", to: 'Posts', allowUrls: [], icon: <PostIcon size={size} color={url === 'Posts' ? mainColor : secondaryColor} /> },
		{ text: "navbtn_vacancy", to: 'Vacancy', allowUrls: [], icon: <VacancyIcon size={size} color={url === 'Vacancy' ? mainColor : secondaryColor} /> },
		{ text: "navbtn_chats", to: 'Chats', allowUrls: [], icon: <ChatIcon size={size} color={url === 'Chats' ? mainColor : secondaryColor} /> },
		{ text: "navbtn_search", to: 'GlobalSearch', allowUrls: [], icon: <SearchIcon size={size} color={url === 'GlobalSearch' ? mainColor : secondaryColor} /> },
		// { text: "Уведомления", to: 'Notifications', allowUrls: [], icon: <NotifyIcon size={size} color={url === 'Notifications' ? mainColor : secondaryColor} /> },
		{ text: "navbtn_profile", to: "Profile", params: { tag: profileTag }, allowUrls: [], icon: <UserIcon size={size} color={isProfileRoute ? mainColor : secondaryColor} /> },
		// { text: "Новости", to: "News", allowUrls: [], icon: <NewsIcon size={size} color={url === 'News' ? mainColor : secondaryColor} /> },
		// { text: "Таблица лидеров", to: 'Leaderboard', allowUrls: [], icon: <LeaderboardIcon size={size} color={url === 'Leaderboard' ? mainColor : secondaryColor} /> },
		// { text: "О нас", to: 'AboutUs', allowUrls: [], icon: <AboutusIcon size={size} color={url === 'AboutUs' ? mainColor : secondaryColor} /> },
		// { text: "Сотрудничество", to: 'Cooperation', allowUrls: [], icon: <CooperationIcon size={size} color={url === 'Cooperation' ? mainColor : secondaryColor} /> },
	];

	const role = profileStore?.profile?.role;

	if (role == 'ADMIN' || role == 'MODERATOR') {
		const reportsObj = { text: "navbtn_reports", to: 'Reports', allowUrls: [], icon: <ReportIcon size={size} color={url === 'Reports' ? mainColor : secondaryColor} /> };
		pcArr.push(reportsObj);
		mobileArr.push(reportsObj);
	}

	if (type == 'pc') return pcArr;

	return mobileArr;
};

export const interpolateColor = (color1: string, color2: string, factor: number) => {
	const parseRgba = (rgbaColor: string) => {
		const match = rgbaColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
		if (match) {
			return {
				r: parseInt(match[1]),
				g: parseInt(match[2]),
				b: parseInt(match[3]),
				a: match[4] ? parseFloat(match[4]) : 1
			};
		}
		return null;
	};

	const parseHex = (hexColor: string) => {
		const hex = hexColor.replace('#', '');
		return {
			r: parseInt(hex.substring(0, 2), 16),
			g: parseInt(hex.substring(2, 4), 16),
			b: parseInt(hex.substring(4, 6), 16),
			a: 1
		};
	};

	const parseColor = (color: string) => {
		if (color.startsWith('rgba') || color.startsWith('rgb')) {
			return parseRgba(color) || { r: 255, g: 255, b: 255, a: 1 };
		}
		return parseHex(color);
	};

	const c1 = parseColor(color1);
	const c2 = parseColor(color2);

	const r = Math.round(c1.r + factor * (c2.r - c1.r));
	const g = Math.round(c1.g + factor * (c2.g - c1.g));
	const b = Math.round(c1.b + factor * (c2.b - c1.b));
	const a = c1.a + factor * (c2.a - c1.a);

	return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
};

export const getProfileTabs = (size: number = 20) => {
	const mainColor = themeStore.currentTheme.primary_100;
	const secondaryColor = themeStore.currentTheme.secondary_100;
	const currentTab = profileStore.profileTab.profileTab;

	const tabIcons = [
		<GridPostsIcon size={size} />,
		<PostIcon size={size} />,
		<GoalsIcon size={size} />,
		<PlansIcon size={size} />,
	];

	return [0, 1, 2, 3].map(tabIndex => {
		const distance = Math.abs(currentTab - tabIndex);

		const proximityFactor = Math.pow(0.5, distance);

		const iconColor = interpolateColor(secondaryColor as string, mainColor as string, proximityFactor);

		const icon = React.cloneElement(tabIcons[tabIndex], { color: iconColor });

		return { to: tabIndex, icon };
	});
};

// USER STATUSES

export const getProfileStatuses = (icon: string, size: number = 20) => {
	if (!icon) return null;
	const iconData: Record<string, ReactNode> = {
		"TypeScript": <TsIcon size={size} />,
		"JavaScript": <JsIcon size={size} />,
		"Ruby": <RubyIcon size={size} />,
		"Python": <PythonIcon size={size} />,
		"Golang": <GolangIcon size={size} />,
		"C++": <CPlusPlusIcon size={size} />,
		"C": <CIcon size={size} />,
		"C#": <CSharpIcon size={size} />,
		"Java": <JavaIcon size={size} />,
		"Swift": <SwiftIcon size={size} />,
		"Php": <PhpIcon size={size} />,
		"Rust": <RustIcon size={size} />,
		"Lua": <LuaIcon size={size} />,
		"Perl": <PerlIcon size={size} />,
		"Assembler": <AssemblerIcon size={size} />,
		"Pascal": <PascalIcon size={size} />,
		"Dart": <DartIcon size={size} />,
		"Kotlin": <KotlinIcon size={size} />,

		"ts": <TsIcon size={size} />,
		"js": <JsIcon size={size} />,
		"rb": <RubyIcon size={size} />,
		"py": <PythonIcon size={size} />,
		"go": <GolangIcon size={size} />,
		"cpp": <CPlusPlusIcon size={size} />,
		"c": <CIcon size={size} />,
		"csharp": <CSharpIcon size={size} />,
		"java": <JavaIcon size={size} />,
		"swift": <SwiftIcon size={size} />,
		"php": <PhpIcon size={size} />,
		"rust": <RustIcon size={size} />,
		"lua": <LuaIcon size={size} />,
		"perl": <PerlIcon size={size} />,
		"assembler": <AssemblerIcon size={size} />,
		"pascal": <PascalIcon size={size} />,
		"dart": <DartIcon size={size} />,
		"kotlin": <KotlinIcon size={size} />
	};
	return iconData[icon];
};

export const getSessionIcon = (type: string, size: number = 22) => {
	const rules = [
		{ match: 'chrome', icon: <GoogleIcon size={size} /> },
		{ match: 'safari', icon: <SafIcon size={size} /> },
		{ match: 'iphone', icon: <IPhoneIcon size={size} /> },
	];

	const rule = rules?.find(r => type?.toLowerCase()?.includes(r?.match));
	if (rule) return rule.icon;

	return (
		<Box
			style={{
				width: size,
				height: size,
				backgroundColor: "rgb(49, 128, 255)",
			}}
			bRad={7.5}
			centered
		>
			<MainText>?</MainText>
		</Box>
	);
};

export const getPrivacySettingsIcon = (status: ViewPrivacyT) => {
	const currentPrivacySetting = profileActionsStore.privacy?.data;
	const currentPrivacy = profileStore.selectedPrivacy.selectedPrivacy;

	if (!currentPrivacy?.field || !currentPrivacy || !currentPrivacySetting) return;
	const currentStatus = currentPrivacySetting[currentPrivacy.field as keyof GetPrivacySettingsResponse];

	if (status == currentStatus) return (
		<Ionicons
			key={profileStore.selectedPrivacy.selectedPrivacy?.leftText as string}
			name="checkmark"
			size={20}
			color={themeStore.currentTheme.primary_100}
		/>
	);

	return <></>;
};

export const getSelectedLanguageSettingsIcon = (language: string) => {
	const currentLanguage = i18n.language;

	if (currentLanguage.toLowerCase() == language.toLowerCase()) return (
		<Ionicons
			key={profileStore.selectedPrivacy.selectedPrivacy?.leftText as string}
			name="checkmark"
			size={15}
			color={themeStore.currentTheme.primary_100}
		/>
	);

	return <></>;
};

export const getChatProfileBtns = (t: TFunction, chat?: ChatInfo) => {
	const { toChatHandler } = chatsInteractionsStore;

	checker(chat, "[getChatProfileBtns]: chat is not set");

	const res = [
		{
			text: t("chat_profile_chat"),
			callback: () => toChatHandler(chat),
			icon: <ChatIcon2 color={themeStore.currentTheme.primary_100} size={20} />
		},
		{ text: t("chat_profile_search"), callback: () => todoNotify(), icon: <SearchIcon color={themeStore.currentTheme.primary_100} size={20} /> },
		{ text: t("chat_profile_more"), callback: () => todoNotify(), icon: <MoreIcon color={themeStore.currentTheme.primary_100} height={20} width={20} /> },
	];

	if (chat?.type !== "FAVOURITES") {
		res.add(
			[
				{ text: t("chat_profile_phone"), callback: () => todoNotify(), icon: <CallIcon color={themeStore.currentTheme.primary_100} size={20} /> },
				{ text: t("chat_profile_notify"), callback: () => todoNotify(), icon: <NotifyIcon color={themeStore.currentTheme.primary_100} size={20} /> }
			],
			1
		);
	}

	return res;
};

// No E2E key exchange needed - server handles encryption at rest

export const getProfileBtns = (user: User | undefined | null, t: TFunction): ProfileBtnsT[] => {
	const { profile } = profileStore;

	const iconSize = 20;
	const iconColor = themeStore.currentTheme.text_100;

	if (!user) return [
		{
			text: t("error"),
			callback: () => console.log("error")
		}
	];

	const res: ProfileBtnsT[] = [];

	if (profile && (profile.id === user.id)) {
		res.push({
			text: t("share_profile_text"),
			icon: <ShareIcon color={iconColor} size={iconSize} />,
			callback: () => console.log("share")
		});
		res.push({
			text: t("edit_profile_text"),
			icon: <EditIcon color={iconColor} size={iconSize} />,
			callback: () => navigate("ProfileSettings")
		});
		res.push({
			text: "",
			icon: <CreatePostIcon color={iconColor} size={iconSize} />,
			callback: () => navigate("CreatePost")
		});
	} else {
		res.push({
			text: t("subscribe_profile_text"),
			icon: <EditIcon color={iconColor} size={iconSize} />,
			callback: () => console.log("sub")
		});
		res.push({
			text: t("share_profile_text"),
			icon: <EditIcon color={iconColor} size={iconSize} />,
			callback: () => console.log("share")
		});
		res.push({
			text: t("chat_profile_text"),
			icon: <ChatIcon2 color={iconColor} size={iconSize} />,
			callback: () => {
				navigate("Chat", {
					chatId: user.user_chat_id,
					previewUser: user
				});
			}
		});
	}

	return res;
};

export const getUserStats = (data: Profile | User | null | undefined) => {
	if (!data) return [];

	const res = [
		{ amount: data.posts_count, text: "публикации", callback: () => console.log("1") },
		{ amount: data.subscribers_count, text: "подписчики", callback: () => navigate("UserSubscribers", { userId: data.id }) },
		{ amount: data.subs_count, text: "подписок", callback: () => navigate("UserSubs", { userId: data.id }) },
		{ amount: data.friends_count, text: "друзей", callback: () => navigate("UserFriends", { userId: data.id }) }
	];

	return res;
};

export const CustomizationPreviewContent = observer(({ t, s }: { t: TFunction, s: any; }) => {
	const {
		selectedRoute: { selectedRoute },
		currentTheme
	} = themeStore;

	switch (selectedRoute) {
		case 'BgColorSettings':
			return (
				<PreviewBgUi
					paddingHorizontal={60}
					outerPaddingHorizontal={16}
					previewContentStyle={{ paddingVertical: 20 }}
					previewHeight={400}
					scrollEnabled={false}
				/>
			);
		case 'BtnColorSettings':
			return (
				<PreviewBgUi>
					<Box
						centered
						height={"100%"}
						width={"100%"}
					>
						<SimpleButtonUi
							bgColor={themeStore.currentTheme.btn_bg_300}
							bRad={5}
							style={s.btnpreview}
						>
							<MainText>
								{t("preview_btn_title")}
							</MainText>
						</SimpleButtonUi>
					</Box>
				</PreviewBgUi>
			);
		case 'BorderColorSettings':
			return (
				<PreviewBgUi
					paddingHorizontal={60}
					outerPaddingHorizontal={16}
					previewContentStyle={{ paddingVertical: 20 }}
					previewHeight={300}
					scrollEnabled={false}
				/>
			);
		case 'InputBgSettings':
			return (
				<PreviewBgUi>
					<Box
						centered
						height={"100%"}
						width={"100%"}
					>
						<SimpleButtonUi
							bgColor={themeStore.currentTheme.input_bg_300}
							bRad={5}
							style={{ paddingVertical: 10, paddingHorizontal: 30 }}
						>
							<MainText>
								{t("preview_input")}
							</MainText>
						</SimpleButtonUi>
					</Box>
				</PreviewBgUi>
			);
		case 'RadiusSettings':
			return (
				<PreviewBgUi>
					<Box
						centered
						height={"100%"}
						width={"100%"}
					>
						<Box
							bRad={pxNative(currentTheme.radius_100)}
							bgColor={themeStore.currentTheme.bg_200}
							style={{ paddingVertical: 40, paddingHorizontal: 60 }}
						>
							<MainText tac='center'>
								{t("preview_radius")}
							</MainText>
						</Box>
					</Box>
				</PreviewBgUi>
			);
		case 'BtnRadiusSettings':
			return (
				<PreviewBgUi>
					<Box
						centered
						height={"100%"}
						width={"100%"}
					>
						<SimpleButtonUi
							bgColor={themeStore.currentTheme.btn_bg_300}
							bRad={pxNative(currentTheme.btn_radius_200)}
							style={s.btnpreview}
						>
							<MainText>
								{t("preview_btn_title")}
							</MainText>
						</SimpleButtonUi>
					</Box>
				</PreviewBgUi>
			);
		case 'BtnHeightSettings':
			return (
				<PreviewBgUi>
					<Box
						centered
						height={"100%"}
						width={"100%"}
					>
						<SimpleButtonUi
							bgColor={themeStore.currentTheme.btn_bg_300}
							bRad={5}
							height={pxNative(currentTheme.btn_height_300)}
							style={{ paddingHorizontal: 30, width: '100%', justifyContent: 'center', alignItems: 'center' }}
						>
							<MainText>
								{t("preview_btn_title")}
							</MainText>
						</SimpleButtonUi>
					</Box>
				</PreviewBgUi>
			);
		case 'InputHeightSettings':
			return (
				<PreviewBgUi>
					<Box
						centered
						height={"100%"}
						width={"100%"}
					>
						<SimpleButtonUi
							bgColor={themeStore.currentTheme.input_bg_300}
							bRad={5}
							height={pxNative(currentTheme.input_height_300)}
							style={{ paddingHorizontal: 30, width: '100%', justifyContent: 'center', alignItems: 'center' }}
						>
							<MainText>
								{t("preview_input")}
							</MainText>
						</SimpleButtonUi>
					</Box>
				</PreviewBgUi>
			);
		case 'InputRadiusSettings':
			return (
				<PreviewBgUi>
					<Box
						centered
						height={"100%"}
						width={"100%"}
					>
						<SimpleButtonUi
							bgColor={themeStore.currentTheme.input_bg_300}
							bRad={pxNative(currentTheme.input_radius_300)}
							style={{ paddingVertical: 10, paddingHorizontal: 30 }}
						>
							<MainText>
								{t("preview_input")}
							</MainText>
						</SimpleButtonUi>
					</Box>
				</PreviewBgUi>
			);
		case 'PrimaryColorSettings':
			return (
				<PreviewBgUi>
					<Box
						centered
						height={"100%"}
						width={"100%"}
						gap={10}
					>
						<MainText
							color={themeStore.currentTheme.primary_100}
							px={24}
							fontWeight='700'
						>
							{t("settings_primary_color")}
						</MainText>
						<MainText
							color={themeStore.currentTheme.primary_100}
							px={16}
							tac='center'
						>
							{t("preview_text")}
						</MainText>
					</Box>
				</PreviewBgUi>
			);
		case 'TextColorSettings':
			return (
				<PreviewBgUi>
					<Box
						centered
						height={"100%"}
						width={"100%"}
						gap={10}
					>
						<MainText
							color={themeStore.currentTheme.text_100}
							px={24}
							fontWeight='700'
						>
							{t("settings_text_color")}
						</MainText>
						<MainText
							color={themeStore.currentTheme.text_100}
							px={16}
							tac='center'
						>
							{t("preview_text")}
						</MainText>
					</Box>
				</PreviewBgUi>
			);
		case 'SecondaryTextColorSettings':
			return (
				<PreviewBgUi>
					<Box
						centered
						height={"100%"}
						width={"100%"}
						gap={10}
					>
						<MainText
							color={themeStore.currentTheme.secondary_100}
							px={24}
							fontWeight='700'
						>
							{t("settings_secondary_text_color")}
						</MainText>
						<MainText
							color={themeStore.currentTheme.secondary_100}
							px={16}
							tac='center'
						>
							{t("preview_text")}
						</MainText>
					</Box>
				</PreviewBgUi>
			);
		default:
			return <></>;
	}
});