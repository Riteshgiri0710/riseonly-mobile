import { GlobalBottomSheets } from '@app/modals/GlobalBottomsheets';
import { getNavBtns } from '@core/config/tsx';
import { Box, MainText, SimpleButtonUi, UserLogo } from '@core/ui';
import { changeRgbA } from '@lib/theme';
import { routeInteractions } from '@stores/global-interactions';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notifyActionsStore } from 'src/modules/notify/stores';
import { themeStore } from 'src/modules/theme/stores';
import { profileStore } from 'src/modules/user/stores/profile';

export const MainBottomNavigation = observer(({ navigation, state, children }: any & { children: React.ReactNode; }) => {
  const { currentTheme } = themeStore;
  const { profile } = profileStore;
  const { allNotificationsSai: { data, status } } = notifyActionsStore;

  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const screenWidth = useWindowDimensions().width;

  const currentRoute = typeof state == "function" ? (state as any)() : (state?.routes?.[state?.index]?.name || '');
  const isActive = useCallback((routeName: string) => currentRoute === routeName, [currentRoute]);

  const navBtns = useMemo(() => getNavBtns('mobile', 26, currentRoute), [currentRoute]);

  const pathToRouteName = useCallback((path: string) => {
    if (!path) return '';
    const lastPart = path.split('/').pop() || '';
    if (lastPart === 'about-us') return 'AboutUs';
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  }, []);

  const handleTabPress = useCallback((btnTo: string, btnParams?: any) => {
    if (!btnTo) return;
    console.log('🔧 MainBottomNavigation: navigating to tab:', btnTo, 'with params:', btnParams);

    if (btnTo === "Profile") profileStore.setUserToShow(profileStore.profile);

    routeInteractions.pushRoute({
      name: btnTo,
      params: btnParams
    });

    navigation.navigate("MainTabs", { screen: btnTo, params: btnParams });
  }, [navigation]);

  return (
    <>
      {children ? children : null}

      <GlobalBottomSheets />

      {/* <BlurView
        intensity={30}
        style={[
          s.outerContainer,
          {
            backgroundColor: getBlurViewBgColor(),
          },
        ]}
      > */}
      <Box
        bgColor={"transparent"}
        style={[
          s.outerContainer,
          { bottom: insets.bottom - 5, }
        ]}
        width={"100%"}
      >
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0.9)',
            'rgba(0, 0, 0, 0.7)',
            'rgba(0, 0, 0, 0.5)',
            'rgba(0, 0, 0, 0.4)',
            'rgba(0, 0, 0, 0.0)',
            'rgba(0, 0, 0, 0)'
          ]}
          locations={[0, 0.15, 0.35, 0.6, 0.85, 1]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={{
            position: 'absolute',
            bottom: -insets.bottom,
            left: -10,
            right: -10,
            height: 150,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        <Box
          width={"100%"}
          style={s.wrapper}
        >
          <BlurView
            intensity={15}
            style={[
              s.tabs,
              {
                width: "100%",
                borderWidth: 0.7,
                borderColor: "rgba(40, 40, 40, 1)",
                backgroundColor: changeRgbA("rgba(0, 0, 0, 1)", 0.3),
                borderRadius: 1000,
                overflow: "hidden",
              },
            ]}
          >
            {navBtns.map((btn) => {
              const active = isActive(pathToRouteName(btn.to));
              return (
                <SimpleButtonUi
                  height={"100%"}
                  key={btn.to || ''}
                  style={[
                    s.tab,
                    active ? s.activeTab : null,
                    { maxWidth: screenWidth / navBtns.length }
                  ]}
                  onPress={() => handleTabPress(btn.to, btn.params)}
                >
                  {btn.text === 'navbtn_profile' ? (
                    <Box
                      centered
                      gap={3}
                    >
                      <UserLogo
                        source={profile?.more?.logo}
                        size={30}
                        style={[
                          s.avatarContainer,
                          { borderColor: currentTheme.border_100, }
                        ]}
                      />

                      <MainText
                        numberOfLines={1}
                        px={10}
                        primary={active}
                      >
                        {t("navbtn_profile")}
                      </MainText>
                    </Box>
                  ) : (
                    btn.text === 'Уведомления' ? (
                      <View style={s.notifyContainer}>
                        {status === 'fulfilled' && data?.totalUnread! > 0 ? (
                          <MainText
                            style={{
                              ...s.totalUnread,
                              backgroundColor: currentTheme.primary_100
                            }}
                          >
                            {data?.totalUnread || 0}
                          </MainText>
                        ) : null}
                        <Box
                          centered
                          gap={3}
                        >
                          {btn.icon ? btn.icon : null}
                          <MainText
                            numberOfLines={1}
                            px={10}
                            primary={active}
                          >
                            {t(btn.text)}
                          </MainText>
                        </Box>
                      </View>
                    ) : (
                      <Box
                        centered
                        gap={3}
                      >
                        {btn.icon ? btn.icon : null}
                        <MainText
                          numberOfLines={1}
                          px={9}
                          primary={active}
                        >
                          {t(btn.text)}
                        </MainText>
                      </Box>
                    )
                  )}
                </SimpleButtonUi>
              );
            })}
          </BlurView>
        </Box>
      </Box>
      {/* </BlurView> */}
    </>
  );
});

const s = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 15,
  },
  avatarContainer: {
    borderRadius: 100,
    overflow: 'hidden' as const,
    borderWidth: 0.25,
  },
  outerContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
  container: {
    backgroundColor: "transparent"
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 15
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    paddingTop: 9,
  },
  activeTab: {
  },
  notifyContainer: {
    position: 'relative'
  },
  totalUnread: {
    position: 'absolute',
    top: -7,
    right: -7,
    zIndex: 1000,
    borderRadius: 1000,
    minWidth: 10,
    padding: 4,
    fontSize: 9,
  },
});
