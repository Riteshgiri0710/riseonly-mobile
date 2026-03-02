import { rust } from '@api/api';
import { DefaultResponse, GenderT } from '@core/config/types';
import { checker, logger } from '@lib/helpers';
// @ts-ignore
import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs';
import { localStorage } from '@storage/index';
import { getDeviceMetadata } from '@utils/device-info';
import { AxiosResponse } from 'axios';
import { makeAutoObservable } from "mobx";
import { mobxSaiFetch, mobxSaiHandler } from 'mobx-toolbox';
import { Platform } from 'react-native';
import { Profile, profileStore } from 'src/modules/user/stores/profile';
import { authStore } from '../auth-interactions/auth-interactions';
import { authServiceStore } from '../auth-service/auth-service';
import { AuthLoginBody, AuthRegisterBody, LogoutBody, RefreshTokenBody, SendCodeBody, SendCodeResponse } from './types';

class AuthActionsStore {
   constructor() { makeAutoObservable(this); }

   // SEND-CODE

   sendCodeSai: MobxSaiWsInstance<SendCodeResponse> = {};

   sendCodeAction = async () => {
      const { sendCodeSuccessHandler, sendCodeErrorHandler } = authServiceStore;
      const {
         callingCode: { callingCode },
         signUpForm: { values: { number } }
      } = authStore;

      const phoneNumber = `${callingCode.replaceAll(" ", "")}${number.replaceAll(" ", "")}`;
      console.log(`Sending code to phone number: ${phoneNumber}`);

      const message: SendCodeBody = {
         phone_number: phoneNumber
      };

      this.sendCodeSai = mobxSaiFetch(
         () => sendCode(message),
         {
            id: "sendCodeAction",
            fetchIfPending: false,
            fetchIfHaveData: false,
         }
      );

      mobxSaiHandler(
         this.sendCodeSai,
         sendCodeSuccessHandler,
         sendCodeErrorHandler,
      );
   };

   // REGISTER

   registerSai: MobxSaiWsInstance<any> = {};

   registerAction = async () => {
      const { registerSuccessHandler, registerErrorHandler } = authServiceStore;
      const {
         signUpForm: { values },
         code: { code },
         callingCode: { callingCode }
      } = authStore;
      const { deviceToken } = authServiceStore;

      const phoneNumber = `${callingCode.replace("+", "").replaceAll(" ", "")}${values.number.replaceAll(" ", "")}`;

      const deviceMetadata = await getDeviceMetadata();

      const body: AuthRegisterBody = {
         name: values.name,
         password: values.password,
         phone_number: phoneNumber,
         code,
         gender: values.gender as GenderT,
         device_token: deviceToken || undefined,
         device_info: deviceMetadata.device_info,
         device_type: deviceMetadata.device_type,
         platform: deviceMetadata.platform,
         user_agent: deviceMetadata.user_agent,
         browser: deviceMetadata.browser,
         ip_address: "",
      };

      this.registerSai = mobxSaiFetch(
         () => authRegister(body),
         {
            id: "registerAction",
            fetchIfHaveData: true,
            fetchIfPending: false,
         }
      );

      mobxSaiHandler(
         this.registerSai,
         registerSuccessHandler,
         registerErrorHandler,
      );
   };

   // LOGIN

   loginSai: MobxSaiWsInstance<any> = {};

   loginAction = async () => {
      const { signInSuccessHandler, signInErrorHandler } = authServiceStore;
      const {
         signInForm: { values },
         callingCode: { callingCode }
      } = authStore;
      const { deviceToken } = authServiceStore;

      const phoneNumber = `${callingCode.replace("+", "").replaceAll(" ", "")}${values.number.replaceAll(" ", "")}`;

      const deviceMetadata = await getDeviceMetadata();

      const body: AuthLoginBody = {
         phone_number: phoneNumber,
         password: values.password,
         device_token: deviceToken || undefined,
         device_info: deviceMetadata.device_info,
         device_type: deviceMetadata.device_type,
         platform: deviceMetadata.platform,
         user_agent: deviceMetadata.user_agent,
         browser: deviceMetadata.browser,
         ip_address: "",
      };

      this.loginSai = mobxSaiFetch(
         () => authLogin(body),
         {
            id: "loginAction",
            fetchIfPending: false,
            fetchIfHaveData: true,
         }
      );

      mobxSaiHandler(
         this.loginSai,
         signInSuccessHandler,
         signInErrorHandler,
      );
   };

