import { GroupedBtns } from '@core/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getPrivacySettingsStatuses } from 'src/modules/user/shared/config/grouped-btns-data';
import { profileStore } from 'src/modules/user/stores/profile';

export const PrivacySetting = observer(() => {
	const {
		selectedPrivacy: { selectedPrivacy }
	} = profileStore;

	if (!selectedPrivacy) return null;

	const { t } = useTranslation();

	const items = useMemo(() => {
		return getPrivacySettingsStatuses(selectedPrivacy.actionKey, "default", t);
	}, [t, selectedPrivacy]);

	return (
		<ProfileSettingsWrapper
			tKey={selectedPrivacy.text}
			height={45}
		>
			<GroupedBtns
				items={items || []}
			/>
		</ProfileSettingsWrapper>
	);
});