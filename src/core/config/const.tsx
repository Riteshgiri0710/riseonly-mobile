import { interpolateColor } from '@core/config/tsx';
import { Ionicons } from '@expo/vector-icons';
import defaultBannerImport from '@images/BgTheme2.png';
import defaultFavouritesLogoImport from '@images/ChatFavourites.png';
import defaultLogoImport from '@images/defaultlogo.jpg';
import { checker, logger } from '@lib/helpers';
import i18next, { TFunction } from 'i18next';
import { Dimensions } from 'react-native';
import { NotifyData, NotifyType, notifyInteractionsStore } from 'src/modules/notify/stores';
import { themeStore } from 'src/modules/theme/stores';
import { ViewPrivacyT } from './types';

export const defaultLogo = defaultLogoImport;
export const defaultFavouritesLogo = defaultFavouritesLogoImport;
export const reqDefaultLogo = require('@images/defaultlogo.jpg');
export const defaultBanner = defaultBannerImport;

export const emptyArr = (name: string) => {
   console.warn(`[${name}]: Finish function not provided`);
   return;
};

export const getCurrentPrivacyStatus = (status: ViewPrivacyT) => {
   const obj = {
      "ALL": i18next.t("privacy_all_status"),
      "NONE": i18next.t("privacy_none_status"),
      "CONTACTS": i18next.t("privacy_contacts_status"),
      "FRIENDS": i18next.t("privacy_friends_status"),
   };

   return obj[status] || `[getCurrentPrivacyStatus]: Status "${status}" found in object`;
   status.toUpperCase() as keyof typeof obj;
};

export const todoNotify = () => {
   notifyInteractionsStore.showNotify("system", {
      message: i18next.t("not_ready_functional")
   });
};

export const showNotify = (type: NotifyType, data: NotifyData) => {
   notifyInteractionsStore.showNotify(type, data);
};

export const getIconColor = (tabIndex: number, scrollPosition: number, width: number) => {
   const mainColor = themeStore.currentTheme.primary_100 as string;
   const secondaryColor = themeStore.currentTheme.secondary_100 as string;

   const virtualCurrentTab = scrollPosition / width;

   const isTransitioningToThisTab =
      (Math.floor(virtualCurrentTab) === tabIndex && virtualCurrentTab < tabIndex + 1) ||
      (Math.ceil(virtualCurrentTab) === tabIndex && virtualCurrentTab > tabIndex - 1);

   if (!isTransitioningToThisTab) {
      return secondaryColor;
   }

   const proximityFactor = 1 - Math.abs(virtualCurrentTab - tabIndex);

   return interpolateColor(secondaryColor, mainColor, proximityFactor);
};

export const getSessionDevice = (device: string) => {
   let res;
   const founded = device.replace(")", "").indexOf("(");

   if (founded !== -1) {
      res = device.substring(0, founded);
   } else {
      res = device;
   }

   res = res.replace("Apple", "").trim();

   return res || i18next.t("not_found_session_device");
};

export const getSessionFullDevice = (device: string) => {
   const rules = [
      { match: 'macos', text: "Macbook" }
   ];

   const rule = rules?.find(r => device?.toLowerCase()?.includes(r?.match));
   if (rule) return rule.text;
   return i18next.t("not_found_session_device");
};

export const getSessionLocation = (location: string) => {
   if (location === "неизвестное местоположение") return i18next.t("session_location_notfound");
   return location;
};

export const appName = "RiseOnly";
export const overlayColor = 'rgba(0, 0, 0, 0.7)';

export const getModerationRequestStatuses = () => {
   const { LoaderUi } = require('@core/ui');
   return {
      "Pending": {
         text: i18next.t("moderation_request_status_pending"),
         icon: <LoaderUi size="small" color="#ffc31f" />,
         color: "#ffc31f",
      },
      "Fulfilled": {
         text: i18next.t("moderation_request_status_fulfilled"),
         icon: <Ionicons name="checkmark" color="#31c400" size={20} />,
         color: "#31c400",
      },
      "Rejected": {
         text: i18next.t("moderation_request_status_rejected"),
         icon: <Ionicons name="close" color="#f7051d" size={20} />,
         color: "#f7051d",
      },
   };
};

export const colorValues = {
   "BgColorSettings": themeStore.currentTheme.bg_200,
   "BtnColorSettings": themeStore.currentTheme.text_100,
   "PrimaryColorSettings": themeStore.currentTheme.primary_100,
   "TextColorSettings": themeStore.currentTheme.text_100,
   "SecondaryTextColorSettings": themeStore.currentTheme.secondary_100,
};

