import { rust } from '@api/api';
import { GroupBtnsType } from '@config/types';
import { checker } from '@lib/helpers';
import { mobxSaiWs } from '@lib/mobx-toolbox/mobxSaiWs';
import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';
import { saiFileUpload } from '@lib/mobx-toolbox/saiFileUpload';
import { FileUploadInstance } from '@lib/mobx-toolbox/saiFileUpload/types';
import { jwtDecode } from '@utils/jwt';
import { AxiosResponse } from 'axios';
import { makeAutoObservable } from 'mobx';
import { authServiceStore } from 'src/modules/auth/stores';
import { profileStore } from '../profile-interactions/profile-interactions';
import { profileServiceStore } from '../profile-service/profile-service';
import { Profile, User } from '../types';
import { EditPrivacySettingsBody, EditProfileBody, GetMyProfileBody, GetPrivacySettingsResponse, SearchUsersParams } from './types';

class ProfileActionsStore {
   constructor() { makeAutoObservable(this); }

   // GET MY PROFILE

   myProfile: MobxSaiWsInstance<Profile> = {};
   setMyProfile = (profile: Profile) => this.myProfile.data = profile;

   getMyProfile = async (needPending = true, tag: string, isUser: boolean, fetchIfHaveData = false, onFinish = (data: Profile) => { }) => {
      const { getMyProfile } = profileStore;
      const { getMyProfileSuccessHandler, getMyProfileErrorHandler } = profileServiceStore;
      const { getTokensAndOtherData } = authServiceStore;

      const tokens = getTokensAndOtherData();
      const dataFromTokens = jwtDecode(tokens.access_token);
      const profile = await getMyProfile();

      const body: GetMyProfileBody = { user_id: dataFromTokens.id };

      this.myProfile = mobxSaiWs(
         body,
         {
            id: ["getMyProfile", (tag || dataFromTokens.tag), profile?.id],
            needPending,
            fetchIfPending: false,
            fetchIfHaveData,
            service: "user",
            method: "get_my_profile",
            storageCache: true,
            takeCachePriority: "localStorage",
            takePath: "profile",
            onSuccess: getMyProfileSuccessHandler,
            onError: getMyProfileErrorHandler,
         }
      );

      return true;
   };

   // EDIT PROFILE LOGO

   editProfileLogo: MobxSaiWsInstance<any> = {};
   profileLogoUpload: FileUploadInstance = [];

   editProfileLogoFileUploadAction = async (file: any) => {
      checker(file, "editProfileLogoAction: file is undefined");
      checker(file.uri && file.uri !== '' && file.uri !== 'error', `editProfileLogoAction: Invalid file URI: ${file?.uri}`);

      this.profileLogoUpload = saiFileUpload(
         file,
         {
            id: "profileLogo",
            maxUploads: 1,
            uploadType: 'single',
            onSuccess: (result, uploadId) => {
               console.log("[editProfileLogoAction] Upload success:", result.url);
               this.editProfileLogoAction(result.url);
            },
            onError: (error, uploadId) => {
               console.error("[editProfileLogoAction] Upload error:", error.message);
            },
            onProgress: (progress, uploadId) => {
               console.log("[editProfileLogoAction] Upload progress:", progress);
            }
         }
      );
   };

   editProfileLogoAction = (finishUrl: string) => {
      const { changeProfileLogo } = profileServiceStore;

      if (!finishUrl || finishUrl === "" || typeof finishUrl !== "string") return;

      changeProfileLogo(finishUrl);

      const body = { more: { logo: finishUrl } };

      this.editProfileLogo = mobxSaiWs(
         body,
         {
            service: "user",
            method: "update_profile",
         }
      );
   };

   // EDIT PROFILE

   editProfile: MobxSaiWsInstance<Profile> = {};

