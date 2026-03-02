import { GridContentUi } from '@core/ui';
import { navigate } from '@lib/navigation';
import { globalSearchInteractionsStore } from '@stores/global-interactions';
import { observer } from 'mobx-react-lite';
import { MutableRefObject, RefObject, useCallback, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { searchActionsStore, searchInteractionsStore, SearchPost } from 'src/modules/search/stores/post';


export const GlobalSearchPosts = observer(({ headerRef }: { headerRef: RefObject<any>; }) => {
	const {
		posts: { data: dataPosts, status: statusPosts },
		postsByHasthag: { data: dataPostsByHashtag, status: statusPostsByHashtag }
	} = searchActionsStore;
	const {
		selectedPost,
		searchPostScrollRef: { setSearchPostScrollRef },
	} = searchInteractionsStore;
	const { searchEntity: { searchEntity } } = globalSearchInteractionsStore;

	const scrollY = useRef(new Animated.Value(0)).current;
	const flatListRef = useRef(null) as MutableRefObject<null>;
	const data = searchEntity === 'POST' ? dataPosts : dataPostsByHashtag;
	const status = searchEntity === 'POST' ? statusPosts : statusPostsByHashtag;

	const handleScroll = useCallback(() => Animated.event(
		[{ nativeEvent: { contentOffset: { y: scrollY } } }],
		{
			useNativeDriver: true,
			listener: (event) => {
				searchActionsStore.posts?.options?.dataScope?.onScroll?.(event);
				if (headerRef.current && headerRef.current.handleScroll) {
					headerRef.current.handleScroll(event);
				}
			}
		}
	), [headerRef.current, scrollY, searchActionsStore.posts?.options?.dataScope?.onScroll]);
	const handlePostPress = useCallback((post: SearchPost) => {
		if (!data?.list) return;
		selectedPost.setSelectedPost(post);
		navigate("PostsInteresting", { postId: post.id });
	}, [selectedPost, data?.list]);

	useEffect(() => {
		if (flatListRef) {
			setSearchPostScrollRef(flatListRef);
		}
	}, [flatListRef]);

	return (
		<GridContentUi<SearchPost>
			noDataTKey="no_posts_found"
			data={data}
			status={status}
			tag={selectedPost.selectedPost?.author.tag}
			handlePostPress={handlePostPress}
			flatListRef={flatListRef}
			handleScroll={handleScroll}
			mainContainerStyle={{ width: '100%' }}
		/>
	);
});