export const defaultColorValues = {
   "BgColorSettings": themeStore.defaultTheme.bg_200,
   "BtnColorSettings": themeStore.defaultTheme.btn_bg_300,
   "PrimaryColorSettings": themeStore.defaultTheme.primary_100,
   "TextColorSettings": themeStore.defaultTheme.text_100,
   "SecondaryTextColorSettings": themeStore.defaultTheme.secondary_100,
};

export const getSystemMessageType = (message: string | undefined, t: TFunction) => {
   checker(message, "[getSystemMessageType]: message is not defined");

   const systemMessages = {
      "Channel was created": { text: "channel_created_message", options: {} },
      "Group was created": { text: "group_created_message", options: {} },
      "joined the group": { text: "user_joined_group_message", options: { user_name: message.split(" ")[0] || "Unknown" } },
   };

   const splitted = message.split("'");

   const firstMessage = splitted[0].trim();
   const lastMessage = splitted[splitted.length - 1].trim();

   const systemKey = `${firstMessage} ${lastMessage}`;
   const result = systemMessages[systemKey as keyof typeof systemMessages];

   if (result) return t(result.text, result.options);
   if (!result) {
      const keysArr = Object.keys(systemMessages);
      const key = keysArr.find(key => message.includes(key));
      if (key) return t(systemMessages[key as keyof typeof systemMessages].text, systemMessages[key as keyof typeof systemMessages].options);
   }

   logger.debug("GET SYSTEM MESSAGE", "We are not using text from object");

   return message;
};

// SIZES

export const GRID_POST_WIDTH = Dimensions.get('window').width / 3;
export const GRID_POST_HEIGHT = 150;
export const GROUPED_BTNS_ICON_SIZE = 32;
export const SCREEN_PADDING_HORIZONTAL = 12.5;

// INVITE LINK
export const INVITE_LINK_PATTERN = 'https://riseonly.net/join/';

// STICKER PACK LINK (slug after /s/)
export const STICKER_LINK_PATTERN = 'https://riseonly.net/s/';

export const REACTIONS_LIST_BY_DEFAULT = [
   "❤️",
   "👍",
   "👎",
   "🔥",
   "🥰",
   "👏",
   "😁",
   "🤔",
   "🤯",
   "😱",
   "🤬",
   "😟",
   "🎉",
   "🤩",
   "🤢",
   "💩",
   "🙏",
   "👌",
   "🕊️",
   "🤡",
   "😮",
   "😌",
   "😍",
   "🐳",
   "❤️‍🔥",
   "🌚",
   "🌭",
   "💯",
   "🤣",
   "⚡",
   "🍌",
   "🏆",
   "💔",
   "🤨",
   "😐",
   "🍓",
   "🍾",
   "💋",
   "🖕",
   "😈",
   "😴",
   "😭",
   "🤓",
   "👻",
   "🧑‍💻",
   "👀",
   "🎃",
   "🙈",
   "😇",
   "😔",
   "🤝",
   "✍️",
   "🤗",
   "🫶",
   "🧑‍🎄",
   "🎄",
   "⛄",
   "💅",
   "😜",
   "🗿",
   "🆒",
   "💞",
   "🙉",
   "🦄",
   "🙂",
   "💊",
   "🙊",
   "😎",
   "👾",
   "🤷‍♂️",
   "🤷",
   "🤷‍♀️",
   "😡"
];

/**
 * Performance toggles for message list. Flip flags to measure FPS impact of each part.
 * All true = full UI (default). Set to false to disable and isolate bottlenecks.
 */
export interface MessageListConfig {
   useHoldItem: boolean;
   showAvatar: boolean;
   showCheckbox: boolean;
   showSwipeToReply: boolean;
   showReactions: boolean;
   showReplyTo: boolean;
   showMedia: boolean;
   showTime: boolean;
   showUsername: boolean;
   showReadStatus: boolean;
   simpleMessage: boolean;
}

export const MESSAGE_LIST_CONFIG: MessageListConfig = {
   useHoldItem: false,

   showReactions: true,
   showAvatar: true,
   showMedia: true,
   showTime: true,
   showUsername: true,
   showReadStatus: true,

   showCheckbox: true,
   showSwipeToReply: true,
   showReplyTo: true,

   simpleMessage: false,
};
