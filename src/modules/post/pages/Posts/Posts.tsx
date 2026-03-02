import { appName } from '@core/config/const';
import { AsyncDataRender, BgWrapperUi, Box, ButtonUi, ImageViewerUi, MainText } from '@core/ui';
import { AnimatedHeader } from '@core/widgets/headers';
import { NotifyIcon } from '@icons/MainPage/NavBar';
import { navigate } from '@lib/navigation';
import { FlashList } from '@shopify/flash-list';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { commentInteractionsStore } from 'src/modules/comment/stores';
import { CommentsSheet } from 'src/modules/comment/widgets/bottomsheets';
import { Post } from 'src/modules/post/components';
import { GetPostFeedResponse, postActionsStore, postInteractionsStore } from 'src/modules/post/stores';
import { DeletePostModal } from 'src/modules/post/widgets/modals';
import { ReportsSheet } from 'src/modules/report/widgets/bottomsheets';
import { themeStore } from 'src/modules/theme/stores';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList<GetPostFeedResponse>);

export const Posts = observer(() => {
   const { currentTheme } = themeStore;
   const {
      postsFeed: { status, data, scopeStatus },
      getPostsAction,
   } = postActionsStore;
   const {
      imageOpen: { imageOpen, setImageOpen },
      postScrollRef: { setPostScrollRef },
      imageData
   } = postInteractionsStore;
   const {
      setIsCommentOpen,
   } = commentInteractionsStore;

   const { t } = useTranslation();
   const scrollY = useRef(new Animated.Value(0)).current;
   const headerRef = useRef<any | null>(null);
   const flatListRef = useRef(null);

   const handleScroll = Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      {
         useNativeDriver: true,
         listener: (event) => {
            postActionsStore.postsFeed?.options?.dataScope?.onScroll?.(event);
            if (headerRef.current && headerRef.current.handleScroll) {
               headerRef.current.handleScroll(event);
            }
         }
      }
   );

   useEffect(() => {
      if (flatListRef) setPostScrollRef(flatListRef);
      getPostsAction(false, true, true);
      return () => { setIsCommentOpen(false); };
   }, [flatListRef]);

   const renderItem = useCallback(({ item }: { item: GetPostFeedResponse; }) => {
      return <Post post={item} />;
   }, []);

   const keyExtractor = useCallback((item: GetPostFeedResponse) => String(item.id || ''), []);

   return (
      <>
         <ImageViewerUi
            open={imageOpen}
            onClose={() => setImageOpen(false)}
            imagesArr={imageData}
            currentImage={imageData[0]}
            totalCount={data?.list?.length || 0}
         />

         <BgWrapperUi>
            <AsyncDataRender
               status={status}
               data={(data?.list) || []}
               // TODO: fix scopeStatus
               // scopeStatus={scopeStatus}
               noDataText={t('no_posts')}
               renderContent={() => {
                  return (
                     <>
                        <AnimatedHeader
                           ref={headerRef}
                           content={
                              <View style={styles.headerContent}>
                                 <View style={styles.logoContainer}>
                                    <Box
                                       width={40}
                                       height={40}
                                       centered
                                       bgColor='transparent'
                                    >
                                       <Image
                                          source={require('@images/AppLogo.png')}
                                          style={{ width: "100%", height: "100%", resizeMode: 'contain', borderRadius: 10 }}
                                          resizeMode='contain'
                                       />
                                    </Box>
                                    <MainText>{appName}</MainText>
                                 </View>
                                 <View>
                                    <ButtonUi onPress={() => navigate("Notifications")} backgroundColor='transparent' fitContent px={0} >
                                       <NotifyIcon />
                                    </ButtonUi>
                                 </View>
                              </View>
                           }
                           backgroundColor={currentTheme.bg_200}
                           textColor={currentTheme.primary_100}
                           status={status}
                           loadingComponent={<></>}
                        />
                        <AnimatedFlashList
                           onScroll={handleScroll}
                           ref={flatListRef}
                           data={data?.list}
                           estimatedItemSize={500}
                           scrollEventThrottle={16}
                           renderItem={renderItem}
                           keyExtractor={keyExtractor}
                           removeClippedSubviews={true}
                           drawDistance={800}
                        />
                     </>
                  );
               }}
               messageHeightPercent={40}
            />
         </BgWrapperUi>

         <ReportsSheet />
         <DeletePostModal />
         <CommentsSheet />
      </>
   );
});

const styles = StyleSheet.create({
   headerContent: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12.5,
      paddingVertical: 5,
   },
   logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
   },
   flatList: {
      flex: 1,
      paddingTop: 5,
      marginBottom: 80,
   },
   container: {
      flex: 1,
   },
   loadingContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
   },
});
