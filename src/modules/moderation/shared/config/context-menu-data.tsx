import { ReportIcon } from '@icons/MainPage/Sidebar';
import { t } from 'i18next';
import { moderationStore } from 'src/modules/moderation/stores';

// REPORT BUTTON

export const getReportBtnItem = (id: number) => {
	return {
		id: id,
		label: t('contextMenu_report'),
		jsxIcon: <ReportIcon size={20} color={"red"} />,
		textColor: "red",
		callback: () => moderationStore.isReportOpen.setIsReportOpen(true),
		key: "report"
	};
};

