import { ClosedTagAnimation } from '@animations/components/ClosedTagAnimation';
import { AsyncDataRender, Box, MainText } from '@core/ui';
import { logger } from '@lib/helpers';
import { formatDiffData } from '@lib/text';
import { changeRgbA } from '@lib/theme';
import { observer } from 'mobx-react-lite';
import { useMobxUpdate } from 'mobx-toolbox';
import { Fragment, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { GetCommentsResponse, commentActionsStore, commentInteractionsStore } from 'src/modules/comment/stores';
import { postInteractionsStore } from 'src/modules/post/stores';
import { themeStore } from 'src/modules/theme/stores';
import { Comment } from './Comment/Coment';

export const Comments = observer(() => {
   const { currentTheme } = themeStore;
   const { selectedPost, setSelectedPost } = postInteractionsStore;
   const {
      comments: {
         data,
         status,
         options
      },
      getCommentsAction
   } = commentActionsStore;
   const {
      commentScrollRef: { setCommentScrollRef },
      commentRenderType: { setCommentRenderType },
      setCommentUpdater,
      getCachedCommentsData
   } = commentInteractionsStore;

   const {
      repliesOpen: { setRepliesOpen },
      selectedCommentForReply: { setSelectedCommentForReply },
   } = commentInteractionsStore;

   const { t } = useTranslation();
   const scrollViewRef = useRef(null);

   useEffect(() => {
      if (!selectedPost?.cachedComments) getCommentsAction(selectedPost?.selectedCommentSort || "feed", false);
      else {
         setCommentRenderType("cached");
         setCommentUpdater(useMobxUpdate(() => getCachedCommentsData()?.items || []));
      }
      return () => { setSelectedPost(null); };
   }, []);

   useEffect(() => {
      setRepliesOpen(false);
      setSelectedCommentForReply(null);
   }, [selectedPost?.id]);

   useEffect(() => {
      setCommentScrollRef(scrollViewRef);
   }, [scrollViewRef]);

   const renderItem = useCallback(({ item, index }: { item: GetCommentsResponse; index: number; }) => {
      if (!item || !item?.id) {
         logger.debug("renderCommentsList", `${formatDiffData(item)}`);
         logger.debug("renderCommentsList", `${item?.id}`);
         console.log('Некорректный элемент комментария:', item);
         return null;
      }

      return (
         <Fragment key={item.id}>
            <Comment
               comment={item}
               mode='comments'
               isFirst={index === 0}
            />
            {item?.preview_reply_comment && (
               <Comment
                  comment={item.preview_reply_comment}
                  mode='comments'
                  type='comments'
               />
            )}
         </Fragment>
      );
   }, []);

   const keyExtractor = useCallback((item: GetCommentsResponse) => String(item.id || ''), []);

   const renderCommentsList = useCallback((commentsData: GetCommentsResponse[]) => {
      return (
         <View style={styles.listContainer}>
            <FlatList
               ref={scrollViewRef}
               contentContainerStyle={styles.listContent}
               onScroll={options?.dataScope?.onScroll}
               bounces={false}
               scrollEventThrottle={16}
               keyboardDismissMode="on-drag"
               data={commentsData}
               renderItem={renderItem}
               keyExtractor={(item, index) => `${String(item?.id || '')}-${index}`}
               removeClippedSubviews={true}
               maxToRenderPerBatch={10}
               windowSize={10}
               initialNumToRender={10}
            />
         </View>
      );
   }, [scrollViewRef, options, renderItem, keyExtractor]);

   return (
      <View style={styles.container}>
         <AsyncDataRender
            status={status}
            data={data?.items}
            noDataText={t('no_comments')}
            renderContent={renderCommentsList}
            emptyScrollViewStyle={{ flex: 0 }}
            isEmptyScrollView={false}
            emptyComponent={!selectedPost?.can_comment && (
               <Box centered style={{ position: "relative" }}>
                  <ClosedTagAnimation size={300} />
                  <MainText
                     px={17}
                     fontWeight="bold"
                     tac='center'
                     style={[
                        styles.emptyKey,
                        {
                           color: currentTheme.text_100,
                           flex: 1,
                           position: "absolute",
                           bottom: "17%",
                           transform: [
                              { scaleY: 1 },
                              { skewX: "0deg" },
                              { skewY: "0deg" },
                           ],
                           textShadowColor: changeRgbA(currentTheme.primary_100, "0.7"),
                           textShadowOffset: { width: -1, height: 1 },
                           textShadowRadius: 3.5,
                        }
                     ]}
                  >
                     {t("can_comment_false")}
                  </MainText>
                  )
               </Box>
            )}
            noDataHeightPercent={1}
         />
      </View>
   );
});

const styles = StyleSheet.create({
   container: {
      flex: 1,
      width: '100%',
   },
   listContainer: {
      flex: 1
   },
   listContent: {
      flexGrow: 1,
   },
   emptyKey: {}
});