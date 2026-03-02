import { GroupBtnsType } from '@config/types';
import { ArrowRightIcon } from '@icons/Ui/ArrowRightIcon';
import i18next from 'i18next';
import { themeStore } from 'src/modules/theme/stores';

// GLOBAL

const LEFT_ICON_HEIGHT = 13;
const LEFT_ICON_WIDTH = 15;
const LEFT_ICON_COLOR = themeStore.currentTheme.secondary_100;

const leftIcon = <ArrowRightIcon height={LEFT_ICON_HEIGHT} width={LEFT_ICON_WIDTH} color={LEFT_ICON_COLOR} />;

// REPORTS 

export const getReportsBtns = (): GroupBtnsType[] => {
   const height = themeStore.groupedBtnsHeight;

   const reportsButtons: GroupBtnsType[] = [
      {
         group: "report",
         text: i18next.t("not_like_report"),
         url: '',
         leftIcon,
         height
      },
      {
         group: "report",
         text: i18next.t("child_abuse_report"),
         url: '',
         leftIcon,
         height
      },
      {
         group: "report",
         text: i18next.t("violence_report"),
         url: '',
         leftIcon,
         height
      },
      {
         group: "report",
         text: i18next.t("illegal_goods_report"),
         url: '',
         leftIcon,
         height
      },
      {
         group: "report",
         text: i18next.t("pornographic_materials_report"),
         url: '',
         leftIcon,
         height
      },
      {
         group: "report",
         text: i18next.t("personal_data_report"),
         url: '',
         leftIcon,
         height
      },
      {
         group: "report",
         text: i18next.t("terrorism_report"),
         url: '',
         leftIcon,
         height
      },
      {
         group: "report",
         text: i18next.t("scam_or_spam_report"),
         url: '',
         leftIcon,
         height
      },
      {
         group: "report",
         text: i18next.t("copyright_infringement_report"),
         url: '',
         leftIcon,
         height
      },
      {
         group: "report",
         text: i18next.t("other_report"),
         url: '',
         leftIcon,
         height
      },
      {
         group: "report",
         text: i18next.t("doesnt_break_law_needs_removed_report"),
         url: '',
         leftIcon,
         height
      },
   ];

   return reportsButtons;
};

