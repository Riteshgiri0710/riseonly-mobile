import { BackArrowLeftIcon } from '@icons/Ui/BackArrowLeftIcon';
import { logger } from '@lib/helpers';
import { goBack, useNavigation } from '@lib/navigation';
import { formatDiffData } from '@lib/text';
import { changeRgbA } from '@lib/theme';
import { profileStore } from '@modules/user/stores/profile';
import { websocketApiStore } from '@stores/ws/websocket-api-store';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { observer } from 'mobx-react-lite';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlexAlignType, GestureResponderEvent, LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { themeStore } from 'src/modules/theme/stores';
import { Box } from '../BoxUi/Box';
import { LoaderUi } from '../LoaderUi/LoaderUi';
import { MainText } from '../MainText/MainText';
import { SimpleButtonUi } from '../SimpleButtonUi/SimpleButtonUi';

interface PageHeaderUiProps {
   text?: string;
   style?: StyleProp<ViewStyle>;
   cancelText?: string | null;
   leftJsx?: ReactNode | null;
   rightJsx?: ReactNode | null;
   midJsx?: ReactNode | null;
   Component?: any;
   intensity?: number;
   rightTop?: number;
   leftTop?: number;
   isBlurView?: boolean;
   wrapperJustifyContent?: FlexAlignType;
   height?: number;
   loading?: "nointernet" | "pending" | "fulfilled" | "error";
   icon?: ReactNode;
   withoutBackBtn?: boolean;
   midPress?: () => void;
   onlyLayout?: boolean;
   additionalJsx?: ReactNode | null;
   noSafeZone?: boolean;
   onSafeZoneHeight?: (height: number) => void;
}

