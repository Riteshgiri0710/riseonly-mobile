import { Box, MainText } from '@core/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from "mobx-react-lite";
import { useTranslation } from 'react-i18next';
import { themeActionsStore } from 'src/modules/theme/stores';

export const WallpapersSettings = observer(() => {
	const { } = themeActionsStore;

	const { t } = useTranslation();

	return (
		<ProfileSettingsWrapper
			tKey='settings_customization_wallpapers'
			height={45}
		>
			<Box
				flex={1}
				height={"100%"}
			>
				<MainText>{t('settings_customization_wallpapers')}</MainText>
			</Box>
		</ProfileSettingsWrapper>
	);
});