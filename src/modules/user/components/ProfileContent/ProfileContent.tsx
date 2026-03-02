import { getIconColor } from '@config/const';
import { AnimatedTabs, TabConfig } from '@core/ui';
import { GoalsIcon } from '@icons/MainPage/Profile/GoalsIcon';
import { GridPostsIcon } from '@icons/MainPage/Profile/GridPostsIcon';
import { PostIcon } from '@icons/MainPage/Sidebar';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { profileStore } from 'src/modules/user/stores/profile';
import { GridPosts, ListPosts, Plans } from './pages';

const tabs: TabConfig[] = [
	{ icon: GridPostsIcon, content: GridPosts },
	{ icon: PostIcon, content: ListPosts, backgroundColor: 'transparent' },
	{ icon: GoalsIcon, content: Plans }
];

export const ProfileContent = observer(() => {
	const {
		profileTab: { profileTab, setProfileTab },
		openedPage: { openedPage },
		scrollPosition,
		userToShow,
		setScrollPosition,
		handleSwap
	} = profileStore;

	useEffect(() => {
		if (openedPage !== profileTab) {
			setProfileTab(openedPage);
		}
	}, []);

	if (!userToShow) return <></>;

	return (
		<AnimatedTabs
			tabs={tabs}
			activeTab={profileTab}
			setActiveTab={setProfileTab}
			scrollPosition={scrollPosition}
			setScrollPosition={setScrollPosition}
			getIconColor={getIconColor}
			containerStyle={styles.container}
			bouncing={false}
			onSwap={handleSwap}
			simple={true}
		/>
	);
});

const styles = StyleSheet.create({
	container: {
		marginTop: 0,
		flex: 1,
	}
});