import { rust } from '@api/api';
import { mobxSaiWs } from '@lib/mobx-toolbox/mobxSaiWs';
import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';
import { makeAutoObservable } from 'mobx';
import { profileStore } from 'src/modules/user/stores/profile';
import { moderationStore } from '..';
import { ModerationRequestResponse, SendModerationReqBody } from './types';
const moderationServiceStore = require('../moderation-service/moderation-service');

class ModerationActionsStore {
   constructor() { makeAutoObservable(this); }

   sendModerationReqSai: MobxSaiWsInstance<SendModerationReqBody> = {};

   sendModerationReqAction = async () => {
      const { sendModerationReqSuccessHandler, sendModerationReqErrorHandler } = moderationServiceStore;
      const { submitModerationForm: { values } } = moderationStore;
      const { profile } = profileStore;

      if (!profile?.id) return;

      const body: SendModerationReqBody = {
         reason: values.reason,
         phone: values.phone.replace(' ', ''),
         full_name: values.full_name,
         nationality: values.nationality,
         city: values.city,
      };

      this.sendModerationReqSai = mobxSaiWs(
         {
            user_id: profile.id,
            reason: body.reason,
            description: `Phone: ${body.phone}, Full name: ${body.full_name}, Nationality: ${body.nationality}, City: ${body.city}`
         },
         {
            service: "report",
            method: "createModeratorRequest",
            onSuccess: sendModerationReqSuccessHandler,
            onError: sendModerationReqErrorHandler
         }
      );
   };

   // GET MY MODERATION REQUESTS

   myModerationReqSai: MobxSaiWsInstance<ModerationRequestResponse> = {};

   getMyModerationRequestAction = (needPending = true, req?: ModerationRequestResponse) => {
      const { getMyModerationRequestsSuccessHandler, getMyModerationRequestsErrorHandler } = moderationServiceStore;
      const { profile } = profileStore;

      if (!profile?.id) return;

      this.myModerationReqSai = mobxSaiWs(
         {
            user_id: profile.id
         },
         {
            needPending,
            id: 'getMyModerationRequestAction',
            service: "report",
            method: "getMyModeratorRequest",
            onSuccess: getMyModerationRequestsSuccessHandler,
            onError: getMyModerationRequestsErrorHandler
         }
      );

      if (req) {
         this.myModerationReqSai.data = req;
         return;
      }
   };
}

export const moderationActionsStore = new ModerationActionsStore();

export const sendModerationReq = async (body: SendModerationReqBody) => (await rust.post('/report/moderator-request', body)).data;
export const getMyModerationRequests = async () => (await rust.get<ModerationRequestResponse>('/report/my-moderator-request')).data;