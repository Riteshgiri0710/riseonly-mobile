import { MainBottomNavigation } from '@core/widgets/navigations';
import { createBottomTabNavigator } from '@lib/navigation';
import { Chats } from 'src/modules/chat/pages';
import { Notifications } from 'src/modules/notify/pages';
import { Posts } from 'src/modules/post/pages';
import { GlobalSearch } from 'src/modules/search/pages';
import { Profile } from 'src/modules/user/pages';
import type { MainTabParamList } from './navigation.types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: false,
				lazy: true,
			}}
			tabBar={(props) => <MainBottomNavigation {...props} />}
			initialRouteName="Posts"
		>
			<Tab.Screen name="Posts" component={Posts} />
			<Tab.Screen name="GlobalSearch" component={GlobalSearch} />
			<Tab.Screen name="Chats" component={Chats} />
			<Tab.Screen name="Notifications" component={Notifications} />
			<Tab.Screen name="Profile" component={Profile} />
		</Tab.Navigator>
	);
}

