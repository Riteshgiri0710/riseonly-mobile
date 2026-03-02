import { getProfileStatuses } from '@core/config/tsx';
import { Box, ContextMenuUi, GetWho, ImageSwiper, LiveTimeAgo, MainText, PremiumIconUi, RenderFormattedText, SimpleButtonUi, UserLogo } from '@core/ui';
import { MoreIcon } from '@icons/MainPage/Chats/MoreIcon';
import { navigate } from '@lib/navigation';
import { pxNative } from '@lib/theme';
import { getPostContextMenuItems } from '@modules/post/shared/config/context-menu-data';
import { observer } from 'mobx-react-lite';
import React, { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DimensionValue, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { commentInteractionsStore } from 'src/modules/comment/stores';
import { moderationStore } from 'src/modules/moderation/stores';
import { GetPostFeedResponse, postActionsStore, postInteractionsStore } from 'src/modules/post/stores';
import { themeStore } from 'src/modules/theme/stores';
import { profileStore } from 'src/modules/user/stores/profile';
import { PostActions } from './PostActions/PostActions';

interface PostProps {
   post: GetPostFeedResponse;
   containerStyle?: StyleProp<ViewStyle>;
   isPreview?: boolean;
   imageWidth?: DimensionValue;
   isFirst?: boolean;
   firstStyle?: StyleProp<ViewStyle>;
}

const PostComponent = observer(({
   post,
   containerStyle = {},
   isPreview = false,
   imageWidth,
   isFirst,
   firstStyle
}: PostProps) => {
   const { currentTheme } = themeStore;
   const { profile } = profileStore;
   const {
      likePost: { status: likeStatus },
      favPost: { status: favStatus }
   } = postActionsStore;
   const {
      toggleLikePost,
      toggleFavPost,
      setSelectedPost
   } = postInteractionsStore;

   const { isCommentOpen, setIsCommentOpen } = commentInteractionsStore;

   const { t } = useTranslation();
   const [postContextMenuOpen, setPostContextMenuOpen] = useState(false);
   const closeButtonRef = useRef<View>(null);

   const handleOpenComments = useCallback(() => {
      if (isPreview) return;
      console.log("[handleOpenComments]: post.selectedCommentSort ", post.selectedCommentSort);
      setSelectedPost(post);
      setIsCommentOpen(true);
   }, [isPreview, post, setSelectedPost, setIsCommentOpen]);

   const { isReportOpen: { setIsReportOpen } } = moderationStore;

   const toggleLikeHandler = useCallback(() => {
      if (!isPreview) toggleLikePost(Number(post?.id), post);
   }, [isPreview, post, toggleLikePost]);

   const toggleFavHandler = useCallback(() => {
      if (!isPreview) toggleFavPost(Number(post?.id), post);
   }, [isPreview, post, toggleFavPost]);

   const handleImagePress = useCallback((index: number) => {
      console.log('Image pressed at index:', index);
   }, []);

   const onContextMenuClose = useCallback(() => {
      setPostContextMenuOpen(false);
   }, []);

   const onAvatarPress = useCallback(() => {
      if (isPreview) return;
      if (post.author_id == profile?.id) navigate("Profile");
      else navigate("UserPage", { tag: post?.author?.tag });
   }, [isPreview, post?.author_id, post?.author?.tag, profile?.id]);

   const onContextMenuOpen = useCallback(() => {
      if (isPreview) return;
      setSelectedPost(post);
      setPostContextMenuOpen(true);
   }, [isPreview, post, setSelectedPost]);

   const btnsPaddingHorizontal = isPreview ? 5 : 10;
   const iconSize = isPreview ? 8 : 17.5;
   const textSize = isPreview ? 9 : 15;
   const btnGap = isPreview ? 3 : 5;
   const titlePx = isPreview ? 11 : 20;
   const contentPx = isPreview ? 9 : 15;
   const postHeight = isPreview ? 100 : 300;

   const IsTagScrollView = isPreview ? ScrollView : Fragment;

   const renderedTags = useMemo(() => {
      return post.tags?.map((tag, index) => (
         <View
            key={index}
            style={[
               styles.tag,
               {
                  paddingHorizontal: isPreview ? 6 : 10,
                  paddingVertical: isPreview ? 1 : 3,
                  backgroundColor: currentTheme.bg_000,
               }
            ]}
         >
            <MainText px={isPreview ? 7 : 10}>
               {tag}
            </MainText>
         </View>
      ));
   }, [post.tags, isPreview, currentTheme.bg_000]);

   const renderedHashtags = useMemo(() => {
      return post.hashtags?.map((hashtag, index) => (
         <MainText
            key={index}
            color={currentTheme.primary_100}
            px={contentPx}
         >
            {`#${hashtag} `}
         </MainText>
      ));
   }, [post.hashtags, currentTheme.primary_100, contentPx]);

   return (
      <Animated.View
         style={[
            styles.container,
            {
               marginVertical: isPreview ? 0 : 5,
               backgroundColor: currentTheme.bg_200,
               borderRadius: pxNative(currentTheme.radius_100)
            },
            containerStyle,
            isFirst && firstStyle
         ]}
         sharedTransitionTag={post.id.toString()}
      >
         <View
            style={[
               styles.header,
               { marginBottom: isPreview ? 5 : 10 }
            ]}
         >
            <View style={styles.headerLeft}>
               <View>
                  <UserLogo
                     source={post.author_id == profile?.id ? profile?.more?.logo : post.author?.more?.logo}
                     size={isPreview ? 20 : 40}
                     onPress={onAvatarPress}
                     isButton
                  />
               </View>
               <View style={styles.headerLeftRight}>
                  <View
                     style={[
                        styles.headerLeftRightTop,
                        { gap: isPreview ? 3 : 5 }
                     ]}
                  >
                     <MainText
                        px={isPreview ? 10 : 16}
                        numberOfLines={1}
                     >
                        {post.author?.name || ''}
                     </MainText>
                     <PremiumIconUi
                        isPremium={post.author?.more?.isPremium}
                        size={isPreview ? 10 : 20}
                     />
                  </View>
                  {!isPreview && (
                     <View style={styles.headerLeftRightBot}>
                        <GetWho
                           who={post.author?.more?.who}
                           marginTop={2}
                        />
                        {getProfileStatuses(post.author?.more?.p_lang?.[0])}
                     </View>
                  )}
               </View>
            </View>

            <SimpleButtonUi
               ref={closeButtonRef}
               style={styles.headerRight}
               onPress={onContextMenuOpen}
            >
               <MoreIcon width={textSize} />
            </SimpleButtonUi>

            <ContextMenuUi
               items={getPostContextMenuItems(post)}
               isVisible={postContextMenuOpen}
               onClose={onContextMenuClose}
               anchorRef={closeButtonRef}
               width={180}
               offset={{ x: 0, y: 20 }}
            />
         </View>

         {post?.images?.length > 0 && (
            <View style={styles.images}>
               <Animated.Image
                  source={{ uri: post.images[0] }}
                  style={{ height: postHeight, width: "100%", position: 'absolute', top: 0, zIndex: -1 }}
                  sharedTransitionTag={post.id.toString() + "1"}
               />
               <ImageSwiper
                  images={post.images}
                  onImagePress={handleImagePress}
                  height={postHeight}
                  imageWidth={imageWidth || null}
               />
            </View>
         )}

         <View style={[styles.bottom, { paddingTop: isPreview ? 0 : 5 }]}>
            <Box
               style={styles.textContent}
               gap={isPreview ? 0 : 10}
            >
               {post.tags?.length > 0 && (
                  <IsTagScrollView>
                     <View
                        style={[styles.tags, { marginBottom: 5, flexWrap: isPreview ? "nowrap" : "wrap" }]}
                     >
                        {renderedTags}
                     </View>
                  </IsTagScrollView>
               )}

               <MainText
                  style={styles.title}
                  px={titlePx}
                  numberOfLines={isPreview ? 3 : 0}
               >
                  {post.title || t("preview_post_title") || ''}
               </MainText>

               <RenderFormattedText
                  text={isPreview ? (post.content || t("preview_post_content")) : (post.content || '')}
                  textStyle={{
                     fontSize: contentPx,
                  }}
                  numberOfLines={isPreview ? 6 : 0}
               />

               {post.hashtags?.length > 0 && (
                  <View style={styles.hashtags}>
                     <MainText
                        numberOfLines={isPreview ? 3 : 0}
                     >
                        {renderedHashtags}
                     </MainText>
                  </View>
               )}
            </Box>

            <View style={styles.footer}>
               <PostActions
                  post={post}
                  isPreview={isPreview}
                  toggleLikeHandler={toggleLikeHandler}
                  toggleFavHandler={toggleFavHandler}
                  handleOpenComments={handleOpenComments}
                  btnsPaddingHorizontal={btnsPaddingHorizontal}
                  iconSize={iconSize}
                  textSize={textSize}
                  btnGap={btnGap}
               />

               <View style={styles.footerRight}>
                  <LiveTimeAgo
                     date={post.created_at}
                     style={{
                        ...styles.dateText,
                        color: currentTheme.secondary_100
                     }}
                     fontSize={isPreview ? 7 : 10}
                  />
               </View>
            </View>
         </View>
      </Animated.View>
   );
});

export const Post = React.memo(PostComponent, (prevProps, nextProps) => {
   return (
      prevProps.post.id === nextProps.post.id &&
      prevProps.post.is_liked === nextProps.post.is_liked &&
      prevProps.post.is_favorited === nextProps.post.is_favorited &&
      prevProps.post.likes_count === nextProps.post.likes_count &&
      prevProps.post.favorites_count === nextProps.post.favorites_count &&
      prevProps.post.comments_count === nextProps.post.comments_count &&
      prevProps.isPreview === nextProps.isPreview &&
      prevProps.isFirst === nextProps.isFirst
   );
});

const styles = StyleSheet.create({
   hashtags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
   },
   tags: {
      flexDirection: 'row',
      gap: 3,
   },
   tag: {
      borderRadius: 7,
   },
   bottom: {
      paddingBottom: 10,
      flex: 1,
      justifyContent: "space-between"
   },
   footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
      paddingHorizontal: 10,
   },
   footerLeft: {
      flexDirection: 'row',
      gap: 5,
      alignItems: 'center',
   },
   footerRight: {

   },
   images: {
      position: 'relative',
      width: "100%"
   },
   headerLeftRightBot: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5
   },
   headerLeftRightTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5
   },
   headerLeftRight: {
      flexDirection: 'column',
      gap: 2
   },
   headerLeft: {
      flexDirection: 'row',
      gap: 10
   },
   headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      height: '100%',
      paddingLeft: 15,
      paddingRight: 3,
      gap: 10,
   },
   container: {
   },
   header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingTop: 10,
   },
   textContent: {
      paddingHorizontal: 10,
   },
   title: {
      fontWeight: 'bold',
   },
   dateText: {}
});
