import { Box, ButtonUi, ContextMenuUi, LiveTimeAgo, MainText, RenderFormattedText, Separator, SimpleButtonUi, UserLogo, UserNameAndBadgeUi } from '@core/ui';
import { MoreIcon } from '@icons/MainPage/Chats/MoreIcon';
import { ComDislike } from '@icons/MainPage/Posts/ComDislike';
import { CommentIcon } from '@icons/MainPage/Posts/CommentIcon';
import { LikeIcon } from '@icons/MainPage/Posts/LikeIcon';
import { navigate } from '@lib/navigation';
import { formatNumber } from '@lib/numbers';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useRef, useState } from 'react';
import { GestureResponderEvent, StyleSheet, View } from 'react-native';
import { getCommentContextMenuItems } from 'src/modules/comment/shared/config/context-menu-data';
import { GetCommentsResponse, commentInteractionsStore } from 'src/modules/comment/stores';
import { postInteractionsStore } from 'src/modules/post/stores';
import { themeStore } from 'src/modules/theme/stores';
import { profileStore } from 'src/modules/user/stores/profile';

const CommentComponent = observer(({
   comment,
   mode = "default",
   type = "default",
   isFirst
}: CommentProps) => {
   const { currentTheme } = themeStore;
   const { profile, setUserToShow } = profileStore;
   const { selectedPost } = postInteractionsStore;
   const {
      repliesOpen: { setRepliesOpen },
      selectedCommentForReply: { setSelectedCommentForReply },
      commentInputFocus: { setCommentInputFocus },
      rawReplyCommentText: { setRawReplyCommentText },
      replyCommentText: { setReplyCommentText },
      selectedCommentToReply: { setSelectedCommentToReply },
      selectedComment: { setSelectedComment },
      commentsBottomSheetCloseSignal: { setCommentsBottomSheetCloseSignal },
      likeCommentHandler,
      dislikeCommentHandler
   } = commentInteractionsStore;

   const [commentContextMenu, setCommentContextMenu] = useState(false);
   const moreBtnRef = useRef(null);

   const onPressContextMenu = useCallback(() => {
      setSelectedComment(comment);
      setCommentContextMenu(true);
   }, [comment, setSelectedComment]);

   const onRepliesPress = useCallback(() => {
      if (type == "reply" || mode == "reply" || mode == 'comments') {
         runInAction(() => {
            setSelectedCommentToReply(comment);
            setRawReplyCommentText(`@${comment.author.tag}, `);
            setReplyCommentText(`@${comment.author.tag}, `);
            setCommentInputFocus(p => !p);
         });
         if (mode == "comments") {
            setSelectedCommentForReply(comment);
            setRepliesOpen(true);
         }
         return;
      }
      setCommentInputFocus(p => !p);
   }, [type, mode, comment, setSelectedCommentToReply, setRawReplyCommentText, setReplyCommentText, setCommentInputFocus, setSelectedCommentForReply, setRepliesOpen]);

   const onCommentPress = useCallback(() => {
      if (mode == "reply") return;
      if (type == "reply") {
         onRepliesPress();
         return;
      }
      setSelectedCommentForReply(comment);
      setRepliesOpen(true);
   }, [mode, type, comment, onRepliesPress, setSelectedCommentForReply, setRepliesOpen]);

   const onAvatarPress = useCallback(() => {
      setCommentsBottomSheetCloseSignal(true);
      navigate("UserPage", { tag: comment.author.tag });
   }, [comment.author.tag, setCommentsBottomSheetCloseSignal]);

   const onLikePress = useCallback((event: GestureResponderEvent) => {
      event.stopPropagation();
      event.preventDefault();
      likeCommentHandler(comment.id as number, comment, type);
   }, [comment, type, likeCommentHandler]);

   const onDislikePress = useCallback((event: GestureResponderEvent) => {
      event.stopPropagation();
      event.preventDefault();
      dislikeCommentHandler(comment.id as number, comment, type);
   }, [comment, type, dislikeCommentHandler]);

   return (
      <SimpleButtonUi
         style={[
            styles.comment,

            {
               backgroundColor: comment.author_id === profile?.id ?
                  currentTheme.bg_100 :
                  currentTheme.bg_200,
               opacity: comment.is_temp ? 0.5 : 1,
               paddingLeft: type == "default" ? 10 : (30 + 10 + 10 - 5),
               marginTop: isFirst ? 30 : 0
            }
         ]}
         onPress={onCommentPress}
      >
         <View style={styles.commentLeft}>
            <View style={styles.commentHeaderLeft}>
               <UserLogo
                  source=''
                  size={30}
                  authorIcon={comment.author_id == selectedPost?.author_id}
                  onPress={onAvatarPress}
                  isButton
               />
            </View>

            <View style={styles.commentHeaderRight}>
               <Box
                  style={styles.commentHeaderRightTop}
                  fD='row'
                  justify="space-between"
                  align='center'
               >
                  <Box
                     style={styles.commentHeaderRightTopLeft}
                     centered
                  >
                     <UserNameAndBadgeUi
                        user={comment.author!}
                        showPremIcon={false}
                     />
                  </Box>

                  <Box
                     style={styles.commentHeaderRightTopRight}
                     centered
                  >
                     <SimpleButtonUi
                        ref={moreBtnRef}
                        style={styles.moreBtn}
                        onPress={onPressContextMenu}
                     >
                        <MoreIcon />
                     </SimpleButtonUi>

                     <ContextMenuUi
                        items={getCommentContextMenuItems(comment)}
                        isVisible={commentContextMenu}
                        onClose={() => setCommentContextMenu(false)}
                        anchorRef={moreBtnRef}
                     />
                  </Box>
               </Box>

               <RenderFormattedText
                  text={comment.content}
                  textStyle={{ fontSize: 13 }}
               />

               {/* <FormattedTextDisplay
						value={comment.content}
						isRawHtml={true}
					/> */}

               <View style={styles.footer}>
                  <View style={styles.footerLeft}>
                     <View
                        style={[
                           styles.footerLeftLeft,
                           {
                              backgroundColor: currentTheme.btn_bg_300,
                           }
                        ]}
                     >
                        <ButtonUi
                           backgroundColor={currentTheme.btn_bg_300}
                           bRad={5}
                           height="auto"
                           fitContent
                           paddingVertical={3}
                           paddingLeft={10}
                           gap={5}
                           onPress={onLikePress}
                           disabled={comment.is_temp}
                        >
                           {comment.user_liked ? (
                              <LikeIcon
                                 size={15}
                                 color={currentTheme.primary_100}
                              />
                           ) : (
                              <LikeIcon size={13} />
                           )}
                           <MainText px={13}>{formatNumber(comment.likes_count || 0)}</MainText>
                        </ButtonUi>

                        <Separator height={12} />

                        <ButtonUi
                           backgroundColor={currentTheme.btn_bg_300}
                           bRad={5}
                           height="auto"
                           fitContent
                           paddingVertical={3}
                           paddingRight={10}
                           gap={5}
                           onPress={onDislikePress}
                           disabled={comment.is_temp}
                        >
                           {comment.user_disliked ? (
                              <ComDislike
                                 size={13}
                                 color={currentTheme.primary_100}
                              />
                           ) : (
                              <ComDislike size={13} />
                           )}
                           <MainText px={13}>{formatNumber(comment.dislikes_count || 0)}</MainText>
                        </ButtonUi>
                     </View>

                     <View style={styles.footerLeftRight}>
                        <ButtonUi
                           backgroundColor={currentTheme.btn_bg_300}
                           bRad={5}
                           height="auto"
                           fitContent
                           paddingVertical={3}
                           paddingRight={10}
                           paddingLeft={10}
                           gap={5}
                           onPress={onRepliesPress}
                           disabled={comment.is_temp}
                        >
                           <CommentIcon size={13} />
                           <MainText px={13}>{formatNumber(comment.replies_count || 0)}</MainText>
                        </ButtonUi>
                     </View>
                  </View>

                  <View style={styles.footerRight}>
                     <LiveTimeAgo fontSize={10} date={comment.created_at} />
                  </View>
               </View>
            </View>
         </View>
      </SimpleButtonUi>
   );
});

