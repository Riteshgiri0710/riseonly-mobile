import { Box, GridContentUi } from '@core/ui';
import { ChatsWrapper } from '@core/widgets/wrappers';
import { ChatSearchBar } from '@modules/chat/pages/Chats/Chats';
import { SearchPost } from '@post/stores/search/types';
import { globalSearchInteractionsStore } from '@stores/global-interactions';
import { observer } from 'mobx-react-lite';
import { RefObject, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GetPostFeedResponse, postActionsStore, postInteractionsStore } from 'src/modules/post/stores';
import { GlobalSearchPosts, GlobalSearchUsers } from 'src/modules/search/components';
import { themeStore } from 'src/modules/theme/stores';

export const GlobalSearch = observer(() => {
	const { currentTheme } = themeStore;
	const { postsFeed } = postActionsStore;
	const { selectedPost, setSelectedPost } = postInteractionsStore;
	const {
		queryString: { queryString },
		onChangeQueryString,
		searchEntity: { searchEntity }
	} = globalSearchInteractionsStore;

	const { t } = useTranslation();
	const headerRef = useRef<any | null>(null);
	const insets = useSafeAreaInsets();
	const flatListRef = useRef(null) as RefObject<null>;

	const handleInputChange = useCallback((text: string) => {
		onChangeQueryString(text);
	}, []);

	const handlePostPress = useCallback((post: SearchPost) => {
		setSelectedPost(post);
	}, [selectedPost]);

	return (
		<ChatsWrapper
			tKey='globalsearch_title'
			requiredBg={false}
			noBg
			wrapperStyle={{ paddingVertical: 0, paddingHorizontal: 0 }}
			transparentSafeArea
			scrollEnabled={false}
			PageHeaderUiStyle={{ borderBottomWidth: 0 }}
			isBlurView={true}
			headerHeight={100}
			additionalJsx={(
				<Box
					style={{ paddingHorizontal: 10, paddingBottom: 10 }}
				>
					<ChatSearchBar
						value={queryString}
						onChange={handleInputChange}
					/>
				</Box>
			)}
		>
			<View
				style={{ ...s.chatsWrapper }}
			>
				<Box
					style={{ flex: 1 }}
					bgColor={currentTheme.bg_200}
				>
					<View style={{ flex: 1, width: '100%', }}>
						{queryString ? (
							searchEntity === 'USER' ? (
								<GlobalSearchUsers headerRef={headerRef} />
							) : (
								<GlobalSearchPosts headerRef={headerRef} />
							)
						) : (
							<GridContentUi<GetPostFeedResponse>
								noDataTKey="no_posts_found"
								data={postsFeed?.data}
								status={postsFeed?.status}
								handlePostPress={handlePostPress}
								flatListRef={flatListRef}
								mainContainerStyle={{ width: '100%' }}
							/>
						)}
					</View>
				</Box>
			</View>
		</ChatsWrapper>
	);
});

const s = StyleSheet.create({
	chatsWrapper: {
		width: "100%",
		flex: 1,
	},
	searchInputWrapper: {
		height: 40,
		paddingHorizontal: 10,
		borderRadius: 8,
		width: "100%",
	},
	searchInput: {
		width: "100%",
	},
	flatList: {
		width: '100%',
		flex: 1,
		paddingTop: 5,
		marginBottom: 80,
	},
});