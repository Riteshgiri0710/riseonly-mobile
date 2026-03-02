import { showNotify, todoNotify } from '@config/const';
import { GroupBtnsType, PrivatePublicType } from '@config/types';
import { Box, SwitchUi } from '@core/ui';
import { Ionicons } from '@expo/vector-icons';
import { BlockedFilledIcon } from '@icons/MainPage/Chats/BlockedFilledIcon';
import { ChannelFilledIcon } from '@icons/MainPage/Chats/ChannelFilledIcon';
import { ChannelIcon } from '@icons/MainPage/Chats/ChannelIcon';
import { ChatSettingsIcon } from '@icons/MainPage/Chats/ChatSettingsIcon';
import { CopyMsgIcon } from '@icons/MainPage/Chats/CopyMsgIcon';
import { EyeFilledIcon } from '@icons/MainPage/Chats/EyeFilledIcon';
import { GroupIcon } from '@icons/MainPage/Chats/GroupIcon';
import { HeartFilledIcon } from '@icons/MainPage/Chats/HeartFilledIcon';
import { KeyFilledIcon } from '@icons/MainPage/Chats/KeyFilledIcon';
import { LinkIcon } from '@icons/MainPage/Chats/LinkIcon';
import { ModerationFilledIcon } from '@icons/MainPage/Chats/ModerationFilledIcon';
import { UsersIcon } from '@icons/MainPage/Chats/UsersIcon';
import { ArrowRightIcon } from '@icons/Ui/ArrowRightIcon';
import { CustomizationColoredIcon } from '@icons/Ui/CustomizationColoredIcon';
import { PlusIcon } from '@icons/Ui/PlusIcon';
import { formatSmartDate } from '@lib/date';
import { checker } from '@lib/helpers';
import { navigate } from '@lib/navigation';
import { GROUPED_BTNS_HEIGHT, defaultGroupedBtsnRightIcon, filledIconGroupedBtnsSize } from '@lib/theme';
import { ChatLinkGroupedBtn } from '@modules/chat/components';
import { ChatSettingsDescriptionInput, ChatSettingsTitleInput } from '@modules/chat/pages/Chats/Chat/ChatSettings/ChatSettings';
import { chatsInteractionsStore } from '@modules/chat/stores/chats';
import Clipboard from '@react-native-clipboard/clipboard';
import { WsLoadingStatus } from '@stores/ws/types';
import { TFunction } from 'i18next';
import { ChatInfo, ChatType, ProtoInviteLink } from 'src/modules/chat/stores/chats/chats-actions/types';
import { ThemeT, themeStore } from 'src/modules/theme/stores';
import { chatSettingsTitleFromType } from './const';
import { getChatTypeTKey } from './functions';

// CHAT PROFILE

export const getChatProfileInfoBtns = (t: TFunction, chatFromProps?: ChatInfo) => {
   checker(chatFromProps, "[getChatProfileInfoBtns]: chat is not set");
   
   const chat = chatFromProps || {}

   if (chat.type === "FAVOURITES") return [];

   const isLoading = !chat
   const user = chat.participant;

   const minHeight = 55;
   const btnRightPaddingVertical = 6;

   const type = chat?.type;
   const isNotPrivate = type !== "PRIVATE";

   const tag = isNotPrivate ? chat?.tag : user?.tag;
   const description = isNotPrivate ? chat?.description : user.more.description;
   const descriptionTextKey = isNotPrivate ? "chat_profile_info_channel_description_title" : "chat_profile_info_description_title";

   const res: GroupBtnsType[] = [
      {
         group: "info",
         text: t(descriptionTextKey),
         pretitle: description ? description : t("not_selected"),
         minHeight,
         btnRightPaddingVertical,
         textColor: themeStore.currentTheme.secondary_100,
         btnRightMainTextPx: 14,
         pretitlePx: 16,
         pretitleLines: 5,
      }
   ];

   if (type !== "GROUP") {
      res.add([
         {
            group: "info",
            text: t("chat_profile_info_tag_title"),
            pretitle: `@${tag}`,
            leftIcon: <CopyMsgIcon color={themeStore.currentTheme.primary_100} size={17} />,
            minHeight,
            btnRightPaddingVertical,
            pretitleLines: 5,
            btnRightMainTextPx: 14,
            pretitlePx: 15,
            textColor: themeStore.currentTheme.secondary_100,
            pretitleStyle: {
               color: themeStore.currentTheme.primary_100
            },
            callback: () => {
               Clipboard.setString(`@${tag}`);
               showNotify("system", { message: t("success_copyed") });
            }
         },
      ], 0);
   };

   if (type == "PRIVATE") {
      res.unshift(
         {
            group: "info",
            text: t("chat_profile_info_hb_title"),
            pretitle: user.more.hb ? formatSmartDate(user.more.hb, { useRelativeTime: false }) : t("not_selected"),
            minHeight,
            btnRightPaddingVertical,
            btnRightMainTextPx: 14,
            textColor: themeStore.currentTheme.secondary_100,
            pretitlePx: 15,
            pretitleLines: 5,
         }
      );

      res.push(
         {
            group: "info",
            text: t("chat_profile_info_block"),
            callback: () => todoNotify(),
            textColor: themeStore.currentTheme.error_100,
            minHeight,
            btnRightPaddingVertical,
            pretitleLines: 5,
         }
      );
   }

   return res;
};

