import { getProfileBtns, getUserStats } from '@config/tsx';
import { Box, CleverImage, MainText, SecondaryText, SimpleButtonUi, UserLogo } from '@core/ui';
import { MoreIcon } from '@icons/MainPage/Chats/MoreIcon';
import { MenuIcon } from '@icons/MainPage/NavBar';
import { navigate } from '@lib/navigation';
import { formatNumber } from '@lib/numbers';
import { BlurView } from 'expo-blur';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeSyntheticEvent, StyleProp, StyleSheet, TextLayoutEventData, View, ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';
import { themeStore } from 'src/modules/theme/stores';
import { profileActionsStore, profileStore } from 'src/modules/user/stores/profile';

const numberOfLines = 3;
interface ProfileTopProps {
   animatedBannerStyle: AnimatedStyle<StyleProp<ViewStyle>>;
   isUser?: boolean;
}

export const ProfileTop = observer(({
   animatedBannerStyle,
   isUser = false
}: ProfileTopProps) => {
   const { currentTheme } = themeStore;

   const { t } = useTranslation();
   const [isTruncated, setIsTruncated] = useState(false);
   const [showFull, setShowFull] = useState(false);

   const currentUser = isUser ? profileActionsStore?.user?.data?.profile : profileActionsStore?.myProfile?.data;
   const profileBtns = useMemo(() => getProfileBtns(currentUser, t), [currentUser, t]);

   const onPressMore = useCallback(() => setShowFull(p => !p), []);

   const onMenuPress = useCallback(() => {
      if ((isUser ? profileStore?.user : profileStore?.profile)?.tag === (isUser ? profileActionsStore?.user?.data?.profile : profileActionsStore?.myProfile?.data)?.tag) {
         navigate("Settings");
         return;
      }
      console.log("context menu");
   }, [isUser]);

   const handleTextLayout = useCallback((e: NativeSyntheticEvent<TextLayoutEventData>) => {
      const { lines } = e.nativeEvent;
      if (lines.length >= numberOfLines) setIsTruncated(true);
   }, []);

   return (
      <View>
         <Animated.View
            style={[styles.banner, animatedBannerStyle]}
         >
            <CleverImage
               source={(isUser ? profileStore?.user : profileStore?.profile)?.more?.banner || ""}
               imageStyles={styles.bannerImage}
               withBackgroundBlur
               resizeMode="stretch"
               withoutWrapper
               intensity={0}
               type="banner"
            />

            <BlurView
               intensity={30}
               style={[
                  styles.menuBlur,
                  {
                     backgroundColor: currentTheme.btn_bg_200,
                     borderColor: currentTheme.bg_100,
                  }
               ]}
            >
               <SimpleButtonUi
                  style={styles.menuButton}
                  onPress={onMenuPress}
               >
                  {(isUser ? profileStore?.user : profileStore?.profile)?.tag === (isUser ? profileActionsStore?.user?.data?.profile : profileActionsStore?.myProfile?.data)?.tag ? (
                     <MenuIcon
                        width={15}
                        height={10}
                        color={currentTheme.text_100}
                     />
                  ) : (
                     <MoreIcon
                        width={15}
                        height={10}
                        color={currentTheme.text_100}
                     />
                  )}
               </SimpleButtonUi>
            </BlurView>
         </Animated.View>

         <View
            style={[styles.profileInfo, {
               backgroundColor: currentTheme.bg_200,
               marginTop: -10,
            }]}
         >
            <View style={styles.profileLogoWrapper}>
               <View style={styles.avatarWrapper}>
                  <UserLogo
                     source={(isUser ? profileActionsStore?.user?.data?.profile : profileActionsStore?.myProfile?.data)?.more?.logo || ''}
                     size={100}
                     style={[
                        styles.profileLogoContainer,
                        { borderColor: currentTheme.bg_200, }
                     ]}
                     streakCount={(isUser ? profileActionsStore?.user?.data?.profile : profileActionsStore?.myProfile?.data)?.more?.streak}
                  />
               </View>
            </View>
            <View>
               <MainText px={20} tac='center'>
                  {(isUser ? profileActionsStore?.user?.data?.profile : profileActionsStore?.myProfile?.data)?.name}
               </MainText>
               <SecondaryText px={13} tac='center'>
                  @{(isUser ? profileActionsStore?.user?.data?.profile : profileActionsStore?.myProfile?.data)?.tag}
               </SecondaryText>
            </View>
         </View>

         <Box
            style={styles.profileBot}
            bgColor={currentTheme.bg_200}
            gap={8}
         >
            <Box
               fD="row"
               justify="space-around"
               width={"100%"}
               flex={1}
            >
               {getUserStats(isUser ? profileActionsStore?.user?.data?.profile : profileActionsStore?.myProfile?.data).map((t, i) => {
                  return (
                     <SimpleButtonUi
                        key={i}
                        onPress={t.callback}
                        style={styles.btn}
                        bgColor={currentTheme.btn_bg_300}
                     >
                        <MainText
                           numberOfLines={1}
                           ellipsizeMode='tail'
                        >
                           {formatNumber(t.amount)}
                        </MainText>
                        <MainText px={12}>{t.text}</MainText>
                     </SimpleButtonUi>
                  );
               })}
            </Box>

            <Box>
               <MainText px={13}>
                  {t("privacy_settings_description")}:
               </MainText>
               <MainText
                  numberOfLines={showFull ? undefined : numberOfLines}
                  ellipsizeMode="tail"
                  onTextLayout={handleTextLayout}
               >
                  {(isUser ? profileActionsStore?.user?.data?.profile : profileActionsStore?.myProfile?.data)?.more?.description || t("not_selected")}
               </MainText>

               {isTruncated && (
                  <SimpleButtonUi
                     onPress={onPressMore}
                  >
                     <MainText px={13} primary>{showFull ? t("hide_text") : t("more_text")}</MainText>
                  </SimpleButtonUi>
               )}
            </Box>
         </Box>

         <Box
            width={"100%"}
            fD="row"
            gap={5}
            style={styles.botbtns}
            bgColor={currentTheme.bg_200}
         >
            {profileBtns.map((t, i) => {
               return (
                  <SimpleButtonUi
                     key={i}
                     onPress={t.callback}
                     style={t.text ? styles.profileBtn : styles.profileEmptyBtn}
                     bgColor={currentTheme.btn_bg_300}
                  >
                     {t.icon && t.icon}
                     {t.text && (
                        <MainText
                           numberOfLines={1}
                           ellipsizeMode='tail'
                           px={14}
                        >
                           {t.text}
                        </MainText>
                     )}
                  </SimpleButtonUi>
               );
            })}
         </Box>
      </View>
   );
});

