import { ModalData } from '@config/types';
import { useTranslation } from 'react-i18next';
import { commentActionsStore, commentInteractionsStore } from 'src/modules/comment/stores';

export const getDeleteCommentModalData = () => {
	const { deleteCommentAction } = commentActionsStore;
	const { deleteCommentModal: { setDeleteCommentModal } } = commentInteractionsStore;

	const { t } = useTranslation();

	const modalObj: ModalData = {
		title: t('deleteCommentModal_title'),
		message: t('deleteCommentModal_message'),
		buttonText: t('delete_text'),
		onCancel: () => setDeleteCommentModal(false),
		onPress: () => deleteCommentAction(),
		width: 280,
	};

	return modalObj;
};

