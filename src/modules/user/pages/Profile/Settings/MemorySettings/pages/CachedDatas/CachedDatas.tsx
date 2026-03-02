import { cachedDataTitles } from '@config/ts';
import { Box } from '@core/ui';
import { checker } from '@lib/helpers';
import { memoryStore, SelectedCachedDataT } from '@stores/memory';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { themeStore } from 'src/modules/theme/stores';

export const CachedDatas = observer(() => {
	const { currentTheme } = themeStore;
	const {
		selectedCachedData: { selectedCachedData },
	} = memoryStore;

	const { t } = useTranslation();

	checker(selectedCachedData, "Selected cached data is not defined");

	return (
		<ProfileSettingsWrapper
			title={`${t("cache")} | ${t(cachedDataTitles[selectedCachedData as SelectedCachedDataT])}`}
			requiredBg={false}
			bgColor={currentTheme.bg_200}
			PageHeaderUiStyle={{
				backgroundColor: currentTheme.btn_bg_300
			}}
			height={45}
		>
			<Box>
				{ }
			</Box>
		</ProfileSettingsWrapper>
	);
});