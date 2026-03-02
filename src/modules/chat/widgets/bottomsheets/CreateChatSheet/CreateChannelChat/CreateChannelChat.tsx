import { Box, MainText, SelectImageUi, SimpleButtonUi, SimpleInputUi, useBottomSheetNavigation } from '@core/ui';
import { tagActionsStore, tagInteractionsStore } from '@stores/tag';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { chatsInteractionsStore } from 'src/modules/chat/stores/chats';
import { themeStore } from 'src/modules/theme/stores';

export const CreateChannelChat = observer(() => {
	const { currentTheme } = themeStore;
	const { checkTagExist } = tagActionsStore;
	const {
		tagDebounce: { isDebouncing },
		onTagChange
	} = tagInteractionsStore;
	const {
		createChannelForm: {
			values,
			setValue,
			errors,
			disabled
		},
		checkTagSuccessHandler
	} = chatsInteractionsStore;

	const { t } = useTranslation();
	const { navigate } = useBottomSheetNavigation();

	const nextStepPress = () => navigate("channelSettings");
	const onChangeTagInput = (text: string) => onTagChange(text, (data) => checkTagSuccessHandler(data, t));

	return (
		<Box
			style={{ paddingHorizontal: 15 }}
			gap={15}
			bgColor={currentTheme.bg_100}
			justify="space-between"
			height={"100%"}
		>
			<Box
				gap={15}
			>
				<Box
					gap={15}
					fD="row"
					align='center'
					bgColor={currentTheme.bg_200}
					bRad={10}
					width={"100%"}
					style={s.container}
				>
					<SelectImageUi
						size={60}
						maxSelections={1}
					/>

					<Box
						flex={1}
					>
						<SimpleInputUi
							style={s.nameInput}
							values={values}
							setValue={setValue}
							name={"title"}
							maxLength={32}
							placeholder={t("create_channel_chat_name_placeholder")}
							noSpaceAtStart
						/>
					</Box>
				</Box>

				<SimpleInputUi
					loading={checkTagExist}
					onChangeInput={onChangeTagInput}
					style={s.tagInput}
					placeholder={t("create_channel_chat_tag_placeholder")}
					values={values}
					setValue={setValue}
					errors={errors}
					maxLength={32}
					name={"tag"}
					spellCheck={false}
					autoCorrect={false}
					autoCapitalize="none"
					bgColor={currentTheme.bg_200}
					bRad={10}
					noSpaces
					onlyLatinCharacters
				/>

				<SimpleInputUi
					style={s.descriptionInput}
					placeholder={t("create_channel_chat_description_placeholder")}
					values={values}
					setValue={setValue}
					maxLength={250}
					autoCorrect={false}
					spellCheck={false}
					name={"description"}
					bgColor={currentTheme.bg_200}
					bRad={10}
				/>
			</Box>

			<Box
				width={"100%"}
			>
				<SimpleButtonUi
					onPress={nextStepPress}
					bgColor={currentTheme.primary_100}
					centered
					width={"100%"}
					style={s.createButton}
					bRad={10}
					disabled={disabled || isDebouncing}
				>
					<MainText>
						{t("next")}
					</MainText>
				</SimpleButtonUi>
			</Box>
		</Box >
	);
});

const s = StyleSheet.create({
	descriptionInputContainer: {},
	tagInput: {
		borderRadius: 10,
		width: "100%",
		fontSize: 16,
		paddingHorizontal: 20,
		paddingVertical: 15,
	},
	descriptionInput: {
		borderRadius: 10,
		width: "100%",
		fontSize: 16,
		paddingHorizontal: 20,
		paddingVertical: 15,
	},
	container: {
		paddingHorizontal: 20,
		paddingVertical: 15,
	},
	nameInput: {
		width: "100%",
		fontSize: 20,
		height: 50
	},
	createButton: {
		paddingHorizontal: 20,
		paddingVertical: 15,
		width: "100%",
	}
});