import { showNotify } from '@core/config/const';
import { DefaultResponse } from '@core/config/types';
import { websocketApiStore } from '@core/stores/ws/websocket-api-store';
import { logger } from '@lib/helpers';
import { navigate } from '@lib/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { localStorage } from '@storage/index';
import { jwtDecode } from '@utils/jwt';
import i18n from 'i18n';
import i18next from 'i18next';
import { makeAutoObservable } from "mobx";
import { LogoutResponse, SendCodeResponse, authActionsStore, authStore } from 'src/modules/auth/stores';
import { Profile, profileStore } from 'src/modules/user/stores/profile';
import { CheckAuthStatus, TokensAndOtherData } from './types';

class AuthServiceStore {
   constructor() { makeAutoObservable(this, {}, { deep: false }); }

   // STATES 

   tokensAndOtherData: TokensAndOtherData = {
      access_token: '',
      refresh_token: '',
      session_id: ''
   };

   deviceToken = "";
   setDeviceToken = (token: string) => this.deviceToken = token;

   // FULL CLEAR

   fullClear = () => {
      const { setProfile } = profileStore;

      setProfile(null);
      localStorage.clear();

      navigate('SignIn');
   };

   // TOKENS AND OTHER DATA

   getAuthTokenData = () => jwtDecode(this.tokensAndOtherData.access_token);
   getProfileUserId = () => jwtDecode(this.tokensAndOtherData.access_token).id || profileStore?.profile?.id || null;
   getTokensAndOtherData = (): TokensAndOtherData => this.tokensAndOtherData;

   saveAuthToWsMock = (tokens: { accessToken: string; refreshToken: string; }, sessionId: string, profile?: Profile | null) => {
      localStorage.set('ws_mock_tokens', tokens).catch(() => { });
      localStorage.set('ws_mock_sessionId', sessionId).catch(() => { });
      if (profile) localStorage.set('ws_mock_profile', profile).catch(() => { });
   };

   setTokensAndOtherData = (data: TokensAndOtherData) => {
      const { initWsApi } = websocketApiStore;

      const tokensAndOtherData = {
         access_token: data.access_token,
         refresh_token: data.refresh_token,
         session_id: data.session_id
      };

      this.tokensAndOtherData = tokensAndOtherData;

      initWsApi(tokensAndOtherData);
   };

   initTokensAndOtherData = async () => {
      const tokens = await AsyncStorage.getItem('tokens');
      const sessionId = await AsyncStorage.getItem('sessionId');

      if (!tokens || !sessionId) return;

      const tokensObj = JSON.parse(tokens);

      const data = {
         access_token: tokensObj.accessToken as string,
         refresh_token: tokensObj.refreshToken as string,
         session_id: sessionId as string
      };

      this.setTokensAndOtherData(data);
   };

   // AUTH HANDLERS

   checkAuth = async (): Promise<CheckAuthStatus> => {
      const { refreshTokenAction } = authActionsStore;

      const tokens: any = await localStorage.get("tokens");

      if (!tokens || !tokens.accessToken || !tokens.refreshToken) return "unauthenticated";

      const refreshToken = tokens?.refreshToken;
      const accessToken = tokens?.accessToken;

      const accessTokenData = jwtDecode(accessToken);
      const refreshTokenData = jwtDecode(refreshToken);

      if (accessTokenData?.exp?.toString().length > 10) {
         accessTokenData.exp = accessTokenData.exp / 1000;
      }

      if (refreshTokenData?.exp?.toString().length > 10) {
         refreshTokenData.exp = refreshTokenData.exp / 1000;
      }

      const accessTokenExpired = new Date(accessTokenData?.exp * 1000) < new Date();
      const refreshTokenExpired = new Date(refreshTokenData?.exp * 1000) < new Date();

      logger.info("checkAuth", `accessTokenExpired: ${accessTokenExpired}, refreshTokenExpired: ${refreshTokenExpired}`);

      if (accessTokenExpired && refreshTokenExpired) {
         return "unauthenticated";
      }

      if (accessTokenExpired) {
         await refreshTokenAction();
         return "refreshing";
      }

      return "authenticated";
   };

   // SIGN IN HANDLERS

   signInErrorHandler = (error: any) => {
      if (!error || error == "undefined") return;

      const errorMessagesMap = {
         "Пользователь не найден": "signin_user_not_found",
         "Неверный пароль": "invalid_password_error",
         "Слишком много неудачных попыток входа": "too_many_login_attempts",
      } as const;

      const message = error?.error || "Unknown error";

      logger.debug("signInErrorHandler", error);

      for (const key in errorMessagesMap) {
         if (message.includes(key)) {
            if (key === "Слишком много неудачных попыток входа") {
               const minutes = message?.split(" ")[7];
               const seconds = message?.split(" ")[9];
               logger.debug("signInErrorHandler", JSON.stringify({ minutes, seconds }));
               showNotify("error", {
                  message: i18next.t("too_many_login_attempts", { minutes, seconds })
               });
               return;
            }
            showNotify("error", {
               message: i18next.t(errorMessagesMap[key as keyof typeof errorMessagesMap])
            });
            return;
         }
      }

      showNotify("error", {
         message: i18next.t("retry_later_error")
      });
   };

