import { MediaFullscreen } from '@core/ui';
import { HoldMenuProvider } from '@core/ui/HoldMenu';
import { MaterialIcons } from '@expo/vector-icons';
import { DebuggerUi } from '@lib/debuggerUi/DebuggerUi';
import '@lib/global/array-extensions';
import '@lib/global/object-extensions';
import { globalWebSocketManager } from '@lib/mobx-toolbox/mobxSaiWs';
import { getCurrentRouteName, navigate, navigationRef, NavigationContainerWithRef } from '@lib/navigation';
import { Notifier, NotifierWrapper } from '@lib/notifier';
import { globalInteractionsStore } from '@stores/global-interactions';
import { mediaFullscreenInteractionsStore } from '@stores/media';
import { websocketApiStore } from '@stores/ws/websocket-api-store';
import { registerForPushNotificationsAsync } from '@utils/notifications';
import { useNotifications } from '@core/hooks/useNotifications';
import { registerRootComponent } from 'expo';
import * as Notifications from 'expo-notifications';
import {
  preventAutoHideAsync,
  setOptions as setSplashScreenOptions,
} from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { withIAPContext } from 'react-native-iap';
import { enableLayoutAnimations } from 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { authStore } from 'src/modules/auth/stores';
import { AuthGuardWrapper, IAPWrapper, NetInfoWrapper, ThemeInitWrapper } from 'src/modules/auth/widgets/wrappers';
import { notifyActionsStore, notifyInteractionsStore } from 'src/modules/notify/stores';
import { themeStore } from 'src/modules/theme/stores';
import { RootNavigator } from './router/RootNavigator';
import type { RootStackParamList } from './router/navigation.types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

setSplashScreenOptions({ fade: true });
preventAutoHideAsync();
Notifier.setDefaultImage(require('@images/AppLogo.png'));

const tabScreens = ['Posts', 'Profile', 'Chats', 'GlobalSearch', 'Notifications'];

const AppContent = observer(() => {
  const { initializeApp } = globalInteractionsStore;
  const {
    appReady: { appReady },
    initialScreen: { initialScreen },
  } = authStore;
  const { preloadWsUrl } = websocketApiStore;
  const { getAllNotificationsAction } = notifyActionsStore;
  const { scrollViewRef: { scrollViewRef } } = notifyInteractionsStore;
  const { visible, items, initialIndex, close } = mediaFullscreenInteractionsStore;
  const { mockMode, mockModeRestoredAtStartup, clearMockModeRestoredAtStartup } = globalWebSocketManager;

  const isVisible = visible.visible;
  const mediaItems = items.items;
  const mediaInitialIndex = initialIndex.initialIndex;

  const { t } = useTranslation();

  useEffect(() => {
    if (!scrollViewRef) return;
    getAllNotificationsAction('all', t, true, false);
  }, [scrollViewRef]);

  useEffect(() => {
    (async () => {
      try {
        await globalWebSocketManager.initMockFromStorage();
      } catch (e) {
        console.warn('[App] initMockFromStorage failed:', e);
      }
      registerForPushNotificationsAsync();
      preloadWsUrl();
      initializeApp();
    })();
  }, []);

  useEffect(() => {
    if (!appReady || !mockMode) return;
    if (mockModeRestoredAtStartup) {
      const go = () => {
        // @ts-ignore
        navigate('MainTabs', { screen: 'Posts' });
        clearMockModeRestoredAtStartup();
      };
      if (navigationRef.isReady()) go();
      else setTimeout(go, 150);
    } else {
      const n = getCurrentRouteName();
      // @ts-ignore
      if (n === 'SignIn' || n === 'SignUp') navigate('MainTabs', { screen: 'Posts' });
    }
  }, [appReady, mockMode, mockModeRestoredAtStartup, clearMockModeRestoredAtStartup]);

  if (!appReady) return null;

  const mappedInitialRoute = (initialScreen && tabScreens.includes(initialScreen)) ? 'MainTabs' : (initialScreen || 'MainTabs');

  return (
    <>
      <RootNavigator initialRouteName={mappedInitialRoute as keyof RootStackParamList} />
      <StatusBar style="light" />
      <DebuggerUi />
      <MediaFullscreen
        visible={isVisible}
        items={mediaItems}
        initialIndex={mediaInitialIndex}
        onClose={close}
      />
    </>
  );
});

const AppWithHoldMenu = observer(() => {
  const insets = useSafeAreaInsets();
  const { currentTheme } = themeStore;

  const holdMenuTheme = currentTheme.bg_200?.includes('255') || currentTheme.bg_200?.includes('white') ? 'light' : 'dark';

  return (
    <>
      <HoldMenuProvider
        theme={holdMenuTheme}
        iconComponent={MaterialIcons}
        safeAreaInsets={{
          top: insets.top,
          right: insets.right,
          bottom: insets.bottom,
          left: insets.left,
        }}
      >
        <AppContent />
      </HoldMenuProvider>
    </>
  );
});

export const App = withIAPContext(() => {
  if (__DEV__) enableLayoutAnimations(true);

  // Subscribe to notification events
  useNotifications(navigationRef);

  return (
    <NavigationContainerWithRef>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NetInfoWrapper>
            <ThemeInitWrapper>
              <NotifierWrapper>
                <AuthGuardWrapper>
                  <IAPWrapper>
                    <AppWithHoldMenu />
                  </IAPWrapper>
                </AuthGuardWrapper>
              </NotifierWrapper>
            </ThemeInitWrapper>
          </NetInfoWrapper>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </NavigationContainerWithRef>
  );
});

registerRootComponent(App);
