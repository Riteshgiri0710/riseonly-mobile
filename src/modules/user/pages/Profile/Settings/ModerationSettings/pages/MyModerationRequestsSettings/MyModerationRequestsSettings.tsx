import { AsyncDataRender, GroupedBtns } from '@core/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { View } from 'react-native';
import { getMyModerationRequestSettings } from 'src/modules/moderation/shared/config/grouped-btns-data';
import { moderationActionsStore, moderationStore } from 'src/modules/moderation/stores';
import { ModerationReasonModal } from 'src/modules/moderation/widgets/modals/ModerationReasonModal';

export const MyModerationRequestsSettings = observer(() => {
	const { preloadMyModerationRequest } = moderationStore;
	const { myModerationReqSai } = moderationActionsStore;

	useEffect(() => { preloadMyModerationRequest(); }, []);

	return (
		<ProfileSettingsWrapper
			tKey='settings_my_moderations_reqs_title'
			height={30}
		>
			<View>
				<ModerationReasonModal />

				<AsyncDataRender
					status={myModerationReqSai.status}
					data={myModerationReqSai.data}
					renderContent={(data) => (
						<GroupedBtns
							leftFlex={0}
							items={getMyModerationRequestSettings(data!)}
						/>
					)}
				/>
			</View>
		</ProfileSettingsWrapper>
	);
});
