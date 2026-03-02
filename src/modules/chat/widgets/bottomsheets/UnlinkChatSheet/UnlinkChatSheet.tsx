import { RootStackParamList } from '@app/router';
import { BottomSheetScreen, BottomSheetUi, Box, ButtonUi, MainText } from '@core/ui';
import { chatsInteractionsStore } from '@modules/chat/stores/chats';
import { themeStore } from '@modules/theme/stores';
import { RouteProp, useRoute } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

export const UnlinkChatSheet = observer(() => {
	const { currentTheme } = themeStore;
	const {
		isUnlinkChatOpen: { isUnlinkChatOpen, setIsUnlinkChatOpen },
		unlinkChatCloseSignal: { unlinkChatCloseSignal, setUnlinkChatCloseSignal }
	} = chatsInteractionsStore;

	const { params: { selectedChat } } = useRoute<RouteProp<RootStackParamList, 'ChatSettingsLinkedChat'>>();
	const { t } = useTranslation();

	const screens: BottomSheetScreen[] = useMemo(() => [
		{ name: 'menu', component: UnlinkChatMenu, title: t(`unlink_${selectedChat.type.toLowerCase()}_sheet_title`), heightPercent: 10 },
	], [t]);

	return (
		<>
			{isUnlinkChatOpen && (
				<BottomSheetUi
					bottomSheetBgColor={currentTheme.bg_100}
					isBottomSheet={isUnlinkChatOpen}
					setIsBottomSheet={setIsUnlinkChatOpen}
					onCloseSignal={unlinkChatCloseSignal}
					setOnCloseSignal={setUnlinkChatCloseSignal}
					title={t(`unlink_${selectedChat.type.toLowerCase()}_sheet_title`)}
					screens={screens}
					initialScreen="menu"
					dynamicSizing
				/>
			)}
		</>
	);
});

export const UnlinkChatMenu = observer(() => {
	const { currentTheme } = themeStore;
	const { unlinkChatConfirmHandler } = chatsInteractionsStore;

	const { t } = useTranslation();

	return (
		<Box
			style={{ paddingHorizontal: 15, marginTop: 10 }}
			bgColor={currentTheme.bg_100}
			gap={30}
			width={"100%"}
		>
			<Box
				gap={20}
				width={"100%"}
			>
				<ButtonUi
					onPress={unlinkChatConfirmHandler}
				>
					<MainText>
						{t('continue')}
					</MainText>
				</ButtonUi>
			</Box>
		</Box>
	);
});

const s = StyleSheet.create({
	input: {
		width: "100%",
	}
});