export const PageHeaderUi = observer(({
   text = "PageHeaderUi",
   style = {},
   withoutBackBtn = false,
   cancelText = null,
   Component = View,
   rightTop = 0,
   leftTop = 0,
   leftJsx = null,
   midPress,
   intensity = 30,
   loading,
   midJsx = null,
   icon,
   isBlurView = false,
   wrapperJustifyContent = "flex-start",
   height = 30,
   rightJsx = null,
   onlyLayout = false,
   additionalJsx = null,
   noSafeZone = false,
   onSafeZoneHeight,
}: PageHeaderUiProps) => {
   const { currentTheme } = themeStore;
   const {
      wsApi: {
         wsIsConnecting,
         wsIsError
      }
   } = websocketApiStore;
   const { isNoInternet: { isNoInternet } } = profileStore;

   const [headerHeight, setHeaderHeight] = useState(0);

   const { t } = useTranslation();
   const navigation = useNavigation();
   const insets = useSafeAreaInsets();
   const { width } = useWindowDimensions();

   const onBackPress = (event: GestureResponderEvent) => {
      event.preventDefault();
      event.stopPropagation();
      // TODO: ФИКСАНУТЬ goback
      logger.debug("onBackPress", `go back to - ${formatDiffData(navigation)}`);
      goBack();

      // navigation.goBack();
   };

   const onHeaderLayout = (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      setHeaderHeight(height);
   };

   const onWrapperLayout = (event: LayoutChangeEvent) => {
      if (noSafeZone || !onSafeZoneHeight) return;
      const { height } = event.nativeEvent.layout;
      onSafeZoneHeight(insets.top + height);
   };

   const reportOnlyLayoutSafeZone = (event: LayoutChangeEvent) => {
      if (noSafeZone || !onSafeZoneHeight) return;
      const { height } = event.nativeEvent.layout;
      onSafeZoneHeight(insets.top * 1.65 + height);
   };

   if (onlyLayout) {
      return (
         <Component
            style={[
               s.header,
               {
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: insets.top * 1.65,
                  zIndex: 100,
                  alignItems: "flex-end",
                  top: insets.top * 1.65,
               },
               style,
            ]}
            onLayout={(e: LayoutChangeEvent) => {
               onHeaderLayout(e);
               reportOnlyLayoutSafeZone(e);
            }}
            intensity={intensity}
         >
            <View
               style={[
                  s.wrapper,
                  {
                     minWidth: width,
                     justifyContent: wrapperJustifyContent as any,
                     height,
                  }
               ]}
            >
               {!withoutBackBtn && (
                  <SimpleButtonUi
                     onPress={onBackPress}
                     style={[
                        s.backButton,
                        {
                           top: leftTop,
                           zIndex: 10,
                           borderWidth: 1,
                           borderColor: currentTheme.border_100,
                        },
                     ]}
                  >
                     <BackArrowLeftIcon
                        height={20}
                        width={12.5}
                        color={currentTheme.primary_100}
                     />
                     {leftJsx && leftJsx}
                  </SimpleButtonUi>
               )}

               {rightJsx && (
                  <View
                     style={[
                        s.right,
                        { top: rightTop }
                     ]}
                  >
                     {rightJsx}
                  </View>
               )}
            </View>
         </Component>
      );
   }

   return (
      <Box
         style={[
            s.header,
            {
               // borderBottomColor: currentTheme.border_100,
               left: 0,
               right: 0,
               zIndex: 100,
               // backgroundColor: isBlurView ? currentTheme.bg_100 : undefined,
            },
            style,
         ]}
         onLayout={onHeaderLayout}
      // intensity={intensity}
      >
         <LinearGradient
            colors={[
               'rgba(0, 0, 0, 0)',
               'rgba(0, 0, 0, 0)',
               'rgba(0, 0, 0, 0.5)',
               'rgba(0, 0, 0, 0.7)',
               'rgba(0, 0, 0, 0.85)',
               'rgba(0, 0, 0, 0.9)',
               'rgba(0, 0, 0, 0.9)',
            ]}
            locations={[0, 0.15, 0.35, 0.6, 0.85, 1, 1]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={{
               position: 'absolute',
               top: 0,
               left: -10,
               right: -10,
               height: 150,
               zIndex: 0,
               pointerEvents: 'none',
            }}
         />

         <Box
            style={[
               s.wrapper,
               {
                  top: insets.top,
                  left: 0,
                  right: 0,
                  minWidth: width,
                  justifyContent: wrapperJustifyContent as any,
               }
            ]}
            gap={10}
            onLayout={onWrapperLayout}
         >
            <Box
               fD="row"
               align="center"
               justify='center'
               height={40}
            >
               {!withoutBackBtn && (
                  <BlurView
                     intensity={25}
                     style={[
                        s.backButton,
                        { zIndex: 10, paddingRight: 3 },
                        { height: 40, width: 40, backgroundColor: changeRgbA(currentTheme.bg_100, 0.8), borderRadius: 1000, overflow: "hidden" },
                        { borderWidth: 1, borderColor: currentTheme.border_100, }
                     ]}
                  >
                     <SimpleButtonUi
                        onPress={onBackPress}
                     >
                        <BackArrowLeftIcon
                           height={17}
                           width={12.5}
                           color={currentTheme.primary_100}
                        />
                        {leftJsx && leftJsx}
                     </SimpleButtonUi>
                  </BlurView>
               )}

               {midJsx ? (
                  <Box
                     height={"100%"}
                     width={"100%"}
                     align='center'
                     justify='center'
                  >
                     {midJsx}
                  </Box>
               ) : (
                  <Box
                     width={"100%"}
                     height={"100%"}
                     fD='row'
                     gap={5}
                     align='center'
                     justify='center'
                  >
                     {(wsIsConnecting || isNoInternet || wsIsError) ? (
                        <>
                           <LoaderUi
                              color={currentTheme.text_100}
                              size={"small"}
                           />
                           <MainText
                              tac='center'
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              fontWeight='bold'
                              px={17}
                           >
                              {loading == "error" ? t("chats_error") : loading == "nointernet" ? t("chats_nointernet") : t("chats_pending")}
                           </MainText>
                        </>
                     ) : (
                        <>
                           <MainText
                              tac='center'
                              fontWeight='bold'
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              px={17}
                              style={{ maxWidth: "75%" }}
                           >
                              {text}
                           </MainText>
                           {icon && icon}
                        </>
                     )}
                  </Box>
               )}

               {rightJsx && (
                  <Box
                     style={[
                        s.right,
                        { top: rightTop }
                     ]}
                     height={"100%"}
                     centered
                  >
                     <BlurView
                        intensity={25}
                        style={[
                           s.right,
                           { top: rightTop },
                           { height: 40, backgroundColor: changeRgbA(currentTheme.bg_100, 0.8), borderRadius: 1000, overflow: "hidden" },
                           { borderWidth: 1, borderColor: currentTheme.border_100, }
                        ]}
                     >
                        {rightJsx}
                     </BlurView>
                  </Box>
               )}
            </Box>

            <Box>
               {additionalJsx && (
                  <>
                     {additionalJsx}
                  </>
               )}
            </Box>
         </Box>
      </Box>
   );
});

const s = StyleSheet.create({
   header: {
   },
   wrapper: {
      position: "absolute",
      justifyContent: "flex-start",
      flex: 1,
   },
   headerRight: {
      width: 20,
   },
   backButton: {
      alignItems: 'center',
      justifyContent: 'center',
      position: "absolute",
      left: 10,
   },
   right: {
      position: 'absolute',
      right: 5,
      alignItems: 'center',
      justifyContent: 'center',
   }
});