// CHAT SETTINGS

export const getChatSettingsBtns = (t: TFunction, chatType?: ChatType, selectedChat?: ChatInfo): GroupBtnsType[] => {
   checker(selectedChat, "[getChatSettingsBtns]: selectedChat is not set");
   checker(chatType, "[getChatSettingsBtns]: chatType is not set");

   if (chatType === "FAVOURITES") return [];

   const minHeight = 55;
   const btnRightPaddingVertical = 6;

   const type = chatType;
   const textKey = chatSettingsTitleFromType[type];

   checker(textKey, "[getChatSettingsBtns]: textKey 112:12");

   return [
      {
         text: t(textKey),
         leftIcon: defaultGroupedBtsnRightIcon,
         icon: <ChatSettingsIcon size={filledIconGroupedBtnsSize} />,
         minHeight,
         btnRightPaddingVertical,
         callback: () => {
            navigate("ChatSettings", { chatId: selectedChat.id, selectedChat });
         }
      }
   ];
};

// CREATE CHAT SHEET

export const getCreateChatSheetItems = (t: TFunction, onNavigate: (screen: 'group' | 'channel') => void): GroupBtnsType[] => {
   const iconSize = 20;
   const height = themeStore.groupedBtnsHeight;

   return [
      {
         group: 'create_chat',
         icon: <GroupIcon size={iconSize} />,
         text: t('create_group_chat'),
         callback: () => onNavigate('group'),
         height
      },
      {
         group: 'create_chat',
         icon: <ChannelIcon size={iconSize} />,
         text: t('create_channel_chat'),
         callback: () => onNavigate('channel'),
         height
      },
   ];
};

// CHAT LINK SETTINGS

export const getChatLinkSettingsBtns = (t: TFunction, channelChatType: PrivatePublicType, setChannelChatType: any): GroupBtnsType[] => {
   const LEFT_ICON_HEIGHT = 13;
   const LEFT_ICON_WIDTH = 15;
   const LEFT_ICON_COLOR = themeStore.currentTheme.primary_100;
   const height = themeStore.groupedBtnsHeight;

   const getIcon = (color: string = LEFT_ICON_COLOR) => {
      return (
         <ArrowRightIcon
            height={LEFT_ICON_HEIGHT}
            width={LEFT_ICON_WIDTH}
            color={color || LEFT_ICON_COLOR}
         />
      );
   };

   return [
      {
         group: 'link_settings',
         groupTitle: t('link'),
         groupTitlePx: 15,
         endGroupTitle: t('private_type_channel_explanation'),
         endGroupTitlePx: 14,
         text: t('public_type'),
         callback: () => setChannelChatType('public'),
         height,
         icon: channelChatType === 'public' ? getIcon() : getIcon("transparent"),
      },
      {
         group: 'link_settings',
         text: t('private_type'),
         callback: () => setChannelChatType('private'),
         height,
         icon: channelChatType === 'private' ? getIcon() : getIcon("transparent"),
      }
   ];
};

// GROUP LINK SETTINGS

export const getGroupLinkSettingsBtns = (t: TFunction, groupChatType: PrivatePublicType, setGroupChatType: any): GroupBtnsType[] => {
   const LEFT_ICON_HEIGHT = 13;
   const LEFT_ICON_WIDTH = 15;
   const LEFT_ICON_COLOR = themeStore.currentTheme.primary_100;
   const height = themeStore.groupedBtnsHeight;

   const getIcon = (color: string = LEFT_ICON_COLOR) => {
      return (
         <ArrowRightIcon
            height={LEFT_ICON_HEIGHT}
            width={LEFT_ICON_WIDTH}
            color={color || LEFT_ICON_COLOR}
         />
      );
   };

   return [
      {
         group: 'link_settings',
         groupTitle: t('link'),
         groupTitlePx: 15,
         endGroupTitle: t('private_type_channel_explanation'),
         endGroupTitlePx: 14,
         text: t('public_type'),
         callback: () => setGroupChatType('public'),
         height,
         icon: groupChatType === 'public' ? getIcon() : getIcon("transparent"),
      },
      {
         group: 'link_settings',
         text: t('private_type'),
         callback: () => setGroupChatType('private'),
         height,
         icon: groupChatType === 'private' ? getIcon() : getIcon("transparent"),
      }
   ];
};

