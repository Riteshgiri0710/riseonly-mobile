import { BottomSheetScreen, BottomSheetUi, Box, MainText, SecondaryText, SimpleButtonUi, SimpleInputUi, SwitchUi } from '@core/ui';
import { GROUPED_BTNS_HEIGHT } from '@lib/theme';
import { chatsInteractionsStore } from '@modules/chat/stores/chats';
import { themeStore } from '@modules/theme/stores';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

export const CreateChatLinkSheet = observer(() => {
	const { currentTheme } = themeStore;
	const {
		isCreateChatLinkOpen: { isCreateChatLinkOpen, setIsCreateChatLinkOpen },
		createChatLinkCloseSignal: { createChatLinkCloseSignal, setCreateChatLinkCloseSignal }
	} = chatsInteractionsStore;

	const { t } = useTranslation();

	const screens: BottomSheetScreen[] = useMemo(() => [
		{ name: 'menu', component: CreateChatLinkMenu, title: t('create_chat_sheet_title'), heightPercent: 10 },
	], [t]);

	return (
		<>
			{isCreateChatLinkOpen && (
				<BottomSheetUi
					bottomSheetBgColor={currentTheme.bg_100}
					isBottomSheet={isCreateChatLinkOpen}
					setIsBottomSheet={setIsCreateChatLinkOpen}
					onCloseSignal={createChatLinkCloseSignal}
					setOnCloseSignal={setCreateChatLinkCloseSignal}
					title={t('new_link')}
					screens={screens}
					initialScreen="menu"
					dynamicSizing
				/>
			)}
		</>
	);
});

export const CreateChatLinkMenu = observer(() => {
	const { currentTheme } = themeStore;
	const { createChatLinkForm: { values, setValue } } = chatsInteractionsStore;
	const { createChatLinkHandler } = chatsInteractionsStore;

	const { t } = useTranslation();

	return (
		<Box
			style={{ paddingHorizontal: 15 }}
			bgColor={currentTheme.bg_100}
			gap={30}
			width={"100%"}
		>
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
				>
					<SimpleButtonUi
						bgColor={currentTheme.primary_100}
						height={GROUPED_BTNS_HEIGHT - 5}
						bRad={30}
						width={"100%"}
						centered
						onPress={createChatLinkHandler}
					>
						<MainText>
							{t("create_link")}
						</MainText>
					</SimpleButtonUi>
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