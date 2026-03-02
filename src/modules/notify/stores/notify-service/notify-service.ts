import { showNotify } from '@core/config/const';
import { localStorage } from '@storage/index';
import { AxiosError } from 'axios';
import { TFunction } from 'i18next';
import { makeAutoObservable } from 'mobx';
import { useMobxUpdate } from 'mobx-toolbox';
import { GetAllNotificationsResponse } from '../notify-actions/types';
import { notifyInteractionsStore } from '../notify-interactions/notify-interactions';

class NotifyServiceStore {
   constructor() { makeAutoObservable(this); }

   // ===== HANDLERS =====

   // ALL NOTIFICATIONS

   allNotificationsErrorHandler = (err: AxiosError<any, any>, t: TFunction) => {
      console.log("[allNotifications]: ", err.message);
      showNotify("error", { message: t("error_notify_fetch") });
   };

   allNotificationsSuccessHandler = async (data: GetAllNotificationsResponse) => {
      const { setNotificationUpdater } = notifyInteractionsStore;

      setNotificationUpdater(useMobxUpdate(() => data?.items));
      localStorage.set("user-notifications", data?.items);
   };
}

export const notifyServiceStore = new NotifyServiceStore();