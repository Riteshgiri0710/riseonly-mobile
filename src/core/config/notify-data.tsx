import i18next from 'i18next';
import { NotifyData } from 'src/modules/notify/stores/types';

export const getDeletePostNotifyData = () => {
	const notifyObj: NotifyData = {
		title: i18next.t('deletePostNotify_error_title'),
		message: i18next.t('deletePostNotify_error_message')
	};

	return notifyObj;
};

export const getDeletePostSuccessNotifyData = () => {
	const notifyObj: NotifyData = {
		title: i18next.t('deletePostNotify_success_title'),
		message: i18next.t('deletePostNotify_success_message')
	};

	return notifyObj;
};
