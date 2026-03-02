import { showNotify } from '@config/const';
import { DefaultResponse, ViewPrivacyT } from '@config/types';
import { checker, logger } from '@lib/helpers';
import { navigationService } from '@lib/navigation';
import { generateSimpleUUID } from '@lib/string';
import { localStorage } from '@storage/index';
import { fileServicesStore } from '@stores/file';
import { AxiosResponse } from 'axios';
import i18n from 'i18n';
import i18next from 'i18next';
import { makeAutoObservable } from 'mobx';
import { mobxState } from 'mobx-toolbox';
import { authServiceStore } from 'src/modules/auth/stores';
import { profileActionsStore } from '../profile-actions/profile-actions';
import { EditPrivacySettingsBody, GetMyProfileResponce, GetPrivacySettingsResponse } from '../profile-actions/types';
import { profileStore } from '../profile-interactions/profile-interactions';
import { Profile, User } from '../types';
import { MediaItem } from '@core/ui';
import { formatDiffData } from '@lib/text';

class ProfileServiceStore {
   constructor() { makeAutoObservable(this); }

   profileBefore = mobxState<Profile | null>(null)("profileBefore");
   privacyBefore = mobxState<ViewPrivacyT | null>(null)("privacyBefore");

   // PROMISE STATES

   profilePromise: Promise<Profile> | null = null;
   profileResolver: ((p: Profile) => void) | null = null;

   // METHODS

   getUserProfile = async () => {
      const { getMyProfile } = profileActionsStore;
      const { profile } = profileStore;

      if (!profile) {
         logger.error("getUserProfile", "getUserProfile: profile is not set");

         const { getAuthTokenData } = authServiceStore;

         const dataFromTokens = getAuthTokenData();

         this.profilePromise = new Promise(res => this.profileResolver = res);
         getMyProfile(true, dataFromTokens.tag, true, true);

         return this.profilePromise;
      }

      return Promise.resolve(profile);
   };

   // PROFILE METHODS

   changeProfileLogo = async (finishUrl = "") => {
      const { profile } = profileStore;

      checker(profile, "changeProfileLogo: profile is not set");
      checker(finishUrl, "changeProfileLogo: finishUrl is not set");

      profile.more.logo = finishUrl;
   };

   onFinishUploadProfileLogo = (files: MediaItem[]) => {
      const { editProfileLogoFileUploadAction } = profileActionsStore;

      editProfileLogoFileUploadAction(files[0].file);
   };

   // GET PRIVACY HANDLERS

   getPrivacySuccessHandler = (data: GetPrivacySettingsResponse) => {
      // const { privacySettingsItems: { setPrivacySettingsItems } } = profileStore;
      // setPrivacySettingsItems(getPrivacySettingsBtns(data))
   };

   getPrivacyErrorHandler = (error: AxiosResponse<DefaultResponse>) => {
      showNotify("error", {
         message: i18next.t("get_privacy_error")
      });
   };

   // EDIT PRIVACY HANDLERS

   editPrivacySuccessHandler = (data: GetPrivacySettingsResponse) => {
      localStorage.set("profile-privacy-settings", data);
      logger.success("editPrivacySuccessHandler", "privacy settings successfully edited");
   };

   editPrivacyErrorHandler = (error: AxiosResponse<DefaultResponse>) => {
      const { selectedPrivacy: { selectedPrivacy } } = profileStore;

      showNotify("error", {
         message: i18next.t("edit_privacy_error")
      });

      if (!selectedPrivacy || !selectedPrivacy.field || !profileActionsStore.privacy.data || !this.privacyBefore.privacyBefore) return;

      profileActionsStore.privacy.data[selectedPrivacy.field as keyof EditPrivacySettingsBody] = this.privacyBefore.privacyBefore;
   };

   // GET USER HANDLERS

   getUserSuccessHandler = (data: any) => {
      localStorage.set("user", data?.profile);
      profileStore.setUser(data?.profile as Profile);
      profileStore.setUserToShow(data?.profile as Profile);
   };

   getUserErrorHandler = (error: DefaultResponse) => {
      showNotify("error", {
         message: i18n.t("get_user_error_text")
      });
   };

   // GET USER BY ID HANDLERS

   getUserByIdSuccessHandler = (data: User) => {
      profileStore.setUserToShow({ ...(data as Profile) });
   };

   getUserByIdErrorHandler = (error: DefaultResponse) => {
      showNotify("error", {
         message: i18n.t("get_user_error_text")
      });
   };

   // GET PROFILE HANDLERS

   getMyProfileSuccessHandler = (data: GetMyProfileResponce) => {
      const { setProfile, setUserToShow } = profileStore;

      const name = navigationService.getCurrentRoute()?.name;
      const profile = data;

      if (!profile) return;

      if (this.profileResolver) {
         localStorage.set("profile", profile);
         setProfile(profile);
         this.profileResolver(profile);
         this.profileResolver = null;
      } else if (name == "Profile") {
         localStorage.set("profile", profile);
         setProfile(profile);
      }

      setUserToShow(profile);
   };

   getMyProfileErrorHandler = (error: any) => {
      logger.error("getMyProfileErrorHandler", error);
   };

   // EDIT PROFILE HANDLERS

   editProfileSuccessHandler = (data: Profile) => { };

   onEditProfileError: (() => void) | null = null;

   editProfileErrorHandler = (error: any) => {
      const { setProfile } = profileStore;

      if (this.onEditProfileError) this.onEditProfileError();

      logger.error("editProfileErrorHandler", error);

      setProfile(this.profileBefore.profileBefore);
      showNotify("error", {
         message: i18next.t("edit_profile_error_message")
      });

      return;
   };
}

export const profileServiceStore = new ProfileServiceStore();