import { rust } from '@api/api';
import { mobxSaiWs } from '@lib/mobx-toolbox/mobxSaiWs';
import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';
import { TFunction } from 'i18next';
import { makeAutoObservable } from 'mobx';
import { mobxState } from 'mobx-toolbox';
import { profileStore } from 'src/modules/user/stores/profile';
import { notifyInteractionsStore } from '../notify-interactions/notify-interactions';
import { notifyServiceStore } from '../notify-service/notify-service';
import { GetAllNotificationsParams, GetAllNotificationsResponse } from './types';

class NotifyActionsStore {
   constructor() { makeAutoObservable(this); }

   // GET ALL NOTIFICATIONS

   allNotificationsSai: MobxSaiWsInstance<GetAllNotificationsResponse> = {};
   ALL_NOTIFY_LIMIT = 20;

   getAllNotificationsAction = (sort = 'all', t: TFunction, needPending = true, fetchIfHaveData = true, needAddToArr = true) => {
      const { allNotificationsSuccessHandler, allNotificationsErrorHandler } = notifyServiceStore;
      const { profile } = profileStore;
      const { scrollViewRef: { scrollViewRef } } = notifyInteractionsStore;

      if (!profile?.id) return;

      const params = mobxState<GetAllNotificationsParams>({
         relativeId: null,
         up: false,
         limit: 20,
         sort,
      })("params");

      this.allNotificationsSai = mobxSaiWs(
         {
            user_id: profile.id,
            ...params.params
         },
         {
            id: "getAllNotificationsAction" + sort,
            fetchIfHaveData,
            needPending,
            onSuccess: allNotificationsSuccessHandler,
            onError: allNotificationsErrorHandler,
            dataScope: {
               startFrom: "top",
               scrollRef: scrollViewRef,
               botPercentage: 80,
               isHaveMoreResKey: "isHaveMore",
               setParams: params.setParams,
               relativeParamsKey: "relativeId",
               howMuchGettedToTop: 10000,
               upOrDownParamsKey: "up",
            },
            cacheSystem: {
               limit: this.ALL_NOTIFY_LIMIT
            },
            fetchAddTo: {
               path: needAddToArr ? "items" : '',
               addTo: needAddToArr ? "end" : "reset"
            },
            service: "notify",
            method: "get_notifications"
         }
      );
   };

   // MARK ALL NOTIFICATIONS AS READ

   readAllNotificationsSai: MobxSaiWsInstance<any> = {};

   readAllNotificaitonsAction = async () => {
      const { profile } = profileStore;

      if (!this.allNotificationsSai.data || !profile?.id) return;

      if (this.allNotificationsSai.data.totalUnread !== 0) {
         this.readAllNotificationsSai = mobxSaiWs(
            {
               user_id: profile.id
            },
            {
               service: "notify",
               method: "mark_all_notifications_read"
            }
         );
      }

      this.allNotificationsSai.data.totalUnread = 0;
   };
}

export const notifyActionsStore = new NotifyActionsStore();

const getAllNotifications = async (params: GetAllNotificationsParams) => (await rust.get('/notify/list', { params })).data;
const readAllNotifications = async () => rust.patch('/notify/read-all');