   editProfileAction = (body: EditProfileBody | null = null) => {
      const { editProfileSuccessHandler, editProfileErrorHandler } = profileServiceStore;
      const {
         profileBefore: { setProfileBefore }
      } = profileServiceStore;
      const {
         editProfileForm: { values },
         profile,
         smartProfileReplace
      } = profileStore;

      setProfileBefore(JSON.parse(JSON.stringify(profile)));

      const newProfileData: EditProfileBody = body || {
         name: values.name,
         tag: values.tag,
         more: {
            hb: values.hb || null,
            description: values.description
         }
      };

      smartProfileReplace(newProfileData);

      this.editProfile = mobxSaiWs(
         newProfileData,
         {
            service: "user",
            method: "update_profile",
            onSuccess: editProfileSuccessHandler,
            onError: editProfileErrorHandler,
         }
      );
   };

   // EDIT PROFILE PRIVACY

   editProfilePrivacy: MobxSaiWsInstance<GetPrivacySettingsResponse> = {};

   editProfilePrivacyAction = (
      selectedPrivacyStatus: GroupBtnsType
   ) => {
      const { editPrivacySuccessHandler, editPrivacyErrorHandler } = profileServiceStore;
      const { privacy: { data } } = profileActionsStore;
      const { privacyBefore: { setPrivacyBefore } } = profileServiceStore;
      const { selectedPrivacy: { selectedPrivacy } } = profileStore;

      if (!selectedPrivacy || !selectedPrivacy.field || !data) return;

      setPrivacyBefore(data[selectedPrivacy.field as keyof EditPrivacySettingsBody]);

      const newPrivacyData: Partial<EditPrivacySettingsBody> = {
         [selectedPrivacy.field as keyof EditPrivacySettingsBody]: selectedPrivacyStatus.actionKey?.toUpperCase() as any
      };

      this.editProfilePrivacy = mobxSaiWs(
         newPrivacyData,
         {
            service: "user",
            method: "update_privacy_settings",
            onSuccess: editPrivacySuccessHandler,
            onError: editPrivacyErrorHandler,
         }
      );
   };

   // GET PRIVACY

   privacy: MobxSaiWsInstance<GetPrivacySettingsResponse> = {};

   getPrivacyAction = () => {
      const { getPrivacySuccessHandler, getPrivacyErrorHandler } = profileServiceStore;
      this.privacy = mobxSaiWs(
         {},
         {
            id: "getPrivacyAction",
            service: "user",
            method: "get_privacy_settings",
            takePath: "settings",
            onSuccess: getPrivacySuccessHandler,
            onError: getPrivacyErrorHandler,
         }
      );
   };

   // GET USER

   user: MobxSaiWsInstance<{ profile: User; }> = {};

   getUserAction = (tag: string) => {
      const { getUserSuccessHandler, getUserErrorHandler } = profileServiceStore;

      checker(tag && tag.trim() !== '', "getUserAction: tag is empty or undefined");

      this.user = mobxSaiWs(
         { tag },
         {
            id: "getUserAction" + tag,
            needPending: true,
            fetchIfHaveData: false,
            fetchIfPending: false,
            service: "user",
            method: "get_profile_by_tag",
            onSuccess: getUserSuccessHandler,
            onError: getUserErrorHandler,
         }
      );
   };
}

export const profileActionsStore = new ProfileActionsStore();

export const getProfile = async (tag?: string) => {
   let url = '/user/profile';
   if (tag) url += `/${tag}`;
   return (await rust.get(url)).data;
};
export const searchUsers = async (params: SearchUsersParams) => {
   const realParams: SearchUsersParams = {
      ...params,
      relativeId: params.relativeId ? params.relativeId : 'null'
   };

   return (await rust.get('/user/search', {
      params: realParams,
   })).data;
};
export const editProfile = async (body: EditProfileBody): Promise<AxiosResponse<Profile, any>> => await rust.patch("/user/profile", body);
export const editProfileReturnsData = async (body: EditProfileBody): Promise<Profile> => (await rust.patch("/user/profile", body)).data;
export const getPrivacy = async (): Promise<GetPrivacySettingsResponse> => (await rust.get("/user/privacy")).data;
export const editPrivacy = async (body: Partial<EditPrivacySettingsBody>): Promise<GetPrivacySettingsResponse> => (await rust.patch("/user/privacy", { body }));
