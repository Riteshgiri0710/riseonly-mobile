import { SignIn, SignUp } from 'src/modules/auth/pages/Sign';
import { Chat, ChatProfile, ChatSettings, ChatSettingsAllowedReactions, ChatSettingsLinkedChat, ChatSettingsLinks, ChatSettingsMembers, ChatSettingsType, TestNativeChat } from 'src/modules/chat/pages';
import { Onboarding } from 'src/modules/onboarding/pages';
import { PostDetail, PostsInteresting } from 'src/modules/post/pages';
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
	StickerSettings,
	SubscriptionSettings,
	TextColorSettings,
	ThemeSettings,
	UserFriends, UserSubs, UserSubscribers,
	WallpapersSettings,
} from 'src/modules/user/pages';

import { createNativeStackNavigator } from '@lib/navigation';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './navigation.types';

import { MainBottomNavigation } from '@core/widgets/navigations';
import { useNavigation } from '@react-navigation/native';

const UserPageComponent = (props: any) => {
	const navigation = useNavigation();
	return (
		<MainBottomNavigation
			navigation={navigation}
			state={navigation.getState()}
		>
			<Profile {...props} isUser={true} />
		</MainBottomNavigation>
	);
};

const UserSubsComponent = (props: any) => <UserSubs {...props} isUser={true} />;
const UserSubscribersComponent = (props: any) => <UserSubscribers {...props} isUser={true} />;
const UserFriendsComponent = (props: any) => <UserFriends {...props} isUser={true} />;

interface RootNavigatorProps {
	initialRouteName?: keyof RootStackParamList;
}

export function RootNavigator({ initialRouteName = 'MainTabs' }: RootNavigatorProps) {
	const Stack = createNativeStackNavigator<RootStackParamList>();

	return (
		<Stack.Navigator
			initialRouteName={initialRouteName}
			screenOptions={{
				headerShown: false,
				animation: 'slide_from_right',
				animationDuration: 300,
				gestureEnabled: true,
				fullScreenGestureEnabled: true,
				freezeOnBlur: true,
			}}
		>
			{/* TABS */}
			<Stack.Screen name="MainTabs" component={MainTabNavigator} />

			{/* SIGN AND ONBOARDING */}
			<Stack.Screen name="Onboarding" component={Onboarding} />
			<Stack.Screen name="SignIn" component={SignIn} />
			<Stack.Screen name="SignUp" component={SignUp} />

			{/* POSTS */}
			<Stack.Screen
				name="PostDetail"
				component={PostDetail}
				options={{
					presentation: 'transparentModal',
					animation: 'none',
				}}
			/>
			<Stack.Screen name="PostsInteresting" component={PostsInteresting} />
			<Stack.Screen name="CreatePost" component={CreatePost} />

			{/* CHATS */}
			<Stack.Screen name="Chat" component={Chat} />
			<Stack.Screen name="ChatProfile" component={ChatProfile} />

			{/* CHAT SETTINGS */}
			<Stack.Screen name="ChatSettings" component={ChatSettings} />
			<Stack.Screen name="ChatSettingsType" component={ChatSettingsType} />
			<Stack.Screen name="ChatSettingsLinks" component={ChatSettingsLinks} />
			<Stack.Screen name="ChatSettingsLinkedChat" component={ChatSettingsLinkedChat} />
			<Stack.Screen name="ChatSettingsAllowedReactions" component={ChatSettingsAllowedReactions} />
			<Stack.Screen name="ChatSettingsMembers" component={ChatSettingsMembers} />

			{/* USER */}
			<Stack.Screen name="UserPage" component={UserPageComponent} />
			<Stack.Screen name="UserSubs" component={UserSubsComponent} />
			<Stack.Screen name="UserSubscribers" component={UserSubscribersComponent} />
			<Stack.Screen name="UserFriends" component={UserFriendsComponent} />

			{/* USER SETTINGS */}
			<Stack.Screen name="Settings" component={Settings} />
			<Stack.Screen name="ProfileSettings" component={ProfileSettings} />
			<Stack.Screen name="PrivacySettings" component={PrivacySettings} />
			<Stack.Screen name="PrivacySetting" component={PrivacySetting} />
			<Stack.Screen name="SessionsSettings" component={SessionsSettings} />
			<Stack.Screen name="ModerationSettings" component={ModerationSettings} />
			<Stack.Screen name="BeModeratorSettings" component={BeModeratorSettings} />
			<Stack.Screen name="MyModerationRequestsSettings" component={MyModerationRequestsSettings} />
			<Stack.Screen name="LanguageSettings" component={LanguageSettings} />
			<Stack.Screen name="MemorySettings" component={MemorySettings} />
			<Stack.Screen name="CachedChats" component={CachedChats} />
			<Stack.Screen name="CachedMedia" component={CachedMedia} />
			<Stack.Screen name="CustomizationSettings" component={CustomizationSettings} />
			<Stack.Screen name="ThemeSettings" component={ThemeSettings} />
			<Stack.Screen name="WallpapersSettings" component={WallpapersSettings} />
			<Stack.Screen name="ChatWallpapersSettings" component={ChatWallpapersSettings} />
			<Stack.Screen name="BgColorSettings" component={BgColorSettings} />
			<Stack.Screen name="BtnColorSettings" component={BtnColorSettings} />
			<Stack.Screen name="PrimaryColorSettings" component={PrimaryColorSettings} />
			<Stack.Screen name="TextColorSettings" component={TextColorSettings} />
			<Stack.Screen name="SecondaryTextColorSettings" component={SecondaryTextColorSettings} />
			<Stack.Screen name="AllThemeSettings" component={AllThemeSettings} />
			<Stack.Screen name="RadiusSettings" component={RadiusSettings} />
			<Stack.Screen name="BorderColorSettings" component={BorderColorSettings} />
			<Stack.Screen name="BtnHeightSettings" component={BtnHeightSettings} />
			<Stack.Screen name="BtnRadiusSettings" component={BtnRadiusSettings} />
			<Stack.Screen name="InputBgSettings" component={InputBgSettings} />
			<Stack.Screen name="InputHeightSettings" component={InputHeightSettings} />
			<Stack.Screen name="InputRadiusSettings" component={InputRadiusSettings} />
			<Stack.Screen name="StickerSettings" component={StickerSettings} />
			<Stack.Screen name="SubscriptionSettings" component={SubscriptionSettings} />
			<Stack.Screen name="TestNativeChat" component={TestNativeChat} />
		</Stack.Navigator>
	);
}

