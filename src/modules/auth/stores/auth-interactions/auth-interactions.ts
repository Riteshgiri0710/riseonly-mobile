import { GenderT } from '@core/config/types';
import { localStorage } from '@storage/index';
import { hideAsync } from 'expo-splash-screen';
import { TFunction } from 'i18next';
import { makeAutoObservable, reaction } from "mobx";
import { mobxState, useMobxForm } from 'mobx-toolbox';
import { Alert, Linking } from 'react-native';
import { signInSchema, signUpSchema } from 'src/modules/auth/shared/schemas/signSchema';
import { authActionsStore, authServiceStore } from 'src/modules/auth/stores';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

class AuthStore {
	constructor() {
		makeAutoObservable(this);

		reaction(
			() => this.appReady.appReady,
			() => {
				if (!this.appReady.appReady) return;
				hideAsync();
				this.splashScreen.setSplashScreen(true);
			}
		);

		reaction(
			() => this.code.code,
			() => {
				if (this.code.code?.length !== 4) return;
				const { registerAction } = authActionsStore;
				registerAction();
			}
		);
	}

	// STATES

	code = mobxState('')('code', { reset: true });
	callingCode = mobxState('')('callingCode', { reset: true });
	isCodeOpen = mobxState(false)('isCodeOpen', { reset: true });
	selectedGender = mobxState<GenderT>("None")("selectedGender");

	appReady = mobxState(false)('appReady');
	initialScreen = mobxState('SignIn')('initialScreen');
	splashScreen = mobxState(false)('splashScreen');

	// ONBOARDING
	onboardingCompleted = mobxState(false)('onboardingCompleted');
	currentSlide = mobxState(0)('currentSlide', { reset: true });

	// FORMS

	signInForm = useMobxForm(
		{
			number: "",
			password: ""
		},
		signInSchema,
		{ instaValidate: true, resetErrIfNoValue: false, disabled: true }
	);

	signUpForm = useMobxForm(
		{
			name: "",
			number: "",
			password: "",
			repeatPassword: "",
			gender: "none"
		},
		signUpSchema,
		{ instaValidate: true, resetErrIfNoValue: false, disabled: true }
	);

	// LOGIN

	loginError = mobxState(false)("loginErro");

	isLinkingBot = mobxState(false)("isLinkingBot");

	onSendCodePress = async (t: TFunction) => {
		const {
			callingCode: { callingCode },
			isLinkingBot: { setIsLinkingBot },
			signUpForm: { values }
		} = this;

		try {
			setIsLinkingBot(true);

			const phoneNumber = `${callingCode.replace("+", "").replaceAll(" ", "")}${values.number.replaceAll(" ", "")}`;

			const botLink = `tg://resolve?domain=riseonly_bot&start=${phoneNumber}`;
			const webBotLink = `https://t.me/riseonly_bot?start=${phoneNumber}`;

			console.log(`Opening Telegram bot with phone: ${phoneNumber}`);

			try {
				await Linking.openURL(botLink);
				console.log("Successfully opened Telegram app");
			} catch (error) {
				console.error("Failed to open Telegram app:", error);

				try {
					await Linking.openURL(webBotLink);
					console.log("Successfully opened Telegram web");
				} catch (fallbackError) {
					console.error("Failed to open Telegram web:", fallbackError);
					Alert.alert(
						t("notify_error_title"),
						t("telegram_bot_error"),
						[{ text: "OK" }]
					);
					setIsLinkingBot(false);
					return;
				}
			}

			Alert.alert(
				t("telegram_bot_title"),
				t("telegram_bot_instruction"),
				[
					{
						text: t("telegram_bot_continue"),
						onPress: () => {
							setIsLinkingBot(false);
							authActionsStore.sendCodeAction();
						}
					},
					{
						text: t("telegram_bot_cancel"),
						style: "cancel",
						onPress: () => {
							setIsLinkingBot(false);
						}
					}
				]
			);

		} catch (error) {
			console.error("Error in onSendCodePress:", error);
			setIsLinkingBot(false);
			Alert.alert(
				t("notify_error_title"),
				t("telegram_bot_unexpected_error")
			);
		}
	};

	// ONBOARDING METHODS

	checkOnboardingStatus = async () => {
		try {
			const completed = await localStorage.get<boolean>(ONBOARDING_COMPLETED_KEY);
			this.onboardingCompleted.setOnboardingCompleted(completed || false);
			return completed || false;
		} catch (error) {
			console.error('Error checking onboarding status:', error);
			return false;
		}
	};

	initAppHandler = async (from?: "refresh") => {
		const { checkAuth } = authServiceStore;

		const onboardingCompleted = await this.checkOnboardingStatus();

		if (!onboardingCompleted) {
			this.initialScreen.setInitialScreen("Onboarding");
			this.appReady.setAppReady(true);
			return;
		}

		if (from === "refresh") {
			this.appReady.setAppReady(true);
			return;
		}

		const authStatus = await checkAuth();

		if (authStatus === "refreshing") this.initialScreen.setInitialScreen("Posts");
		if (authStatus === "authenticated") this.initialScreen.setInitialScreen("Posts");

		this.appReady.setAppReady(true);
	};

	completeOnboarding = async () => {
		try {
			await localStorage.set(ONBOARDING_COMPLETED_KEY, true);
			this.onboardingCompleted.setOnboardingCompleted(true);
		} catch (error) {
			console.error('Error completing onboarding:', error);
		}
	};

	goToNextSlide = () => {
		this.currentSlide.setCurrentSlide(this.currentSlide.currentSlide + 1);
	};

	goToPreviousSlide = () => {
		if (this.currentSlide.currentSlide > 0) {
			this.currentSlide.setCurrentSlide(this.currentSlide.currentSlide - 1);
		}
	};

	skipOnboarding = async () => {
		await this.completeOnboarding();
	};
}

export const authStore = new AuthStore();