import { Box, ButtonUi, LoaderUi, MainText, PhoneInputUi, SimpleInputUi } from '@core/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { moderationActionsStore, moderationStore } from 'src/modules/moderation/stores';
import { themeStore } from 'src/modules/theme/stores';

export const BeModeratorSettings = observer(() => {
	const { currentTheme } = themeStore;
	const { t } = useTranslation();

	const {
		submitModerationForm: { values, setValue, errors, disabled },
		callingCode: { setCallingCode }
	} = moderationStore;

	const {
		sendModerationReqAction,
		sendModerationReqSai
	} = moderationActionsStore;

	return (
		<ProfileSettingsWrapper
			tKey='settings_moderations_req_title'
			height={30}
		>
			{/* MODERATION FORM */}
			<Box fD='column' gap={12.5}>
				<SimpleInputUi
					groupContainer
					title={t('fn_title')}
					errors={errors}
					style={[
						s.input,
						{ color: currentTheme.text_100 }
					]}
					maxLength={100}
					setValue={setValue}
					values={values}
					name={'full_name'}
					placeholder={t('fn_placeholder')}
				/>

				<PhoneInputUi
					paddingTop={0}
					errors={errors}
					values={values}
					name={'phone'}
					setCallingCode={setCallingCode}
					setValue={setValue}
					style={[
						s.input,
						// @ts-ignore
						{ color: currentTheme.text_100 }
					]}
					title={t('number_title')}
					placeholder={'(942)-223-23'}
				/>

				<SimpleInputUi
					groupContainer
					title={t('nationality_title')}
					errors={errors}
					style={[
						s.input,
						{ color: currentTheme.text_100 }
					]}
					maxLength={50}
					setValue={setValue}
					values={values}
					name={'nationality'}
					placeholder={t('nationality_placeholder')}
				/>

				<SimpleInputUi
					groupContainer
					title={t('city_title')}
					errors={errors}
					style={[
						s.input,
						{ color: currentTheme.text_100 }
					]}
					maxLength={32}
					setValue={setValue}
					values={values}
					name={'city'}
					placeholder={t('city_placeholder')}
				/>

				<SimpleInputUi
					groupContainer
					errors={errors}
					title={t('reason_title')}
					style={[
						s.input,
						{ color: currentTheme.text_100 }
					]}
					maxLength={1000}
					setValue={setValue}
					values={values}
					name={'reason'}
					placeholder={t('reason_placeholder')}
				/>

				<ButtonUi
					height={40}
					bRad={12}
					style={s.sbtn}
					disabled={sendModerationReqSai.isPending || disabled}
					onPress={sendModerationReqAction}
				>
					{sendModerationReqSai.status === 'pending' ? (
						<LoaderUi size="small" color="#fff" />
					) : (
						<MainText>{t('submit_moderation_form_button')}</MainText>
					)}
				</ButtonUi>
			</Box>
		</ProfileSettingsWrapper>
	);
});

const s = StyleSheet.create({
	sbtn: { marginTop: 7.5 },
	input: {
		minWidth: '100%',
		minHeight: 25,
	},
});