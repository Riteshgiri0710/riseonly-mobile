import { MainTabsLayout } from '@app/layouts/MainTabsLayout';
import { ScreenConfig } from '@lib/navigationv2';
import React from 'react';
import { SignIn, SignUp } from 'src/modules/auth/pages/Sign';
import { Chat, ChatProfile, Chats, TestNativeChat } from 'src/modules/chat/pages';
import { Notifications } from 'src/modules/notify/pages';
import { Onboarding } from 'src/modules/onboarding/pages';
import { PostDetail, Posts, PostsInteresting } from 'src/modules/post/pages';
import { GlobalSearch } from 'src/modules/search/pages';
import {
	AllThemeSettings,
	BeModeratorSettings,
	BgColorSettings,
	BorderColorSettings,
	BtnColorSettings,
	BtnHeightSettings,
	BtnRadiusSettings,
	CachedChats,
	CachedMedia,
	ChatWallpapersSettings,
	CreatePost,
	CustomizationSettings,
	InputBgSettings,
	InputHeightSettings,
	InputRadiusSettings,
	LanguageSettings,
	MemorySettings,
	ModerationSettings,
	MyModerationRequestsSettings,
	PrimaryColorSettings,
	PrivacySetting,
	PrivacySettings,
	Profile,
	ProfileSettings,
	RadiusSettings,
	SecondaryTextColorSettings,
	SessionsSettings,
	Settings,
	SubscriptionSettings,
	TextColorSettings,
	ThemeSettings,
	UserFriends,
	UserSubs,
	UserSubscribers,
	WallpapersSettings,
} from 'src/modules/user/pages';

const MainLayout = ({ children }: { children: React.ReactNode; }) => <MainTabsLayout>{children as any}</MainTabsLayout>;

export const screensConfig: ScreenConfig[] = [
	{
		name: 'Onboarding',
		component: Onboarding,
		type: 'main',
		cache: false,
	},
	{
		name: 'SignIn',
		component: SignIn,
		type: 'main',
		cache: false,
	},
	{
		name: 'SignUp',
		component: SignUp,
		type: 'screen',
	},

	{
		name: 'Posts',
		component: Posts,
		type: 'main',
		layout: MainLayout,
		cache: true,
	},
	{
		name: 'Profile',
		component: Profile,
		type: 'main',
		layout: MainLayout,
		cache: true,
	},
	{
		name: 'GlobalSearch',
		component: GlobalSearch,
		type: 'main',
		layout: MainLayout,
		cache: true,
	},
	{
		name: 'Chats',
		component: Chats,
		type: 'main',
		layout: MainLayout,
		cache: true,
	},
	{
		name: 'Notifications',
		component: Notifications,
		type: 'main',
		layout: MainLayout,
		cache: true,
	},

	{
		name: 'PostDetail',
		component: PostDetail,
		type: 'screen',
		layout: MainLayout,
	},
	{
		name: 'PostsInteresting',
		component: PostsInteresting,
		type: 'screen',
		layout: MainLayout,
	},
	{
		name: 'Chat',
		component: Chat,
		type: 'screen',
	},
	{
		name: 'ChatProfile',
		component: ChatProfile,
		type: 'screen',
	},
	{
		name: 'UserPage',
		component: (props: any) => <Profile {...props} isUser={true} />,
		type: 'screen',
		layout: MainLayout,
	},
	{
		name: 'UserSubs',
		component: (props: any) => <UserSubs {...props} isUser={true} />,
		type: 'screen',
		layout: MainLayout,
	},
	{
		name: 'UserSubscribers',
		component: (props: any) => <UserSubscribers {...props} isUser={true} />,
		type: 'screen',
		layout: MainLayout,
	},
	{
		name: 'UserFriends',
		component: (props: any) => <UserFriends {...props} isUser={true} />,
		type: 'screen',
		layout: MainLayout,
	},
	{
		name: 'CreatePost',
		component: CreatePost,
		type: 'screen',
	},

	{
		name: 'Settings',
		component: Settings,
		type: 'screen',
	},
	{
		name: 'ProfileSettings',
		component: ProfileSettings,
		type: 'screen',
	},
	{
		name: 'PrivacySettings',
		component: PrivacySettings,
		type: 'screen',
	},
	{
		name: 'PrivacySetting',
		component: PrivacySetting,
		type: 'screen',
	},
	{
		name: 'SessionsSettings',
		component: SessionsSettings,
		type: 'screen',
	},
	{
		name: 'ModerationSettings',
		component: ModerationSettings,
		type: 'screen',
	},
	{
		name: 'BeModeratorSettings',
		component: BeModeratorSettings,
		type: 'screen',
	},
	{
		name: 'MyModerationRequestsSettings',
		component: MyModerationRequestsSettings,
		type: 'screen',
	},
	{
		name: 'LanguageSettings',
		component: LanguageSettings,
		type: 'screen',
	},
	{
		name: 'MemorySettings',
		component: MemorySettings,
		type: 'screen',
	},
	{
		name: 'CachedChats',
		component: CachedChats,
		type: 'screen',
	},
	{
		name: 'CachedMedia',
		component: CachedMedia,
		type: 'screen',
	},
	{
		name: 'CustomizationSettings',
		component: CustomizationSettings,
		type: 'screen',
	},
	{
		name: 'ThemeSettings',
		component: ThemeSettings,
		type: 'screen',
	},
	{
		name: 'WallpapersSettings',
		component: WallpapersSettings,
		type: 'screen',
	},
	{
		name: 'ChatWallpapersSettings',
		component: ChatWallpapersSettings,
		type: 'screen',
	},
	{
		name: 'BgColorSettings',
		component: BgColorSettings,
		type: 'screen',
	},
	{
		name: 'BtnColorSettings',
		component: BtnColorSettings,
		type: 'screen',
	},
	{
		name: 'PrimaryColorSettings',
		component: PrimaryColorSettings,
		type: 'screen',
	},
	{
		name: 'TextColorSettings',
		component: TextColorSettings,
		type: 'screen',
	},
	{
		name: 'SecondaryTextColorSettings',
		component: SecondaryTextColorSettings,
		type: 'screen',
	},
	{
		name: 'AllThemeSettings',
		component: AllThemeSettings,
		type: 'screen',
	},
	{
		name: 'RadiusSettings',
		component: RadiusSettings,
		type: 'screen',
	},
	{
		name: 'BorderColorSettings',
		component: BorderColorSettings,
		type: 'screen',
	},
	{
		name: 'BtnHeightSettings',
		component: BtnHeightSettings,
		type: 'screen',
	},
	{
		name: 'BtnRadiusSettings',
		component: BtnRadiusSettings,
		type: 'screen',
	},
	{
		name: 'InputBgSettings',
		component: InputBgSettings,
		type: 'screen',
	},
	{
		name: 'InputHeightSettings',
		component: InputHeightSettings,
		type: 'screen',
	},
	{
		name: 'InputRadiusSettings',
		component: InputRadiusSettings,
		type: 'screen',
	},
	{
		name: 'SubscriptionSettings',
		component: SubscriptionSettings,
		type: 'screen',
	},
	{
		name: 'TestNativeChat',
		component: TestNativeChat,
		type: 'screen',
	},
];
