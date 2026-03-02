import { ModalData } from '@config/types';
import { useTranslation } from 'react-i18next';
import { postActionsStore, postInteractionsStore } from 'src/modules/post/stores';

export const getDeletePostModalData = () => {
	const { deletePostAction } = postActionsStore;
	const { postDeleteModalOpen: { setPostDeleteModalOpen } } = postInteractionsStore;

	const { t } = useTranslation();

	const modalObj: ModalData = {
		title: t('deletePostModal_title'),
		message: t('deletePostModal_message'),
		buttonText: t('delete_text'),
		onCancel: () => setPostDeleteModalOpen(false),
		onPress: () => deletePostAction(),
		width: 280,
	};

	return modalObj;
};

