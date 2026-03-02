import { AsyncDataRender, BgWrapperUi, MainText, SimpleButtonUi } from '@core/ui';
import { BackArrowLeftIcon } from '@icons/Ui/BackArrowLeftIcon';
import { useNavigation, useRoute } from '@lib/navigation';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { FlatList, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Post } from 'src/modules/post/components/Post/Post';
import { postActionsStore, postInteractionsStore } from 'src/modules/post/stores';
import { themeStore } from 'src/modules/theme/stores';
import { profileStore } from 'src/modules/user/stores/profile';

type PostDetailRouteParams = {
   PostDetail: {
      postId: number;
   };
};

export const PostDetail = observer(() => {
   const { currentTheme } = themeStore;
   const {
      userToShow
   } = profileStore;
   const {
      userPosts: { data, status }
   } = postActionsStore;
   const {
      selectedUserPost: { selectedUserPost },
      getAfterBeforePosts
   } = postInteractionsStore;

   const { t } = useTranslation();
   const navigation = useNavigation();
   const route = useRoute();
   const flatListRef = useRef<FlatList>(null);
   const { postId } = route.params as { postId: number; };
   const effectivePostId = postId || selectedUserPost?.id;

   const translateX = useSharedValue(0);
   const translateY = useSharedValue(0);
   const opacity = useSharedValue(1);
   const scale = useSharedValue(1);

   const renderItem = useCallback(({ item, index }: any) => {
      const isFirstPost = index === 0 && item.id === effectivePostId;
      return (
         <Post
            key={item.id}
            post={item}
         />
      );
   }, [effectivePostId]);

   const onScrollToIndexFailed = useCallback((info: any) => {
      setTimeout(() => {
         if (flatListRef.current) {
            flatListRef.current.scrollToOffset({
               offset: info.averageItemLength * info.index,
               animated: false
            });
         }
      }, 0);
   }, []);

   const orderedList = useMemo(() => {
      if (!data?.list || !effectivePostId) return data?.list || [];
      const selectedIndex = data.list.findIndex(p => p.id === effectivePostId);
      if (selectedIndex === -1) return data.list;
      const selectedPost = data.list[selectedIndex];
      const before = data.list.slice(0, selectedIndex);
      const after = data.list.slice(selectedIndex + 1);
      return [selectedPost, ...after, ...before];
   }, [data?.list, effectivePostId]);

   const renderPosts = useCallback(() => {
      return (
         <FlatList
            ref={flatListRef}
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={true}
            scrollIndicatorInsets={{ right: 1 }}
            data={orderedList}
            renderItem={renderItem}
            onScrollToIndexFailed={onScrollToIndexFailed}
         />
      );
   }, [orderedList, renderItem, onScrollToIndexFailed]);

   const gesture = Gesture.Pan()
      .onUpdate((value) => {
         translateX.value = value.translationX * 0.8;
         translateY.value = value.translationY * 0.8;
         const distance = Math.sqrt(
            value.translationX * value.translationX +
            value.translationY * value.translationY
         );
         const scaleValue = Math.min(Math.max(distance / 100, 1), 0.9);
         scale.value = withTiming(scaleValue, { duration: 100 });
      })
      .onEnd(() => {
         if (translateY.value > 50) {
            opacity.value = 0;
            runOnJS(navigation.goBack)();
         } else {
            translateX.value = withTiming(0, { duration: 300 });
            translateY.value = withTiming(0, { duration: 300 });
            scale.value = withTiming(1, { duration: 300 });
         }
      });

   const animatedStyle = useAnimatedStyle(() => ({
      transform: [
         { translateX: translateX.value },
         { translateY: translateY.value },
         { scale: scale.value },
      ],
      backgroundColor: interpolateColor(
         opacity.value,
         [0, 1],
         ['transparent', currentTheme.bg_200]
      ),
      borderRadius: 20,
      overflow: 'hidden',
   }));

   return (
      <SafeAreaView
         style={{ backgroundColor: 'transparent', flex: 1 }}
      >
         <GestureDetector gesture={gesture}>
            <Animated.View
               style={[styles.container, animatedStyle]}
               sharedTransitionTag={effectivePostId?.toString()}
            >
               <BgWrapperUi>
                  <View style={styles.container}>
                     <View style={[
                        styles.header,
                        {
                           backgroundColor: currentTheme.bg_200,
                           borderBottomColor: currentTheme.border_100,
                        }
                     ]}>
                        <SimpleButtonUi
                           onPress={() => {
                              opacity.value = withTiming(0, { duration: 200 }, () => {
                                 runOnJS(navigation.goBack)();
                              });
                           }}
                           style={styles.backButton}
                        >
                           <BackArrowLeftIcon
                              height={20}
                              width={10}
                              color={currentTheme.primary_100}
                           />
                        </SimpleButtonUi>

                        <View>
                           <View>
                              <MainText px={12} tac='center' fontWeight='bold'>
                                 {userToShow?.name}
                              </MainText>
                           </View>

                           <View>
                              <MainText px={14} tac='center'>
                                 {t('post_detail')}
                              </MainText>
                           </View>
                        </View>
                     </View>

                     <View style={styles.contentContainer}>
                        <AsyncDataRender
                           status={status}
                           data={orderedList}
                           noDataText={t('no_posts')}
                           renderContent={renderPosts}
                           messageHeightPercent={40}
                        />
                     </View>
                  </View>
               </BgWrapperUi>
            </Animated.View>
         </GestureDetector>
      </SafeAreaView>
   );
});

const styles = StyleSheet.create({
   header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingBottom: 8,
      borderBottomWidth: 1,
      display: 'flex',
      justifyContent: 'center',
      position: 'relative',
   },
   postsContainer: {
      flex: 1,
   },
   container: {
      flex: 1,
      borderRadius: 20,
      overflow: 'hidden',
   },
   contentContainer: {
      flex: 1,
   },
   headerRight: {
      width: 20,
   },
   backButton: {
      marginRight: 16,
      position: 'absolute',
      left: 15,
   },
   scrollContainer: {
      flex: 1,
      width: '100%',
   },
   image: {
      width: '100%',
      height: 300,
      objectFit: 'cover',
   },
   title: {
      marginBottom: 12,
   },
   content: {
      lineHeight: 22,
   }
}); 