const styles = StyleSheet.create({
   profileLogoContainer: {
      width: 95,
      height: 95,
      borderRadius: 50,
      overflow: 'hidden',
      borderWidth: 3,
   },
   menuBlur: {
      borderWidth: 0.3,
      position: "absolute",
      borderRadius: 10,
      overflow: "hidden",
      top: 70,
      right: 50,
   },
   botbtns: {
      padding: 10,
      borderRadius: 10,
      marginTop: 10
   },
   profileEmptyBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
      paddingVertical: 9,
      borderRadius: 10
   },
   profileBtn: {
      flexDirection: "row",
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 10
   },
   btn: {
      paddingHorizontal: 10.5,
      paddingVertical: 7,
      borderRadius: 10
   },
   profileBot: {
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8
   },
   menuButton: {
      paddingVertical: 5,
      paddingHorizontal: 9,
   },
   banner: {
      width: '100%',
      zIndex: -1,
   },
   bannerImage: {
      width: '100%',
      height: '100%',
   },
   profileInfo: {
      width: "100%",
      position: "relative",
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      paddingHorizontal: 10,
      paddingTop: 40,
      zIndex: 1
   },
   avatarWrapper: {
      position: "absolute",
      bottom: 0,
   },
   profileLogo: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
   },
   profileLogoWrapper: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
   },
});
