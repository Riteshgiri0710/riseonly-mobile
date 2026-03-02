import { AsyncDataRender, BottomSheetScreen, BottomSheetUi, Box, ButtonUi, MainText, SecondaryText, UserLogo } from '@core/ui';
import { checker } from '@lib/helpers';
import { ChatTitle } from '@modules/chat/components/Chat/Bar';
import { chatsActionsStore, chatsInteractionsStore } from '@modules/chat/stores/chats';
import { themeStore } from '@modules/theme/stores';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

export const PreviewInviteLinkChatBottomSheet = observer(() => {
	const { currentTheme } = themeStore;
	const {
		isPreviewInviteLinkChatOpen: { isPreviewInviteLinkChatOpen, setIsPreviewInviteLinkChatOpen },
		previewInviteLinkChatCloseSignal: { previewInviteLinkChatCloseSignal, setPreviewInviteLinkChatCloseSignal }
	} = chatsInteractionsStore;

	const { t } = useTranslation();

	const screens: BottomSheetScreen[] = useMemo(() => [
		{ name: 'menu', component: PreviewInviteLinkChatMenu, title: t(`preview_invite_link_chat_sheet_title`), heightPercent: 10 },
	], [t]);

	return (
		<>
			{isPreviewInviteLinkChatOpen && (
				<BottomSheetUi
					bottomSheetBgColor={currentTheme.bg_100}
					isBottomSheet={isPreviewInviteLinkChatOpen}
					setIsBottomSheet={setIsPreviewInviteLinkChatOpen}
					onCloseSignal={previewInviteLinkChatCloseSignal}
					setOnCloseSignal={setPreviewInviteLinkChatCloseSignal}
					screens={screens}
					initialScreen="menu"
					dynamicSizing
				/>
			)}
		</>
	);
});

export const PreviewInviteLinkChatMenu = observer(() => {
	const { currentTheme } = themeStore;
	const {
		inviteLinkPreview: { data, status }
	} = chatsActionsStore;
	const { onAcceptInviteOrSendJoinRequestHandler } = chatsInteractionsStore;

	const { t } = useTranslation();

	const onPressConfirmHandler = () => {
		checker(data, "[onPressConfirmHandler] no data");
		onAcceptInviteOrSendJoinRequestHandler(data);
	};

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
				align='center'
			>
				<AsyncDataRender
					data={data}
					status={status}
					loadingComponentStyle={{
						height: "100%",
						width: "100%",
						justifyContent: "center",
						alignContent: "center",
					}}
					renderContent={() => {
						return (
							<Box
								width={"70%"}
								align='center'
								gap={5}
							>
								<UserLogo
									size={75}
									source={data?.chat?.logo_url}
								/>

								<Box
									align='center'
								>
									<ChatTitle
										chat={data?.chat}
										titlePx={20}
										iconSize={18}
									/>

									<SecondaryText
										numberOfLines={3}
										tac={"center"}
									>
										{data?.chat?.description}
									</SecondaryText>
								</Box>
							</Box>
						);
					}}
				/>

				<ButtonUi
					onPress={onPressConfirmHandler}
				>
					<MainText>
						{t('confirm')}
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