// FORWARD IN CHAT BLOCK SETTINGS

export const getForwardBtns = (
   t: TFunction,
   forwardInChatEnabled: boolean,
   setForwardInChatEnabled: (prev: any) => void,
): GroupBtnsType[] => {
   const height = themeStore.groupedBtnsHeight;

   const leftIcon = (
      <SwitchUi
         isOpen={forwardInChatEnabled}
         onPress={() => setForwardInChatEnabled((p: boolean) => !p)}
      />
   );

   return [
      {
         group: 'link_settings',
         groupTitle: t('forward_in_chat_block_title'),
         groupTitlePx: 15,
         endGroupTitle: t('private_type_channel_explanation'),
         endGroupTitlePx: 14,
         text: t('forward_in_chat_block'),
         callback: () => setForwardInChatEnabled((p: boolean) => !p),
         height,
         leftIcon
      },
   ];
};

// CHAT INPUT SETTINGS

export const getChatInputSettingsBtns = (): GroupBtnsType[] => {
   const height = themeStore.groupedBtnsHeight;

   return [
      {
         group: 'chat_input_settings',
         jsx: <ChatSettingsTitleInput />,
         minHeight: height,
      },
      {
         group: 'chat_input_settings',
         jsx: <ChatSettingsDescriptionInput />,
         minHeight: height,
      },
   ];
};

// CHAT GROUP TYPE

export const getChatTypeSettingsBtn = (t: TFunction, isPublic: boolean, type: ChatType): GroupBtnsType[] => {
   const height = themeStore.groupedBtnsHeight;

   const textKey = type === "GROUP" ? "chat_group_type_title" : "chat_channel_type_title";

   return [
      {
         text: t(textKey),
         url: 'ChatSettingsType',
         icon: <UsersIcon size={filledIconGroupedBtnsSize} />,
         leftIcon: defaultGroupedBtsnRightIcon,
         leftText: t(getChatTypeTKey(isPublic)),
         height
      }
   ];
};

// CHAT SETTINGS BTN

export const getChatBaseSettingsBtns = (t: TFunction, selectedChat: ChatInfo): GroupBtnsType[] => {
   const height = themeStore.groupedBtnsHeight;

   const tag = "nicsfullstack";
   const type = selectedChat.type;
   const linkCount = String(5);
   const allowedReactionsType = "ALL";
   const allowedReactions = [];

   const objMap = {
      "ALL": "all_reactions",
      "CUSTOM": "only_selected_reactions",
      "NONE": "without_reactions"
   };

   return [
      {
         group: "1",
         text: t("chat_settings_invation_links"),
         url: 'ChatSettingsLinks',
         icon: <LinkIcon size={filledIconGroupedBtnsSize} />,
         leftIcon: defaultGroupedBtsnRightIcon,
         leftText: linkCount,
         height
      },
      {
         group: "1",
         text: t(type === "CHANNEL" ? "chat_settings_linked_group" : "chat_settings_linked_channel"),
         url: 'ChatSettingsLinkedChat',
         params: { selectedChat },
         icon: type === "CHANNEL" ? <UsersIcon size={filledIconGroupedBtnsSize} /> : <ChannelFilledIcon size={filledIconGroupedBtnsSize} />,
         leftIcon: defaultGroupedBtsnRightIcon,
         leftText: type === "CHANNEL" ? "@" + tag : "",
         height
      },
      {
         group: "1",
         text: t("chat_settings_allowed_reactions"),
         url: 'ChatSettingsAllowedReactions',
         params: { selectedChat },
         icon: <HeartFilledIcon size={filledIconGroupedBtnsSize} />,
         leftIcon: defaultGroupedBtsnRightIcon,
         leftText: t(objMap[allowedReactionsType as keyof typeof objMap]),
         height
      },
      {
         group: "1",
         text: t("chat_settings_customization"),
         // url: 'ChatSettingsCustomization',
         callback: () => todoNotify(),
         icon: <CustomizationColoredIcon size={filledIconGroupedBtnsSize} />,
         leftIcon: defaultGroupedBtsnRightIcon,
         height
      },
   ];
};

