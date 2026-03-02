import { AsyncDataRender, GroupedBtns } from '@core/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getPrivacySettingsBtns } from 'src/modules/user/shared/config/grouped-btns-data';
import { profileActionsStore, profileStore } from 'src/modules/user/stores/profile';

import { StyleSheet } from 'react-native';

export const PrivacySettings = observer(() => {
	const {
		privacy: { status, data },
		getPrivacyAction,
	} = profileActionsStore;
	const { privacySettingsItems: { privacySettingsItems } } = profileStore;

	const { t } = useTranslation();

	let items = useMemo(() => {
		if (!data) return;
		return getPrivacySettingsBtns(data, t);
	}, [t, data, privacySettingsItems]);

	useEffect(() => {
		getPrivacyAction();
	}, []);

	return (
		<ProfileSettingsWrapper
			tKey='settings_privacy_title'
			height={45}
		>
			<AsyncDataRender
				data={data}
				status={status || (!items ? "pending" : "fulfilled")}
				renderContent={() => (
					<GroupedBtns
						items={items!}
						leftFlex={0}
					/>
				)}
			/>
		</ProfileSettingsWrapper>
	);
});

const s = StyleSheet.create({
});