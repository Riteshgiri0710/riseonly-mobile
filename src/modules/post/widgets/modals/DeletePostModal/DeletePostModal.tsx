import { SimpleModalUi } from '@core/ui';
import { observer } from 'mobx-react-lite';
import { postInteractionsStore } from 'src/modules/post/stores';
import { getDeletePostModalData } from '../../../shared/config/modal-data';

export const DeletePostModal = observer(() => {
	const { postDeleteModalOpen: { postDeleteModalOpen } } = postInteractionsStore;

	const modalData = getDeletePostModalData();

	return (
		<SimpleModalUi
			modalData={modalData}
			visible={postDeleteModalOpen}
			instaOpen
		/>
	);
});