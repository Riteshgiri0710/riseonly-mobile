import { ButtonUi, MainText } from '@core/ui';
import { CommentIcon } from '@icons/MainPage/Posts/CommentIcon';
import { FavIcon } from '@icons/MainPage/Posts/FavIcon';
import { FavIconActive } from '@icons/MainPage/Posts/FavIconActive';
import { HeartIcon } from '@icons/MainPage/Posts/HeartIcon';
import { HeartIconActive } from '@icons/MainPage/Posts/HeartIconActive';
import { formatNumber } from '@lib/numbers';
import { observer } from 'mobx-react-lite';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GetPostFeedResponse } from 'src/modules/post/stores';
import { themeStore } from 'src/modules/theme/stores';

interface PostActionsProps {
	post: GetPostFeedResponse;
	isPreview: boolean;
	toggleLikeHandler: () => void;
	toggleFavHandler: () => void;
	handleOpenComments: () => void;
	btnsPaddingHorizontal: number;
	iconSize: number;
	textSize: number;
	btnGap: number;
}

const PostActionsComponent = observer(({
	post,
	isPreview,
	toggleLikeHandler,
	toggleFavHandler,
	handleOpenComments,
	btnsPaddingHorizontal,
	iconSize,
	textSize,
	btnGap
}: PostActionsProps) => {
	const { currentTheme } = themeStore;

	return (
		<View style={styles.footerLeft}>
			<ButtonUi
				backgroundColor={currentTheme.btn_bg_300}
				bRad={5}
				height="auto"
				fitContent
				paddingLeft={btnsPaddingHorizontal}
				paddingRight={btnsPaddingHorizontal}
				paddingVertical={5}
				gap={btnGap}
				onPress={toggleLikeHandler}
			>
				{post.is_liked ? (
					<HeartIconActive size={17.5} />
				) : (
					<HeartIcon size={iconSize} />
				)}
				<MainText px={textSize}>{formatNumber(post.likes_count)}</MainText>
			</ButtonUi>

			<ButtonUi
				backgroundColor={currentTheme.btn_bg_300}
				bRad={5}
				height="auto"
				fitContent
				paddingLeft={btnsPaddingHorizontal}
				paddingRight={btnsPaddingHorizontal}
				paddingVertical={5}
				gap={btnGap}
				onPress={toggleFavHandler}
			>
				{post.is_favorited ? (
					<FavIconActive size={17.5} />
				) : (
					<FavIcon size={iconSize} />
				)}
				<MainText px={textSize}>{formatNumber(post.favorites_count)}</MainText>
			</ButtonUi>

			<ButtonUi
				backgroundColor={currentTheme.btn_bg_300}
				bRad={5}
				height="auto"
				fitContent
				paddingVertical={5}
				paddingLeft={btnsPaddingHorizontal}
				paddingRight={btnsPaddingHorizontal}
				gap={btnGap}
				onPress={handleOpenComments}
			>
				<CommentIcon size={iconSize} />
				<MainText px={textSize}>{formatNumber(post.comments_count)}</MainText>
			</ButtonUi>
		</View>
	);
});

export const PostActions = memo(PostActionsComponent, (prev, next) => {
	return (
		prev.post.is_liked === next.post.is_liked &&
		prev.post.is_favorited === next.post.is_favorited &&
		prev.post.likes_count === next.post.likes_count &&
		prev.post.favorites_count === next.post.favorites_count &&
		prev.post.comments_count === next.post.comments_count &&
		prev.isPreview === next.isPreview
	);
});

const styles = StyleSheet.create({
	footerLeft: {
		flexDirection: 'row',
		gap: 5,
	}
});