export const getChatInfoBtns = (t: TFunction, members_count: number, selectedChat: ChatInfo) => {
   const height = themeStore.groupedBtnsHeight;

   const membersCount = String(members_count);
   const allAllows = 13;
   const chatAllows = 10;
   const blackListCount = 82;
   const adminsCount = 26;

   const btns: GroupBtnsType[] = [
      {
         group: "1",
         text: t("chat_settings_members"),
         url: 'ChatSettingsMembers',
         params: { selectedChat },
         icon: <UsersIcon size={filledIconGroupedBtnsSize} />,
         leftIcon: defaultGroupedBtsnRightIcon,
         leftText: membersCount,
         height
      },
      {
         group: "1",
         text: t("chat_settings_allows"),
         url: 'ChatSettingsAllows',
         icon: <KeyFilledIcon size={filledIconGroupedBtnsSize} />,
         leftIcon: defaultGroupedBtsnRightIcon,
         leftText: `${chatAllows}/${allAllows}`,
         height
      },
      {
         group: "1",
         text: t("chat_settings_admins"),
         url: 'ChatSettingsAdmins',
         icon: <ModerationFilledIcon size={filledIconGroupedBtnsSize} />,
         leftIcon: defaultGroupedBtsnRightIcon,
         leftText: adminsCount + "",
         height
      },
      {
         group: "1",
         text: t("chat_settings_black_list"),
         url: 'ChatSettingsBlackList',
         icon: <BlockedFilledIcon size={filledIconGroupedBtnsSize} />,
         leftIcon: defaultGroupedBtsnRightIcon,
         leftText: blackListCount + "",
         height
      },
      {
         group: "1",
         text: t("chat_settings_actions_history"),
         url: 'ChatSettingsActionsHistory',
         icon: <EyeFilledIcon size={filledIconGroupedBtnsSize} />,
         leftIcon: defaultGroupedBtsnRightIcon,
         height
      },
   ];

   return btns;
};

export const getChatDeleteBtn = (t: TFunction, type: ChatType) => {
   const height = themeStore.groupedBtnsHeight;

   const objMap = {
      "PRIVATE": "chat_delete_text",
      "CHANNEL": "chat_channel_delete_text",
      "GROUP": "chat_group_delete_text"
   };

   const onChatDelete = () => todoNotify();

   const btn: GroupBtnsType[] = [
      {
         text: t(objMap[type as keyof typeof objMap]),
         textColor: "red",
         callback: onChatDelete,
         height
      }
   ];

   return btn;
};

// CHAT TYPE BTNS

export const getChatTypeBtns = (t: TFunction, chatType: ChatType, isPublic: boolean) => {
   const height = GROUPED_BTNS_HEIGHT;

   const onClickHandler = (item: GroupBtnsType) => {
      const { changeChatTypeHandler } = chatsInteractionsStore;

      changeChatTypeHandler(item.actionKey === "true");
   };

   function leftIconFn(this: GroupBtnsType) {
      const isCurrentPublic = this.actionKey;

      if (isCurrentPublic === String(isPublic)) return (
         <Ionicons
            name="checkmark"
            size={20}
            color={themeStore.currentTheme.primary_100}
         />
      );

      return <></>;
   }

   const groupTitleTKey = chatType === "GROUP" ? "chat_group_type_title" : "chat_channel_type_title";

   const res = [
      {
         groupTitle: t(groupTitleTKey).toUpperCase(),
         group: "1",
         height,
         text: t("public_type"),
         callback: (item: GroupBtnsType) => onClickHandler(item),
         actionKey: "true",
         leftIcon: leftIconFn,
      },
      {
         groupTitle: t(groupTitleTKey).toUpperCase(),
         group: "1",
         height,
         text: t("private_type"),
         callback: (item: GroupBtnsType) => onClickHandler(item),
         actionKey: "false",
         leftIcon: leftIconFn,
      },
   ];

   return res;
};

// GET CHAT LINK BTN

export const getChatLinkBtn = (t: TFunction) => {
   const res: GroupBtnsType[] = [
      {
         groupTitle: t("chat_link_grouped_btn_title"),
         jsx: <ChatLinkGroupedBtn />
      }
   ];
   return res;
};

// GET CHATS LINKS BTN

export const getChatLinksBtns = (t: TFunction, links: ProtoInviteLink[], currentTheme: ThemeT, status: WsLoadingStatus) => {
   const { onCreateLinkHandler, onEditLinkHandler } = chatsInteractionsStore;

   const height = GROUPED_BTNS_HEIGHT;

   const resLinks = links || [];

   const res: GroupBtnsType[] = [
      {
         group: "1",
         groupTitle: t("links"),
         icon: (
            <Box
               width={filledIconGroupedBtnsSize}
               centered
            >
               <PlusIcon
                  color={currentTheme.primary_100}
                  size={20}
               />
            </Box>
         ),
         text: t("create_link"),
         textColor: currentTheme.primary_100,
         callback: () => onCreateLinkHandler(t),
         btnDisabled: status !== "fulfilled",
         height
      }
   ];

   resLinks.forEach(link => {
      res.push({
         group: "1",
         icon: <LinkIcon size={filledIconGroupedBtnsSize} />,
         text: link.name || link.link || t("loading_text"),
         callback: () => onEditLinkHandler(link),
         height
      });
   });

   return res;
};