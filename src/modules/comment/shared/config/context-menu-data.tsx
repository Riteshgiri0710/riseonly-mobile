import { getDeleteBtnItem } from '@config/context-menu-helpers';
import { ContextMenuItem, UserLogo } from '@core/ui';
import { t } from 'i18next';
import { commentInteractionsStore, commentServiceStore, GetCommentsResponse, RespliesSortType } from 'src/modules/comment/stores';
import { getReportBtnItem } from 'src/modules/moderation/shared/config/context-menu-data';
import { postInteractionsStore } from 'src/modules/post/stores';
import { themeStore } from 'src/modules/theme/stores';
import { profileStore } from 'src/modules/user/stores/profile';

// COMMENTS

export const getCommentContextMenuItems = (comment: GetCommentsResponse) => {
	const {
		deleteCommentModal: { setDeleteCommentModal },
	} = commentInteractionsStore;
	const { openAndReplyComment } = commentServiceStore;

	const commentContextMenuItems: ContextMenuItem[] = [
		{
			id: 1,
			label: t('contextMenu_reply'),
			icon: 'reply',
			callback: () => openAndReplyComment(comment),
			key: "reply"
		}
	];

	if (profileStore.profile?.id !== comment.author_id) {
		commentContextMenuItems.push(getReportBtnItem(2));
	} else {
		commentContextMenuItems.push(
			getDeleteBtnItem(3, () => setDeleteCommentModal(true))
		);
	}

	return commentContextMenuItems;
};

export const getCommentListContextMenuItems = () => {
	const commentListContextMenuItems: ContextMenuItem[] = [
		{
			id: 1,
			label: t('contextMenu_interesting'),
			icon: 'trending-up',
			callback: () => commentInteractionsStore.changeCommentSelectedSort('feed'),
			key: "feed"
		},
		{
			id: 2,
			label: t('contextMenu_new'),
			icon: 'keyboard-double-arrow-up',
			callback: () => commentInteractionsStore.changeCommentSelectedSort('new'),
			key: "new"
		},
		{
			id: 3,
			label: t('contextMenu_old'),
			icon: 'keyboard-double-arrow-down',
			callback: () => commentInteractionsStore.changeCommentSelectedSort('old'),
			key: "old"
		}
	];

	if (profileStore.profile) {
		commentListContextMenuItems.push({
			id: 4,
			label: t('contextMenu_my'),
			jsxIcon: (
				<UserLogo
					size={22.5}
					borderColor={postInteractionsStore.selectedPost?.selectedCommentSort === 'my' ? themeStore.currentTheme.primary_100 : undefined}
					borderWidth={0.7}
					bordered
				/>
			),
			callback: () => commentInteractionsStore.changeCommentSelectedSort('my'),
			key: "my"
		});
	}

	return commentListContextMenuItems;
};

export const getRepliesListContextMenuItems = () => {
	const callback = (key: RespliesSortType) => commentInteractionsStore.changeRepliesSelectedSort(key);

	const repliesListContextMenuItems: ContextMenuItem[] = [
		{
			id: 1,
			label: t('contextMenu_popular'),
			icon: 'trending-up',
			callback: () => callback("popular"),
			key: "popular"
		},
		{
			id: 2,
			label: t('contextMenu_new'),
			icon: 'keyboard-double-arrow-up',
			callback: () => callback("new"),
			key: "new"
		},
		{
			id: 3,
			label: t('contextMenu_old'),
			icon: 'keyboard-double-arrow-down',
			callback: () => callback("old"),
			key: "old"
		}
	];

	if (profileStore.profile) {
		repliesListContextMenuItems.push({
			id: 4,
			label: t('contextMenu_my'),
			jsxIcon: <UserLogo size={22.5} bordered borderColor={postInteractionsStore.selectedPost?.selectedCommentSort === 'my' ? themeStore.currentTheme.primary_100 : undefined} borderWidth={0.7} />,
			callback: () => callback("my"),
			key: "my"
		});
	}

	return repliesListContextMenuItems;
};