const styles = StyleSheet.create({
   footerLeftLeft: {
      flexDirection: 'row',
      gap: 10,
      borderRadius: 5,
      alignItems: 'center',
   },
   moreBtn: {
      position: "absolute",
      right: -10,
      padding: 10,
      alignItems: "center",
      justifyContent: "center",
   },
   commentHeaderRightTopRight: {},
   commentHeaderRightTopLeft: {},
   commentHeaderRightTop: {
      width: "100%"
   },
   commentHeaderLeft: {
   },
   commentHeaderRight: {
      flexDirection: 'column',
      gap: 4,
      flex: 1,
   },
   commentLeft: {
      flexDirection: 'row',
      gap: 7,
   },
   commentRight: {
   },
   commentContent: {
   },
   commentFooter: {
   },
   comment: {
      flexDirection: 'column',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 10,
   },
   footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 2,
   },
   footerLeft: {
      flexDirection: 'row',
      gap: 5,
   },
   footerLeftRight: {
   },
   footerRight: {
   },
});

export type CommentModesT = "default" | "reply" | "comments";

interface CommentProps {
   comment: GetCommentsResponse;
   mode?: CommentModesT;
   type?: CommentModesT;
   isFirst?: boolean;
}

export const Comment = React.memo(CommentComponent, (prevProps, nextProps) => {
   return (
      prevProps.comment.id === nextProps.comment.id &&
      prevProps.comment.user_liked === nextProps.comment.user_liked &&
      prevProps.comment.user_disliked === nextProps.comment.user_disliked &&
      prevProps.comment.likes_count === nextProps.comment.likes_count &&
      prevProps.comment.dislikes_count === nextProps.comment.dislikes_count &&
      prevProps.comment.replies_count === nextProps.comment.replies_count &&
      prevProps.mode === nextProps.mode &&
      prevProps.type === nextProps.type &&
      prevProps.isFirst === nextProps.isFirst
   );
});