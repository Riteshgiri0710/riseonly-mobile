import { ModalUi, SimpleInputUi, MainText, SwitchUi, ButtonUi, Box } from '@core/ui';
import { stickerInteractionsStore } from '@modules/sticker/stores';
import { themeStore } from '@modules/theme/stores';
import { profileStore } from '@modules/user/stores/profile';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { editPackModalStyles } from './styles';

export const EditPackModal = observer(() => {
	const { currentTheme } = themeStore;
	const { t } = useTranslation();
	const {
		createPackForm: { values, setValue, errors },
		isEditPackModalOpen,
		setEditPackModalOpen,
		editPackSubmitHandler,
	} = stickerInteractionsStore;

	const isAppAdmin = profileStore.profile?.role === 'ADMIN';

	return (
		<ModalUi
			visible={isEditPackModalOpen.isEditPackModalOpen}
			onClose={() => setEditPackModalOpen(false)}
			width="90%"
			title={t('settings_stickers_edit_pack')}
		>
			<Box style={editPackModalStyles.modalContent} gap={15}>
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
						style={editPackModalStyles.inputContainer}
					/>
					{errors.titleErr ? (
						<MainText color="red" px={11} style={editPackModalStyles.errorText}>
							{errors.titleErr}
						</MainText>
					) : null}
					{isAppAdmin && (
						<Pressable
							onPress={() => setValue('is_default', !values.is_default)}
							style={[
								{ backgroundColor: currentTheme.bg_300 },
								editPackModalStyles.switchContainer,
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
				<ButtonUi onPress={editPackSubmitHandler}>
					<MainText fontWeight="600">{t('save')}</MainText>
				</ButtonUi>
			</Box>
		</ModalUi>
	);
});