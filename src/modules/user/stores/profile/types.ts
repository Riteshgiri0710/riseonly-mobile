import { GenderT, RoleT, SubscriptionStatus } from '@config/types';
import { ThemeT } from 'src/modules/theme/stores/types';

export interface User {
   id: string;
   created_at: string;
   updated_at: string;
   phone: string;
   name: string;
   is_premium: boolean;
   tag: string;
   user_chat_id: string;
   customer_id: string;
   gender: GenderT;
   more_id: string;
   role: RoleT;
   is_blocked: boolean;
   more: UserMore;
   posts_count: number;
   friends_count: number;
   subs_count: number;
   subscribers_count: number;
   friend_request_id: null | string;
   is_subbed: null | boolean;
   is_friend: null | boolean;

   is_online?: boolean;
}

export interface UserMore {
   id: string;
   description: string;
   hb: string | null;
   streak: number;
   p_lang: string[];
   plans: string[];
   subscribers: number;
   friends: number;
   status: string;
   level: number;
   stack: string[];
   logo: string;
   banner: string;
   who: string;
   rating: number;
   is_online: boolean;
   last_seen: number;

   subscription_id: string;
   subscription_status: SubscriptionStatus;
   subscription_provider: string;
   subscription_start_date: string;
   subscription_end_date: string;
   subscription_period: string;
   subscription_cancelled_at: string;
   subscription_auto_renew: boolean;
   subscription_price_id: string;
   subscription_payment_method_id: string;
}

export interface Profile extends User {

   tokens: {
      access_token: string;
      refresh_token: string;
      session_id: string;
   },
   subscription_id: string;
   subscription_status: SubscriptionStatus;
   subscription_provider: string;
   subscription_start_date: string;
   subscription_end_date: string;
   subscription_period: string;
   subscription_cancelled_at: string;
   subscription_auto_renew: boolean;
   subscription_price_id: string;
   subscription_payment_method_id: string;
   theme: {
      id: string;
      name: string;
      description: string;
      created_at: string;
      updated_at: string;
      data: ThemeT;
   };
}

export interface ProfileBase {
   base: User;
   tokens: {
      access_token: string;
      refresh_token: string;
      session_id: string;
   },
   subscription_id: string;
   subscription_status: SubscriptionStatus;
   subscription_provider: string;
   subscription_start_date: string;
   subscription_end_date: string;
   subscription_period: string;
   subscription_cancelled_at: string;
   subscription_auto_renew: boolean;
   subscription_price_id: string;
   subscription_payment_method_id: string;
   theme: {
      id: string;
      name: string;
      description: string;
      created_at: string;
      updated_at: string;
      data: ThemeT;
   };
}