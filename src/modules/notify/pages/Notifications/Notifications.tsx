import { getIconColor } from '@core/config/const';
import { AnimatedTabs, TabConfig } from '@core/ui';
import { ProfileSettingsWrapper } from '@core/widgets/wrappers';
import { useFocusEffect } from '@lib/navigation';
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { AllNotifications, CommentNotifications } from 'src/modules/notify/components';
import { notifyActionsStore, notifyInteractionsStore } from 'src/modules/notify/stores';

export const Notifications = observer(() => {
   const { height } = useWindowDimensions();
   const { t } = useTranslation();

   const { readAllNotificaitonsAction } = notifyActionsStore;

   const {
      activeTab: { activeTab, setActiveTab },
      scrollPosition: { scrollPosition, setScrollPosition },
      openedPage: { setOpenedPage },
   } = notifyInteractionsStore;

   const tabs: TabConfig[] = [
      { content: AllNotifications, text: t('all_notify_title') },
      { content: CommentNotifications, text: t('comment_notify_title') },
   ];

   useFocusEffect(
      useCallback(() => {
         readAllNotificaitonsAction();
      }, [])
   );

   return (
      <ProfileSettingsWrapper
         wrapperStyle={s.container}
         tKey='settings_notify_title'
         height={30}
         needScrollView={false}
      >
         <AnimatedTabs
            tabs={tabs}
            bouncing={false}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            scrollPosition={scrollPosition}
            setScrollPosition={setScrollPosition}
            tabMaxHeight={height - 110}
            getIconColor={getIconColor}
            containerStyle={s.tabs}
            onSwap={i => setOpenedPage(i)}
         />
      </ProfileSettingsWrapper>
   );
});

const s = StyleSheet.create({
   tabs: { borderRadius: 0 },
   container: {
      paddingVertical: 0,
      paddingHorizontal: 0,
   },
});
