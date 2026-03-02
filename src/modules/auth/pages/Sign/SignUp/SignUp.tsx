import { BgWrapperUi, ButtonUi, ContextMenuUi, InputUi, LoaderUi, MainText, PhoneInputUi, SecondaryText, SimpleButtonUi } from '@core/ui';
import { navigate } from '@lib/navigation';
import { pxNative } from '@lib/theme';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, TouchableNativeFeedback, View } from 'react-native';
import { getGenderContextMenuItems } from 'src/modules/auth/shared/config/context-menu-data';
import { authActionsStore, authStore } from 'src/modules/auth/stores';
import { SendCodeModal } from 'src/modules/auth/widgets/modals/SendCodeModal';
import { themeStore } from 'src/modules/theme/stores';

export const SignUp = observer(() => {
	const { currentTheme } = themeStore;
	const {
		sendCodeSai: { status }
	} = authActionsStore;
	const {
		signUpForm: {
			values,
			errors,
			disabled,
			setValue
		},
		selectedGender: { selectedGender },
		callingCode: { setCallingCode, callingCode },
		isLinkingBot: { isLinkingBot },
		onSendCodePress
	} = authStore;

	const { t } = useTranslation();
	const genderBtnRef = useRef(null);
	const [isGenderOpen, setIsGenderOpen] = useState(false);

	const genderContextMenuItems = getGenderContextMenuItems();

	const onGenderContextMenuClose = () => setIsGenderOpen(false);
	const onGenderBtnPress = () => setIsGenderOpen(true);

	useEffect(() => {
		return () => setIsGenderOpen(false);
	}, []);

	return (
		<BgWrapperUi
			requiredBg={false}
		>
			<TouchableNativeFeedback onPress={() => Keyboard.dismiss()}>
				<View style={s.main}>
					<View style={s.container}>
						<SendCodeModal />

						<InputUi
							values={values}
							errors={errors}
							setValue={setValue}
							name='name'
							placeholder={t("name_placeholder")}
						/>

						<PhoneInputUi
							values={values}
							setValue={setValue}
							setCallingCode={setCallingCode}
							errors={errors}
							placeholder={t("phone_number_placeholder")}
							name='number'
						/>

						<InputUi
							values={values}
							setValue={setValue}
							placeholder={t("password_placeholder")}
							errors={errors}
							name='password'
						/>

						<InputUi
							values={values}
							errors={errors}
							setValue={setValue}
							name='repeatPassword'
							placeholder={t("repeat_password_placeholder")}
						/>

						<View
							style={[
								s.genderSelector,
								{
									backgroundColor: currentTheme.input_bg_100,
									borderWidth: 1,
									borderColor: currentTheme.input_border_300,
									height: pxNative(currentTheme.input_height_300),
									borderRadius: pxNative(currentTheme.input_radius_300),
									paddingHorizontal: 16,
									elevation: 1,
									position: 'relative'
								}
							]}
						>
							<SecondaryText>{t("gender")}</SecondaryText>
							<SimpleButtonUi
								onPress={onGenderBtnPress}
								ref={genderBtnRef}
								style={{ zIndex: 10000 }}
							>
								<MainText>
									{t(selectedGender == 'Female' ? "contextMenu_female" : selectedGender == 'Male' ? "contextMenu_male" : "not_selected")}
								</MainText>
							</SimpleButtonUi>

							<ContextMenuUi
								anchorRef={genderBtnRef}
								isVisible={isGenderOpen}
								onClose={onGenderContextMenuClose}
								items={genderContextMenuItems}
								selected={selectedGender}
								position="bottom"
								offset={{ x: -10, y: 10 }}
							/>
						</View>

						<ButtonUi
							disabled={disabled || isLinkingBot || status === 'pending'}
							onPress={() => onSendCodePress(t)}
							bRad={10}
						>
							{status === 'pending' || isLinkingBot ? (
								<LoaderUi
									size={"small"}
									color={currentTheme.text_100}
								/>
							) : (
								<MainText>{t('signup')}</MainText>
							)}
						</ButtonUi>

						<View style={s.footer}>
							<MainText>{t('haveaccount')}</MainText>
							<MainText
								style={s.glow}
								onPress={() => navigate('SignIn')}
							>
								{t('signin')}
							</MainText>
						</View>
					</View>
				</View>
			</TouchableNativeFeedback>
		</BgWrapperUi>
	);
});

export const s = StyleSheet.create({
	container: {
		flexDirection: 'column',
		width: 325,
		gap: 14,
	},
	main: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 14
	},
	footer: {
		display: 'flex',
		flexDirection: 'row',
		gap: 5
	},
	glow: {
		fontWeight: 600
	},
	genderSelector: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: "space-between",
		gap: 10,
	},
	genderOptions: {
		flexDirection: 'row',
		gap: 5
	},
	genderBtn: {
		width: 100,
		alignItems: "center",
		justifyContent: "center"
	}
});