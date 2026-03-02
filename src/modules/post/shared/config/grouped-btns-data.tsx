import { GroupBtnsType } from '@config/types';
import { SwitchUi } from '@core/ui';
import { CommentSettingIcon } from '@icons/Ui/CommentSettingIcon';
import { TFunction } from 'i18next';
import { postInteractionsStore } from 'src/modules/post/stores';

// CREATE POST SETTINGS

export const getCreatePostSettingsBtns = (t: TFunction) => {
	const minHeight = 42.5;
	const btnRightPaddingVertical = 5;

	const res: GroupBtnsType[] = [
		{
			group: "settings",
			text: t("create_post_can_comment"),
			icon: <CommentSettingIcon size={22} />,
			minHeight,
			btnRightPaddingVertical,
			leftIcon: <SwitchUi isOpen={postInteractionsStore.createPostForm.values.canComment} />,
			pretitleLines: 5,
			btnRightMainTextPx: 14,
			pretitlePx: 15,
			callback: () => {
				postInteractionsStore.createPostForm.setValue("canComment", !postInteractionsStore.createPostForm.values.canComment);
			}
		},
	];

	return res;
};

