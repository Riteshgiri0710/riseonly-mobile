import { AsyncDataRender } from '@core/ui';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated } from 'react-native';
import { Post } from 'src/modules/post/components/Post/Post';
import { GetPostFeedResponse, postActionsStore } from 'src/modules/post/stores';
import { searchInteractionsStore } from 'src/modules/search/stores/post';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList<GetPostFeedResponse>);

export const PostsInteresting = observer(() => {
   const { t } = useTranslation();
   const {
      postsFeed: { status, data },
      getPostsAction,
   } = postActionsStore;
   const { selectedPost: { selectedPost, setSelectedPost } } = searchInteractionsStore;
   const headerRef = useRef<any | null>(null);
   const flatListRef = useRef(null);
   const scrollY = useRef(new Animated.Value(0)).current;

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

   useFocusEffect(
      useCallback(() => {
         getPostsAction(false, true, true, true);
         return () => {
            setSelectedPost(null);
         };
      }, [])
   );

   const [showAsync, setShowAsync] = useState(false);

   useEffect(() => {
      const id = setTimeout(() => setShowAsync(true), 0);
      return () => clearTimeout(id);
   }, []);

   return (

      <ProfileSettingsWrapper
         tKey={t("post_interesting")}
         height={45}
      >
         {/* @ts-ignore */}
         <AnimatedFlashList
            onScroll={handleScroll}
            ref={flatListRef}
            data={data?.list}
            estimatedItemSize={500}
            scrollEventThrottle={16}
            ListHeaderComponent={(
               <>
                  <Post post={selectedPost!} />
                  {showAsync && (
                     <AsyncDataRender
                        status={status}
                        data={data?.list}
                        noDataText={t('no_posts')}
                        renderContent={() => {
                           return data?.list?.map((item) => {
                              return (
                                 <Post key={item.id} post={item} />
                              );
                           });
                        }}
                        messageHeightPercent={40}
                     />
                  )}
               </>
            )}
         />
      </ProfileSettingsWrapper>
   );
});



