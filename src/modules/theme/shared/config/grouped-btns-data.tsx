import { todoNotify } from '@config/const';
import { GroupBtnsType } from '@config/types';
import { BtnColorCustomizationIcon } from '@icons/MainPage/Settings/BtnColorCustomizationIcon';
import { PrimaryColorCustomizationIcon } from '@icons/MainPage/Settings/PrimaryColorCustomizationIcon';
import { TextColorCustomizationIcon } from '@icons/MainPage/Settings/TextColorCustomizationIcon';
import { UncoloredCustomizationIcon } from '@icons/MainPage/Settings/UncoloredCustomizationIcon';
import { ArrowRightIcon } from '@icons/Ui/ArrowRightIcon';
import { navigate } from '@lib/navigation';
import i18next, { TFunction } from 'i18next';
import { themeStore } from 'src/modules/theme/stores';

// GLOBAL

const LEFT_ICON_HEIGHT = 13;
const LEFT_ICON_WIDTH = 15;
const LEFT_ICON_COLOR = themeStore.currentTheme.secondary_100;

const leftIcon = <ArrowRightIcon height={LEFT_ICON_HEIGHT} width={LEFT_ICON_WIDTH} color={LEFT_ICON_COLOR} />;

// CUSTOMIZATION SETTINGS

export const getCustomizationSettingsBtns = (t: TFunction): GroupBtnsType[] => {
   const height = themeStore.groupedBtnsHeight;

   const colorCustomizationIconSize = 18;

   const settingsButtons: GroupBtnsType[] = [
      // ACCOUNT
      {
         group: "1",
         text: i18next.t("settings_customization_your_theme"),
         url: 'ThemeSettings',
         leftIcon,
         height
      },
      {
         group: "1",
         text: i18next.t("settings_customization_wallpapers"),
         url: 'WallpapersSettings',
         leftIcon,
         height
      },
      {
         group: "1",
         text: i18next.t("settings_customization_chat_wallpapers"),
         // url: 'ChatWallpapersSettings',
         callback: () => todoNotify(),
         leftIcon,
         height
      },

      {
         group: "2",
         text: i18next.t("settings_energy"),
         // url: 'EnergySettings',
         callback: () => todoNotify(),
         leftIcon,
         height
      },
      {
         group: "2",
         text: i18next.t("settings_text_size"),
         // url: 'TextSizeSettings',
         callback: () => todoNotify(),
         leftIcon,
         height
      },

      {
         group: "3",
         text: i18next.t("settings_bg_color"),
         url: 'BgColorSettings',
         callback: () => {
            themeStore.selectedRoute.setSelectedRoute('BgColorSettings');
            navigate("BgColorSettings");
         },
         leftIcon: (
            <UncoloredCustomizationIcon
               color={themeStore.currentTheme.text_100}
               size={colorCustomizationIconSize}
            />
         ),
         height
      },
      {
         group: "3",
         text: i18next.t("settings_btn_color"),
         url: 'BtnColorSettings',
         callback: () => {
            themeStore.selectedRoute.setSelectedRoute('BtnColorSettings');
            navigate("BtnColorSettings");
         },
         leftIcon: (
            <BtnColorCustomizationIcon
               color={themeStore.currentTheme.text_100}
               size={colorCustomizationIconSize}
            />
         ),
         height
      },
      {
         group: "3",
         text: i18next.t("settings_primary_color"),
         url: 'PrimaryColorSettings',
         callback: () => {
            themeStore.selectedRoute.setSelectedRoute('PrimaryColorSettings');
            navigate("PrimaryColorSettings");
         },
         leftIcon: <PrimaryColorCustomizationIcon color={themeStore.currentTheme.text_100} size={colorCustomizationIconSize} />,
         height
      },
      {
         group: "3",
         text: i18next.t("settings_text_color"),
         url: 'TextColorSettings',
         callback: () => {
            themeStore.selectedRoute.setSelectedRoute('TextColorSettings');
            navigate("TextColorSettings");
         },
         leftIcon: <TextColorCustomizationIcon color={themeStore.currentTheme.text_100} size={colorCustomizationIconSize} />,
         height
      },
      {
         group: "3",
         text: i18next.t("settings_secondary_text_color"),
         url: 'SecondaryTextColorSettings',
         callback: () => {
            themeStore.selectedRoute.setSelectedRoute('SecondaryTextColorSettings');
            navigate("SecondaryTextColorSettings");
         },
         leftIcon: <TextColorCustomizationIcon color={themeStore.currentTheme.text_100} size={colorCustomizationIconSize} />,
         height
      },
      {
         group: "4",
         text: i18next.t("settings_radius"),
         url: 'RadiusSettings',
         callback: () => {
            themeStore.selectedRoute.setSelectedRoute('RadiusSettings');
            navigate("RadiusSettings");
         },
         leftIcon,
         height
      },
      {
         group: "4",
         text: i18next.t("settings_border_color"),
         url: 'BorderColorSettings',
         callback: () => {
            themeStore.selectedRoute.setSelectedRoute('BorderColorSettings');
            navigate("BorderColorSettings");
         },
         leftIcon,
         height
      },
      {
         group: "4",
         text: i18next.t("settings_btn_height"),
         url: 'BtnHeightSettings',
         callback: () => {
            themeStore.selectedRoute.setSelectedRoute('BtnHeightSettings');
            navigate("BtnHeightSettings");
         },
         leftIcon,
         height
      },
      {
         group: "4",
         text: i18next.t("settings_btn_radius"),
         url: 'BtnRadiusSettings',
         callback: () => {
            themeStore.selectedRoute.setSelectedRoute('BtnRadiusSettings');
            navigate("BtnRadiusSettings");
         },
         leftIcon,
         height
      },
      {
         group: "4",
         text: i18next.t("settings_input_bg"),
         url: 'InputBgSettings',
         callback: () => {
            themeStore.selectedRoute.setSelectedRoute('InputBgSettings');
            navigate("InputBgSettings");
         },
         leftIcon,
         height
      },
      {
         group: "4",
         text: i18next.t("settings_input_height"),
         url: 'InputHeightSettings',
         callback: () => {
            themeStore.selectedRoute.setSelectedRoute('InputHeightSettings');
            navigate("InputHeightSettings");
         },
         leftIcon,
         height
      },
      {
         group: "4",
         text: i18next.t("settings_input_radius"),
         url: 'InputRadiusSettings',
         callback: () => {
            themeStore.selectedRoute.setSelectedRoute('InputRadiusSettings');
            navigate("InputRadiusSettings");
         },
         leftIcon,
         height
      },

      {
         group: "5",
         text: i18next.t("settings_all_theme_values"),
         url: 'AllThemeSettings',
         callback: () => navigate("AllThemeSettings"),
         leftIcon,
         height
      }
   ];

   return settingsButtons;
};

