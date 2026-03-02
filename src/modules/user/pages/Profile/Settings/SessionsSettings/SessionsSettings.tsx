import { AsyncDataRender, Box, GroupedBtns } from '@core/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { sessionActionsStore } from 'src/modules/session/stores';
import { SessionSheet } from 'src/modules/session/widgets/bottomsheets/SessionSheet';
import { getSessionSettings } from 'src/modules/user/shared/config/grouped-btns-data';

export const SessionsSettings = observer(() => {
	const {
		sessions: {
			data,
			status
		},
		getSessionsAction
	} = sessionActionsStore;

	const { t } = useTranslation();
	const { height } = useWindowDimensions();

	const sessionItems = useMemo(() => {
		if (!data?.sessions) return [];
		return getSessionSettings(data.sessions, t);
	}, [data?.sessions, t, sessionActionsStore?.deleteSession?.status]);

	useEffect(() => {
		getSessionsAction();
	}, []);

	return (
		<ProfileSettingsWrapper
			tKey='settings_sessions_title'
			height={45}
		>
			<View
				style={{ minHeight: height / 100 * 70 }}
			>
				<AsyncDataRender
					status={status}
					data={data?.sessions}
					messageHeightPercent={45}
					renderContent={() => {
						if (!data?.sessions) return;
						return (
							<ScrollView
								scrollEventThrottle={16}
								style={[
									s.scrollView,
								]}
							>
								<Box
									fD='column'
									gap={15}
								>
									<GroupedBtns
										items={sessionItems}
										groupGap={30}
									/>
								</Box>
							</ScrollView>
						);
					}}
				/>

				<SessionSheet />
			</View>
		</ProfileSettingsWrapper>
	);
});

const s = StyleSheet.create({
	scrollView: {
		flex: 1,
		height: "100%"
	}
});