import { GroupedBtns } from '@core/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getModerationSettingsBtns } from 'src/modules/moderation/shared/config/grouped-btns-data';

export const ModerationSettings = observer(() => {
	const { t } = useTranslation();

	const btns = useMemo(() => getModerationSettingsBtns(t), [t]);

	return (
		<ProfileSettingsWrapper
			tKey='settings_moderations_title'
			height={45}
		>
			<GroupedBtns
				items={btns}
				leftFlex={0}
			/>
		</ProfileSettingsWrapper>
	);
});
