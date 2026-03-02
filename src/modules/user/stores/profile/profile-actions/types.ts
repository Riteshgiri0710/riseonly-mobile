import { RoleT, SubscriptionStatus, ViewPrivacyT } from '@config/types';
import { ThemeT } from 'src/modules/theme/stores/types';
import { Profile, User, UserMore } from '../types';

export type EditProfileBody = Partial<Profile> | { more: Partial<UserMore>; };
export type EditUserBody = Partial<User> | { more: Partial<UserMore>; };

// PRIVACY

export interface PrivacyException {
   name: string;
   tag: string;
   id: string;
   more: {
      logo: string;
      who: string;
      role: RoleT;
      p_lang: string[];
   };
}

export interface EditPrivacySettingsBody {
   "plan_rule": ViewPrivacyT;
   "goal_rule": ViewPrivacyT;
   "friend_rule": ViewPrivacyT;
   "hb_rule": ViewPrivacyT;
   "phone_rule": ViewPrivacyT;
   "description_rule": ViewPrivacyT;
   "last_seen_rule": ViewPrivacyT;
   "profile_photo_rule": ViewPrivacyT;
   "calls_rule": ViewPrivacyT;
   "forwards_rule": ViewPrivacyT;
   "groups_rule": ViewPrivacyT;
}

export interface GetPrivacySettingsResponse extends EditPrivacySettingsBody {
   "plan_allow_exceptions": PrivacyException[];
   "plan_deny_exceptions": PrivacyException[];
   "goal_allow_exceptions": PrivacyException[];
   "goal_deny_exceptions": PrivacyException[];
   "friend_allow_exceptions": PrivacyException[];
   "friend_deny_exceptions": PrivacyException[];
   "hb_allow_exceptions": PrivacyException[];
   "hb_deny_exceptions": PrivacyException[];
   "phone_allow_exceptions": PrivacyException[];
   "phone_deny_exceptions": PrivacyException[];
   "description_allow_exceptions": PrivacyException[];
   "description_deny_exceptions": PrivacyException[];
   "lastSeen_allow_exceptions": PrivacyException[];
   "lastSeen_deny_exceptions": PrivacyException[];
   "profilePhoto_allow_exceptions": PrivacyException[];
   "profilePhoto_deny_exceptions": PrivacyException[];
   "calls_allow_exceptions": PrivacyException[];
   "calls_deny_exceptions": PrivacyException[];
   "forwards_allow_exceptions": PrivacyException[];
   "forwards_deny_exceptions": PrivacyException[];
   "groups_allow_exceptions": PrivacyException[];
   "groups_deny_exceptions": PrivacyException[];
}

export interface GetPrivacyParams {
}

export interface SearchUsersParams {
   relativeId: string | null;
   up: boolean;
   page: number;
   limit: number;
   query: string;
}

export interface GetMyProfileBody {
   user_id: string,
}

export interface GetMyProfileResponce extends Profile {
   subscriptionId: string;
   subscriptionStatus: SubscriptionStatus;
   subscriptionProvider: string;
   subscriptionStartDate: string;
   subscriptionEndDate: string;
   subscriptionPeriod: string;
   subscriptionCancelledAt: string;
   subscriptionAutoRenew: boolean;
   subscriptionPriceId: string;
   subscriptionPaymentMethodId: string;
   theme: {
      id: string;
      name: string;
      description: string;
      created_at: string;
      updated_at: string;
      data: ThemeT;
   };
}