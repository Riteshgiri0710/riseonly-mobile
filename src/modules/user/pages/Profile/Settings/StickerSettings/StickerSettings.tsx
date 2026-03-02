import { Box, ButtonUi, MainText, ModalUi, SimpleButtonUi, SimpleInputUi, SwitchUi } from '@core/ui';
import { themeStore } from '@modules/theme/stores';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';
import { stickerInteractionsStore } from 'src/modules/sticker/stores';
import { profileStore } from 'src/modules/user/stores/profile';

export const StickerSettings = observer(() => {
	const { currentTheme } = themeStore;
	const { t } = useTranslation();

	const {
		createPackForm: { values, setValue, errors },
		isCreatePackModalOpen,
		setCreatePackModalOpen,
		createPackSubmitHandler,
	} = stickerInteractionsStore;

	const isAdmin = profileStore.profile?.role === 'ADMIN';

	return (
		<ProfileSettingsWrapper
			tKey="settings_stickers_title"
			height={45}
		>
			<Box gap={12}>
				<SimpleButtonUi
					onPress={() => setCreatePackModalOpen(true)}
					style={styles.createBtn}
				>
					<MainText fontWeight="600">{t('settings_stickers_create_pack')}</MainText>
				</SimpleButtonUi>

				<ModalUi
					visible={isCreatePackModalOpen.isCreatePackModalOpen}
					onClose={() => setCreatePackModalOpen(false)}
					width="90%"
					title={t('settings_stickers_create_pack')}
				>
					<Box style={styles.modalContent} gap={15}>
						<Box gap={10}>
							<SimpleInputUi
								name="title"
								values={values}
								setValue={setValue}
								errors={errors}
								placeholder={t('settings_stickers_modal_title_placeholder')}
								maxLength={32}
								groupContainerStyle={[
									{ backgroundColor: currentTheme.bg_300 },
									{ borderRadius: 30, overflow: 'hidden' },
								]}
								style={styles.inputContainer}
							/>
							{errors.titleErr ? (
								<MainText color="red" px={11} style={styles.errorText}>
									{errors.titleErr}
								</MainText>
							) : null}
							{isAdmin && (
								<Pressable
									onPress={() => setValue('is_default', !values.is_default)}
									style={[
										{ backgroundColor: currentTheme.bg_300 },
										styles.switchContainer,
									]}
								>
									<Box fD="row" align="center" justify="space-between" width="100%">
										<Box flex={1}>
											<MainText>{t('settings_stickers_make_default')}</MainText>
										</Box>
										<SwitchUi
											isOpen={values.is_default}
											onPress={() => setValue('is_default', !values.is_default)}
										/>
									</Box>
								</Pressable>
							)}
						</Box>

						<ButtonUi onPress={createPackSubmitHandler}>
							<MainText fontWeight="600">{t('settings_stickers_create_btn')}</MainText>
						</ButtonUi>
					</Box>
				</ModalUi>
			</Box>
		</ProfileSettingsWrapper>
	);
});

const styles = StyleSheet.create({
	switchContainer: {
		borderRadius: 30,
		paddingVertical: 8,
		paddingHorizontal: 15,
	},
	inputContainer: {
		height: 45,
		paddingHorizontal: 15,
		width: '100%',
	},
	createBtn: {
		paddingVertical: 14,
		paddingHorizontal: 20,
		alignItems: 'center',
		borderRadius: 12,
	},
	modalContent: {
		padding: 5,
		width: '100%',
	},
	errorText: {
		marginTop: -4,
	},
});