   // LOGOUT

   logout: MobxSaiWsInstance<DefaultResponse> = {};

   logOutAction = async () => {
      const { getTokensAndOtherData, logoutSuccessHandler, logoutErrorHandler } = authServiceStore;
      const { profile } = profileStore;

      if (!profile) return;

      const tokensAndOtherData = getTokensAndOtherData();

      const body: LogoutBody = {
         user_id: profile.id,
         session_id: tokensAndOtherData.session_id,
         refresh_token: tokensAndOtherData.refresh_token,
      };

      this.logout = mobxSaiFetch(
         () => logOut(),
         {
            id: "logoutAction",
            fetchIfHaveData: true,
            fetchIfPending: false,
         }
      );

      mobxSaiHandler(
         this.logout,
         logoutSuccessHandler,
         logoutErrorHandler,
      );
   };

   // REFRESH TOKEN

   refreshToken: MobxSaiWsInstance<any> = {};

   refreshTokenAction = async () => {
      const { refreshTokenSuccessHandler, refreshTokenErrorHandler } = authServiceStore;

      const tokens: any = await localStorage.get("tokens");

      if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
         return "unauthenticated";
      }

      const refresh_token = tokens?.refreshToken;

      const body: RefreshTokenBody = {
         refresh_token: refresh_token,
      };

      this.refreshToken = mobxSaiFetch(
         () => refreshToken(body),
         {
            id: "refreshTokenAction",
            fetchIfHaveData: true,
            fetchIfPending: false,
         }
      );

      mobxSaiHandler(
         this.refreshToken,
         refreshTokenSuccessHandler,
         refreshTokenErrorHandler,
      );
   };

   // SYNC DEVICE TOKEN

   syncDeviceTokenSai: MobxSaiWsInstance<any> = {};

   syncDeviceTokenAction = async (userId: string) => {
      const { deviceToken } = authServiceStore;

      checker(deviceToken && userId, "syncDeviceTokenAction: missing token or user_id");

      const body = {
         user_id: userId,
         device_token: deviceToken,
         platform: Platform.OS as string
      };

      console.log("🔄 Syncing device token for user:", userId);

      this.syncDeviceTokenSai = mobxSaiFetch(
         () => syncDeviceToken(body),
         {
            id: "syncDeviceTokenAction",
            fetchIfHaveData: true,
            fetchIfPending: false,
         }
      );

      mobxSaiHandler(
         this.syncDeviceTokenSai,
         () => logger.success("syncDeviceTokenAction", "Device token synced successfully"),
         (error) => logger.error("syncDeviceTokenAction", error),
      );
   };
}
export const authActionsStore = new AuthActionsStore();

export const sendCode = async (body: SendCodeBody) => (await rust.post('/auth/send-code', body)).data;
export const authRegister = async (body: AuthRegisterBody) => (await rust.post('/auth/register', body)).data;
export const authLogin = async (body: AuthLoginBody): Promise<AxiosResponse<Profile, any>> => await rust.post('/auth/login', body);
export const logOut = async (): Promise<DefaultResponse> => (await rust.post("/auth/logout")).data;
export const refreshToken = async (body: RefreshTokenBody): Promise<any> => (await rust.post("/auth/refresh", body)).data;
export const syncDeviceToken = async (body: { user_id: string, device_token: string, platform: string; }): Promise<any> => (await rust.post("/auth/sync_device_token", body)).data;