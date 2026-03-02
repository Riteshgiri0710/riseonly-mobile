import { BottomSheetScreen, BottomSheetUi, Box, MainText, SecondaryText, SimpleButtonUi, SimpleInputUi, SwitchUi } from '@core/ui';
import { checker } from '@lib/helpers';
import { GROUPED_BTNS_HEIGHT } from '@lib/theme';
import { chatsInteractionsStore } from '@modules/chat/stores/chats';
import { themeStore } from '@modules/theme/stores';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

export const EditChatLinkSheet = observer(() => {
	const { currentTheme } = themeStore;
	const {
		isEditChatLinkOpen: { isEditChatLinkOpen, setIsEditChatLinkOpen },
		editChatLinkCloseSignal: { editChatLinkCloseSignal, setEditChatLinkCloseSignal }
	} = chatsInteractionsStore;

	const { t } = useTranslation();

	const screens: BottomSheetScreen[] = useMemo(() => [
		{ name: 'menu', component: EditChatLinkMenu, title: t('edit_chat_link_sheet_title'), heightPercent: 10 },
	], [t]);

	return (
		<>
			{isEditChatLinkOpen && (
				<BottomSheetUi
					bottomSheetBgColor={currentTheme.bg_100}
					isBottomSheet={isEditChatLinkOpen}
					setIsBottomSheet={setIsEditChatLinkOpen}
					onCloseSignal={editChatLinkCloseSignal}
					setOnCloseSignal={setEditChatLinkCloseSignal}
					title={t('edit_chat_link_sheet_title')}
					screens={screens}
					initialScreen="menu"
					dynamicSizing
				/>
			)}
		</>
	);
});

export const EditChatLinkMenu = observer(() => {
	const { currentTheme } = themeStore;
	const {
		editChatLinkForm: { values, setValue },
		selectedLink,
		onCopyLinkHandler,
		onShareLinkHandler
	} = chatsInteractionsStore;
	const { editChatLinkHandler, deleteChatLinkHandler } = chatsInteractionsStore;

	checker(selectedLink, "[EditChatLinkMenu]: no selected link");

	const { t } = useTranslation();

	useEffect(() => {
		runInAction(() => {
			setValue("name", selectedLink.name || "");
			setValue("expires_at", selectedLink.expires_at || 0);
			setValue("usage_limit", selectedLink.usage_limit || 0);
			setValue("creates_join_request", selectedLink.creates_join_request || false);
		});
	}, [selectedLink, setValue]);

	return (
		<Box
			style={{ paddingHorizontal: 15 }}
			bgColor={currentTheme.bg_100}
			gap={30}
			width={"100%"}
		>
			<Box
				gap={40}
				width={"100%"}
			>
				<Box
					gap={20}
				>
					<Box
						height={GROUPED_BTNS_HEIGHT}
						width={"100%"}
						bgColor={currentTheme.bg_200}
						bRad={10}
						centered
						style={{ paddingHorizontal: 50 }}
					>
						<MainText
							numberOfLines={1}
						>
							{selectedLink.link}
						</MainText>
					</Box>

					<Box
						fD='row'
						align='center'
						gap={5}
					>
						<SimpleButtonUi
							bgColor={currentTheme.primary_100}
							height={GROUPED_BTNS_HEIGHT - 5}
							bRad={10}
							flex={1}
							centered
							onPress={() => onCopyLinkHandler(t)}
						>
							<MainText>
								{t("copy")}
							</MainText>
						</SimpleButtonUi>

						<SimpleButtonUi
							bgColor={currentTheme.primary_100}
							height={GROUPED_BTNS_HEIGHT - 5}
							bRad={10}
							centered
							flex={1}
							onPress={() => onShareLinkHandler(t)}
						>
							<MainText>
								{t("share")}
							</MainText>
						</SimpleButtonUi>
					</Box>
				</Box>

				<Box
					gap={20}
					width={"100%"}
				>
					<SimpleInputUi
						values={values}
						name="name"
						variant="groupedBtn"
						setValue={setValue}
						style={s.input}
						title={t("link_name")}
						endGroupTitle={t("link_name_explanation")}
						placeholder={t("link_name")}
					/>

					<Box fD="row" align="center" justify="space-between" width="100%">
						<Box flex={1}>
							<MainText>{t("invation_requests")}</MainText>
							<SecondaryText style={{ marginTop: 4 }}>{t("invation_requests_explanation")}</SecondaryText>
						</Box>
						<SwitchUi
							isOpen={values.creates_join_request}
							onPress={() => setValue("creates_join_request", !values.creates_join_request)}
						/>
					</Box>

					{/* TODO: add range ui component for expires in, and usage limit params to method create chat link */}

					<Box
						width={"100%"}
						fD='row'
						flex={1}
						gap={5}
					>
						<SimpleButtonUi
							bgColor={currentTheme.btn_bg_200}
							height={GROUPED_BTNS_HEIGHT - 5}
							bRad={30}
							flex={1}
							centered
							onPress={() => deleteChatLinkHandler()}
						>
							<MainText>
								{t("delete_link")}
							</MainText>
						</SimpleButtonUi>

						<SimpleButtonUi
							bgColor={currentTheme.primary_100}
							height={GROUPED_BTNS_HEIGHT - 5}
							bRad={30}
							centered
							flex={1}
							onPress={() => editChatLinkHandler()}
						>
							<MainText>
								{t("save")}
							</MainText>
						</SimpleButtonUi>
					</Box>
				</Box>
			</Box>
		</Box>
	);
});

const s = StyleSheet.create({
	input: {
		width: "100%",
	}
});