import { getDeleteBtnItem } from '@config/context-menu-helpers';
import { ContextMenuItem } from '@core/ui';
import { t } from 'i18next';
import { getReportBtnItem } from 'src/modules/moderation/shared/config/context-menu-data';
import { GetPostFeedResponse, postInteractionsStore } from 'src/modules/post/stores';
import { profileStore } from 'src/modules/user/stores/profile';

// POSTS

export const getPostContextMenuItems = (post: GetPostFeedResponse) => {
	const { postDeleteModalOpen: { setPostDeleteModalOpen } } = postInteractionsStore;
	const postContextMenuItems: ContextMenuItem[] = [
		{
			id: 1,
			label: t('contextMenu_share'),
			icon: 'ios-share',
			callback: () => console.log('share'),
			key: "share"
		}
	];

	if (profileStore.profile?.id !== post.author_id) {
		postContextMenuItems.push(getReportBtnItem(3));
	} else {
		postContextMenuItems.push(
			getDeleteBtnItem(3, () => setPostDeleteModalOpen(true))
		);
	}

	return postContextMenuItems;
};
