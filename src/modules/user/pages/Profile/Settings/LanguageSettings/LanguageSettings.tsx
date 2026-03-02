import { GroupedBtns } from '@core/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getLanguageSettingsBtns } from 'src/modules/user/shared/config/grouped-btns-data';

export const LanguageSettings = observer(() => {
	const { t, i18n } = useTranslation();

	const items = useMemo(() => getLanguageSettingsBtns(t, i18n), [i18n.language, t]);

	return (
		<ProfileSettingsWrapper
			tKey='settings_language_title'
			height={45}
		>
			<GroupedBtns
				items={items}
			/>
		</ProfileSettingsWrapper>
	);
});