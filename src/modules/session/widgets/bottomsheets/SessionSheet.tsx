import { getSessionDevice } from '@config/const';
import { getSessionIcon } from '@config/tsx';
import { BottomSheetUi, Box, GroupedBtns, LiveTimeAgo, MainText, SimpleButtonUi } from '@core/ui';
import i18next from 'i18next';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { sessionActionsStore, sessionInteractionsStore, sessionServiceStore } from 'src/modules/session/stores';
import { themeStore } from 'src/modules/theme/stores';
import { getSessionInfoBtns } from 'src/modules/user/shared/config/grouped-btns-data';

export const SessionSheet = observer(() => {
	const { currentTheme } = themeStore;
	const { deleteSessionAction } = sessionActionsStore;
	const {
		sessionSheet: { sessionSheet, setSessionSheet },
		sessionSheetOnCloseSignal: { sessionSheetOnCloseSignal, setSessionSheetOnCloseSignal },
		selectedSession: { selectedSession }
	} = sessionInteractionsStore;
	const {
		sessionIsAllDelete: { setSessionIsAllDelete }
	} = sessionServiceStore;

	const { width } = useWindowDimensions();
	const { t } = useTranslation();

	if (!sessionSheet) return <></>;
	if (!selectedSession) {
		console.warn("[SessionSheet]: selectedSession is null");
		return <></>;
	}

	const sessionInfoItems = getSessionInfoBtns(t, selectedSession);
	const deleteSessionHandler = () => {
		setSessionIsAllDelete(false);
		deleteSessionAction();
	};

	return (
		<>
			{sessionSheet && (
				<BottomSheetUi
					isBottomSheet={sessionSheet}
					setIsBottomSheet={setSessionSheet}
					onCloseSignal={sessionSheetOnCloseSignal}
					setOnCloseSignal={setSessionSheetOnCloseSignal}
					snap={["60%"]}
					footerStyle={{
						borderTopWidth: 0
					}}
					footer={(
						<Box style={s.bottom}>
							<SimpleButtonUi
								style={[
									s.determinateBtn,
									{ backgroundColor: currentTheme.btn_bg_300, }
								]}
								onPress={deleteSessionHandler}
							>
								<MainText
									color={currentTheme.error_100}
									width={"100%"}
									tac="center"
								>
									{i18next.t("determinate_session")}
								</MainText>
							</SimpleButtonUi>
						</Box>
					)}
				>
					<View
						style={{
							...s.main,
							width: width,
						}}
					>
						<View
							style={{
								gap: 20,
								alignItems: "center"
							}}
						>
							<Box
								align='center'
								width={"100%"}
								gap={2}
							>
								{getSessionIcon(selectedSession.device_info, 90)}

								<MainText
									px={22.5}
									tac='center'
									marginTop={4}
								>
									{getSessionDevice(selectedSession.device_info)}
								</MainText>

								<LiveTimeAgo
									date={selectedSession.last_accessed_at}
									fontSize={15}
								/>
							</Box>

							<Box>
								<GroupedBtns
									items={sessionInfoItems}
									groupBg={currentTheme.btn_bg_300}
									leftFlex={0}
								/>
							</Box>
						</View>
					</View>
				</BottomSheetUi>
			)}
		</>
	);
});

const s = StyleSheet.create({
	determinateBtn: {
		paddingVertical: 10,
		borderRadius: 10,
		justifyContent: "center",
		width: "100%",
		alignItems: "center"
	},
	bottom: {
		paddingHorizontal: 10,
		paddingTop: 10,
		paddingBottom: 20
	},
	main: {
		paddingHorizontal: 10,
		paddingTop: 10,
		paddingBottom: 40,
	}
});