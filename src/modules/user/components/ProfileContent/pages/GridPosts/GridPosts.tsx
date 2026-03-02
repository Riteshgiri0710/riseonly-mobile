import { GridContentUi } from '@core/ui';
import { navigate, useRoute } from '@lib/navigation';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { GetPostFeedResponse, postActionsStore, postInteractionsStore } from 'src/modules/post/stores';
import { profileStore } from 'src/modules/user/stores/profile';

interface GridPostsProps {
	max?: number;
	currentElement?: any[];
	postContainerStyle?: StyleProp<ViewStyle>;
	pageContainerStyle?: StyleProp<ViewStyle>;
	mainContainerStyle?: StyleProp<ViewStyle>;
	needPending?: boolean;
	fetchIfHaveData?: boolean;
	isPreview?: boolean;
}

export const GridPosts = observer(({
	max,
	currentElement,
	postContainerStyle = {},
	pageContainerStyle = {},
	mainContainerStyle = {},
	needPending = true,
	fetchIfHaveData = true,
	isPreview = false
}: GridPostsProps) => {
	const {
		userPosts: {
			data,
			status
		},
		getUserPostsAction
	} = postActionsStore;
	const {
		userPostsToShow: { setUserPostsToShow },
		selectedUserPost: { setSelectedUserPost },
	} = postInteractionsStore;
	const { profile } = profileStore;

	const name = useRoute().name;
	const tag = (useRoute().params as { tag?: string; })?.tag || profile?.tag;

	const handlePostPress = useCallback((post: GetPostFeedResponse) => {
		if (!data?.list) return;
		setUserPostsToShow(data.list);
		setSelectedUserPost(post);
		navigate('PostDetail', { postId: post.id.toString() });
	}, [data?.list, setUserPostsToShow, setSelectedUserPost]);
	useEffect(() => {
		getUserPostsAction((tag || ""), needPending, fetchIfHaveData);
	}, [profile?.tag]);

	if (!tag) return;

	// useEffect(() => {
	// 	getUserPostsAction((name === "Profile" ? (profile?.tag || "") : (tag || "")), false, false);
	// }, [openedPage]);

	return (
		<GridContentUi<GetPostFeedResponse>
			data={data}
			status={status}
			handlePostPress={handlePostPress}
			tag={tag}
			max={max}
			currentElement={currentElement}
			postContainerStyle={postContainerStyle}
			pageContainerStyle={pageContainerStyle}
			mainContainerStyle={mainContainerStyle}
			isPreview={isPreview}
		/>
	);
});
