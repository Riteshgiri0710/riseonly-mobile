import { DeleteIcon } from '@icons/Ui/DeleteIcon';
import { t } from 'i18next';

// COMMON HELPERS

export const getDeleteBtnItem = (id: number, callback: () => void) => {
	return {
		id: id,
		label: t('contextMenu_delete'),
		jsxIcon: <DeleteIcon size={20} color={"red"} />,
		textColor: "red",
		callback,
		key: "delete"
	};
};