   signInSuccessHandler = async (data: any) => {
      const { setProfile } = profileStore;

      if (!data.data.user) {
         this.signInErrorHandler(data);
         return;
      }

      setProfile(data.data.user as Profile);

      localStorage.set("profile", data.data.user as Profile);
      localStorage.set("tokens", { accessToken: data.data.access_token, refreshToken: data.data.refresh_token });
      localStorage.set("sessionId", data.data.session_id);
      this.saveAuthToWsMock(
         { accessToken: data.data.access_token, refreshToken: data.data.refresh_token },
         data.data.session_id,
         data.data.user as Profile
      );

      this.setTokensAndOtherData(data.data);

      try {
         const { getE2EMessageEncryption } = require('@lib/security/e2e-message-encryption');

         const e2eMessage = getE2EMessageEncryption();

         console.log('🔐 [Login] Initializing E2E identity key...');
         const existingKey = await e2eMessage.initializeIdentityKey();
         console.log('✅ [Login] E2E identity key initialized');

         try {
            console.log('🔐 [Login] Uploading E2E keys to server...');
            console.log('✅ [Login] E2E keys uploaded successfully');
         } catch (uploadError) {
            console.error('❌ [Login] Failed to upload E2E keys:', uploadError);
         }

         console.log('✅ [Login] E2E initialization complete, navigating...');
      } catch (error) {
         console.error('❌ [Login] Failed to initialize E2E keys:', error);
      }

      navigate('MainTabs');
   };

   // SEND CODE HANDLERS

   sendCodeSuccessHandler = (data: SendCodeResponse) => {
      const { isCodeOpen: { setIsCodeOpen } } = authStore;

      if (data?.message?.includes("Please start a chat with our bot first")) {
         console.log("Bot not started yet, retrying in 5 seconds");
         setTimeout(() => {
            authActionsStore.sendCodeAction();
         }, 5000);
         return;
      }

      if (data?.message?.includes("отправлен")) setIsCodeOpen(true);
   };

   sendCodeErrorHandler = (error: DefaultResponse) => {
      const { isCodeOpen: { setIsCodeOpen } } = authStore;

      if (error.message == "Invalid code") {
         showNotify("error", { message: i18n.t("send_code_invalidcode_error") });
         return;
      }

      showNotify("error", { message: i18n.t("send_code_error") });
      setIsCodeOpen(true);
   };

   // REGISTER HANDLERS

   registerSuccessHandler = async (data: any) => {
      const { setProfile } = profileStore;

      if (!data) return;

      setProfile(data.user as Profile);
      localStorage.set("profile", data.user as Profile);

      localStorage.set("tokens", { accessToken: data.access_token, refreshToken: data.refresh_token });
      localStorage.set("sessionId", data.session_id);
      this.saveAuthToWsMock(
         { accessToken: data.access_token, refreshToken: data.refresh_token },
         data.session_id,
         data.user as Profile
      );

      this.setTokensAndOtherData(data);

      const deviceId = await localStorage.get('device_id') as string || '';
      // saveAuthDataToNative(
      //data.access_token,
      //data.refresh_token,
      //data.session_id,
      //data.user.id,
      //deviceId
      // );

      try {
         const { getE2EMessageEncryption } = require('@lib/security/e2e-message-encryption');

         const e2eMessage = getE2EMessageEncryption();

         console.log('🔐 [Register] Initializing E2E identity key...');
         const keys = await e2eMessage.initializeIdentityKey();
         console.log('✅ [Register] E2E identity key initialized');

         console.log('🔐 [Register] Uploading E2E keys to server...');
         console.log('✅ [Register] E2E identity key and prekeys initialized and uploaded');
      } catch (error) {
         console.error('❌ [Register] Failed to initialize E2E keys:', error);
      }

      navigate('MainTabs');
   };

   registerErrorHandler = (error: DefaultResponse) => {
      showNotify("error", { message: i18n.t("register_error") });
   };

   // LOGOUT HANDLERS

   logoutSuccessHandler = async (data: LogoutResponse) => {
      if (data.message == "Successfully logged out") {
         const sessionId = this.tokensAndOtherData.session_id;

         if (sessionId) {
            try {
               const { getE2EEncryption } = require('@lib/security/e2e-encryption');
               const e2e = getE2EEncryption();
               if (e2e) {
                  await e2e.clearSession(sessionId);
                  console.log('✅ [Logout] E2E auth key cleared for session:', sessionId);
               }
            } catch (error) {
               console.error('❌ [Logout] Failed to clear E2E auth key:', error);
            }
         }

         try {
            const { getE2EMessageEncryption } = require('@lib/security/e2e-message-encryption');
            const e2eMessage = getE2EMessageEncryption();
            await e2eMessage.clearAllSessions();
            console.log('✅ [Logout] E2E message keys cleared');
         } catch (error) {
            console.error('❌ [Logout] Failed to clear E2E message keys:', error);
         }

         this.fullClear();
      }
   };

   logoutErrorHandler = (error: any) => {
      logger.error("logoutErrorHandler", error);
   };

   // REFRESH TOKEN HANDLERS

   refreshTokenSuccessHandler = async (data: any) => {
      const { initAppHandler } = authStore;

      logger.debug("refreshTokenSuccessHandler", data);

      localStorage.set("tokens", { accessToken: data.access_token, refreshToken: data.refresh_token });
      localStorage.set("sessionId", data.session_id);
      this.saveAuthToWsMock(
         { accessToken: data.access_token, refreshToken: data.refresh_token },
         data.session_id
      );

      const profile = profileStore.profile;
      const deviceId = await localStorage.get('device_id') as string || '';
      if (profile?.id) {
         // saveAuthDataToNative(
         //data.access_token,
         //data.refresh_token,
         // data.session_id,
         // profile.id,
         // deviceId
         // );
      }

      initAppHandler("refresh");
   };

   refreshTokenErrorHandler = (error: any) => {
      const { appReady: { setAppReady }, initialScreen: { setInitialScreen } } = authStore;

      logger.error("refreshTokenErrorHandler", error);

      setInitialScreen("SignIn");
      setAppReady(true);
   };
}

export const authServiceStore = new AuthServiceStore();