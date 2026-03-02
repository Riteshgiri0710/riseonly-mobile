import { SimpleModalUi } from '@core/ui';
import { observer } from 'mobx-react-lite';
import { getDeleteCommentModalData } from 'src/modules/comment/shared/config/modal-data';
import { commentInteractionsStore } from 'src/modules/comment/stores';

export const DeleteCommentModal = observer(() => {
	const { deleteCommentModal: { deleteCommentModal } } = commentInteractionsStore;

	return (
		<SimpleModalUi
			visible={deleteCommentModal}
			modalData={getDeleteCommentModalData()}
			instaOpen
		/>
	);
});