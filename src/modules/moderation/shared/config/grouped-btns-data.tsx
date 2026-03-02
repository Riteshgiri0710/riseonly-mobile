import { getModerationRequestStatuses, todoNotify } from '@config/const';
import { GroupBtnsType } from '@config/types';
import { Ionicons } from '@expo/vector-icons';
import { ModerationSettingsIcon } from '@icons/MainPage/Settings/ModerationSettingsIcon';
import { defaultGroupedBtsnRightIcon } from '@lib/theme';
import i18next, { TFunction } from 'i18next';
import { ModerationRequestResponse, moderationStore } from 'src/modules/moderation/stores';
import { themeStore } from 'src/modules/theme/stores';

// MODERATION SETTINGS

export const getModerationSettingsBtns = (t: TFunction) => {
   const height = themeStore.groupedBtnsHeight;

   const settingsButtons: GroupBtnsType[] = [
      {
         group: "moderation",
         text: t("settings_moderations_req_title"),
         url: "BeModeratorSettings",
         icon: <ModerationSettingsIcon />,
         height,
         leftIcon: defaultGroupedBtsnRightIcon,
      },
      {
         group: "moderation",
         text: t("settings_my_moderations_reqs_title"),
         url: "MyModerationRequestsSettings",
         height,
         icon: <ModerationSettingsIcon />,
         leftIcon: defaultGroupedBtsnRightIcon,
      }
   ];

   return settingsButtons;
};

export const getMyModerationRequestSettings = (req: ModerationRequestResponse) => {
   const { isModerationReasonModalOpen: { setIsModerationReasonModalOpen } } = moderationStore;

   const height = themeStore.groupedBtnsHeight;
   const statuses = getModerationRequestStatuses();
   const statusObj = statuses[req.status as keyof typeof statuses];

   const settingsButtons: GroupBtnsType[] = [
      {
         group: "request",
         text: i18next.t("moderation_request_fn_label"),
         leftText: req.full_name,
         height,
      },
      {
         group: "request",
         text: i18next.t("moderation_request_phone_label"),
         leftText: req.phone,
         height,
      },
      {
         group: "request",
         text: i18next.t("moderation_request_nationality_label"),
         leftText: req.nationality,
         height,
      },
      {
         group: "request",
         text: i18next.t("moderation_request_city_label"),
         leftText: req.city,
         height,
      },
      {
         group: "request",
         text: i18next.t("moderation_request_reason_label"),
         leftIcon: defaultGroupedBtsnRightIcon,
         callback: () => setIsModerationReasonModalOpen(true),
         leftText: req.reason.slice(0, 15) + "...",
         height,
      },
      {
         group: "request",
         text: i18next.t("moderation_request_status_label"),
         leftText: statusObj.text,
         leftIcon: statusObj.icon,
         height,
         leftTextColor: statusObj.color,
      },
      {
         group: "request",
         text: i18next.t("moderation_request_delete_label"),
         callback: todoNotify,
         height,
         textColor: themeStore.currentTheme.error_100,
         icon:
            <Ionicons
               name="trash-outline"
               color={themeStore.currentTheme.error_100}
               size={19}
            />,
      }
   ];

   return settingsButtons;
};

