import { AsyncDataRender, ImageViewerUi } from '@core/ui';
import { useRoute } from '@lib/navigation';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { commentInteractionsStore } from 'src/modules/comment/stores';
import { Post } from 'src/modules/post/components/Post/Post';
import { postActionsStore, postInteractionsStore } from 'src/modules/post/stores';
import { themeStore } from 'src/modules/theme/stores';
import { profileStore } from 'src/modules/user/stores/profile';

export const ListPosts = observer(() => {
	const { currentTheme } = themeStore;
	const { profile } = profileStore;
	const {
		userPosts: { status, data, scopeStatus },
		getUserPostsAction
	} = postActionsStore;
	const {
		imageOpen: { imageOpen, setImageOpen },
		postScrollRef: { setPostScrollRef },
		imageData
	} = postInteractionsStore;
	const { setIsCommentOpen } = commentInteractionsStore;

	const route = useRoute();
	const { t } = useTranslation();
	const flatListRef = useRef(null);

	const { tag } = (route.params as any);

	useEffect(() => {
		if (flatListRef) setPostScrollRef(flatListRef);
		getUserPostsAction(tag || profile?.tag);
		return () => { setIsCommentOpen(false); };
	}, [flatListRef]);

	const renderPostsList = useCallback(() => {
		return data?.list?.map((item, index) => {
			return (
				<Post
					key={item.id}
					post={item}
					isFirst={index === 0}
					firstStyle={[
						s.firstPost,
						{
							borderBottomLeftRadius: currentTheme.radius_100,
							borderBottomRightRadius: currentTheme.radius_100,
						}
					]}
				/>
			);
		});
	}, [data?.list, s.firstPost, currentTheme.radius_100]);

	return (
		<>
			<ImageViewerUi
				open={imageOpen}
				onClose={() => setImageOpen(false)}
				imagesArr={imageData}
				currentImage={imageData[0]}
				totalCount={data?.list?.length || 0}
			/>

			<AsyncDataRender
				status={status}
				data={(data?.list) || []}
				scopeStatus={scopeStatus}
				noDataText={t('no_posts')}
				renderContent={renderPostsList}
				messageHeightPercent={40}
			/>
		</>
	);
});

const s = StyleSheet.create({
	firstPost: {
		marginVertical: 0,
		marginBottom: 5,
		borderRadius: 0,
	}
});