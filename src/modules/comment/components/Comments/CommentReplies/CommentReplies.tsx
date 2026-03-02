import { AsyncDataRender, MainText } from '@core/ui';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Dimensions, FlatList, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
   runOnJS,
   useAnimatedStyle,
   useSharedValue,
   withTiming,
} from 'react-native-reanimated';
import { commentActionsStore, commentInteractionsStore, GetCommentsResponse } from 'src/modules/comment/stores';
import { themeStore } from 'src/modules/theme/stores';
import { Comment } from '../Comment/Coment';

const screenWidth = Dimensions.get('window').width;

export const CommentReplies = observer(() => {
   const { currentTheme } = themeStore;
   const {
      replies: { data, status, options },
      getRepliesAction,
   } = commentActionsStore;
   const {
      repliesOpen: { setRepliesOpen },
      selectedCommentForReply: { selectedCommentForReply },
      repliesScrollRef: { setRepliesScrollRef },
      getCachedRepliesData,
   } = commentInteractionsStore;

   const scrollRef = useRef(null);
   const translateX = useSharedValue(screenWidth);
   const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

   const panGesture = Gesture.Pan()
      .onUpdate((e) => {
         if (e.translationX > 0) {
            translateX.value = e.translationX;
         }
      })
      .onEnd((e) => {
         if (e.translationX > 100) {
            translateX.value = withTiming(screenWidth, { duration: 200 }, () => {
               runOnJS(setRepliesOpen)(false);
            });
         } else {
            translateX.value = withTiming(0);
         }
      });

   useEffect(() => {
      translateX.value = withTiming(0, { duration: 300 });
   }, []);

   useEffect(() => {
      if (selectedCommentForReply) {
         runInAction(() => {
            commentActionsStore.clearRepliesData();
         });
         getRepliesAction("new", true);
      }
   }, [selectedCommentForReply?.id]);

   useEffect(() => {
      if (!scrollRef) return;
      setRepliesScrollRef(scrollRef);
   }, [scrollRef]);


   const renderItem = useCallback(({ item }: { item: GetCommentsResponse; }) => (
      <Comment
         comment={item}
         type="reply"
      />
   ), []);

   const keyExtractor = useCallback((item: GetCommentsResponse) => item.id, []);

   const reversedData = useRef<GetCommentsResponse[]>([]);

   const renderReplies = useCallback((reply: GetCommentsResponse[] | undefined) => {
      if (!reply || reply.length === 0) {
         return <MainText>Нет ответов</MainText>;
      }
      reversedData.current = [...reply].reverse();
      return (
         <FlatList
            ref={scrollRef}
            showsVerticalScrollIndicator={true}
            scrollIndicatorInsets={{ right: 1 }}
            data={reversedData.current}
            onScroll={options?.dataScope?.onScroll}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item?.id}-${index}`}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
         />
      );
   }, [scrollRef, options, renderItem, keyExtractor]);

   const styles = useMemo(() => createStyles(currentTheme.bg_200), [currentTheme.bg_200]);

   if (!selectedCommentForReply) {
      console.warn("[CommentReplies]: No comment provided");
      return <MainText>[CommentReplies]: Нет комментария</MainText>;
   }

   return (
      <GestureDetector gesture={panGesture}>
         <Animated.View style={[styles.screen, animatedStyle]}>
            <Comment
               comment={selectedCommentForReply}
               mode="reply"
               type="default"
            />
            <AsyncDataRender
               data={getCachedRepliesData()?.items ?? data?.items ?? []}
               status={status}
               renderContent={renderReplies}
               noDataText="Нет ответов"
            />
         </Animated.View>
      </GestureDetector>
   );
});

const createStyles = (bgColor: string) => StyleSheet.create({
   screen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: bgColor,
      zIndex: 10,
   },
});