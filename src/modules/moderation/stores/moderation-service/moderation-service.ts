import { showNotify } from '@core/config/const';
import { localStorage } from '@storage/index';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import { makeAutoObservable } from 'mobx';
import { ModerationRequestResponse } from '../moderation-actions/types';

class ModerationServiceStore {
   constructor() { makeAutoObservable(this); }

   // ERROR HANDLERS

   sendModerationReqErrorHandler = (error: AxiosError<any, any>) => {
      if (error.response?.data?.message.includes("already")) {
         showNotify("error", { message: i18next.t("moderation_request_exists") });
         return;
      }

      showNotify("error", { message: i18next.t("moderation_request_error") });
   };

   // SUCCESS HANDLERS

   sendModerationReqSuccessHandler = () =>
      showNotify("success", { message: i18next.t("moderation_request_success") });

   getMyModerationRequestsSuccessHandler = (data: ModerationRequestResponse) =>
      localStorage.set("moderation-request", data);
}

export const moderationServiceStore = new ModerationServiceStore();