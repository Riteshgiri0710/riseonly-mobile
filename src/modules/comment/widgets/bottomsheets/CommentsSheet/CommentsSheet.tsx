import { BottomSheetUi } from '@core/ui';
import { formatCommentCount } from '@lib/numbers';
import { observer } from 'mobx-react-lite';
import { JSX, useEffect, useState } from 'react';
import { CommentInput, CommentReplies, Comments } from 'src/modules/comment/components';
import { getCommentListContextMenuItems, getRepliesListContextMenuItems } from 'src/modules/comment/shared/config/context-menu-data';
import { commentInteractionsStore } from 'src/modules/comment/stores';
import { DeleteCommentModal } from 'src/modules/comment/widgets/modals';
import { postInteractionsStore } from 'src/modules/post/stores';

export const CommentsSheet = observer(() => {
   const { selectedPost } = postInteractionsStore;
   const {
      commentListContextMenu: { commentListContextMenu, setCommentListContextMenu },
      repliesOpen: { repliesOpen },
      selectedCommentForReply: { selectedCommentForReply },
      commentsBottomSheetCloseSignal: { commentsBottomSheetCloseSignal, setCommentsBottomSheetCloseSignal },
      isCommentOpen,
      setIsCommentOpen
   } = commentInteractionsStore;

   const [commentInputComponent, setCommentInputComponent] = useState<JSX.Element | null>(null);
   const commentsSortItems = getCommentListContextMenuItems();
   const repliesSortItems = getRepliesListContextMenuItems();

   useEffect(() => {
      setCommentInputComponent(<CommentInput />);
   }, []);

   return (
      <>
         {isCommentOpen && (
            <BottomSheetUi
               isBottomSheet={isCommentOpen}
               setIsBottomSheet={setIsCommentOpen}
               title={formatCommentCount(
                  repliesOpen ? selectedCommentForReply!.replies_count : (selectedPost?.comments_count || 0),
                  repliesOpen ? "replies" : "comments"
               ) || ''}
               footer={commentInputComponent}
               menuItems={repliesOpen ? repliesSortItems : commentsSortItems}
               contextMenuVisible={commentListContextMenu}
               setContextMenuVisible={setCommentListContextMenu}
               bottomSheetViewStyle={{ paddingBottom: 100 }}
               leftBtn={repliesOpen}
               leftBtnPress={() => { }}
               onCloseSignal={commentsBottomSheetCloseSignal}
               setOnCloseSignal={setCommentsBottomSheetCloseSignal}
               disabled={!selectedPost?.can_comment}
            >
               <Comments />
               {repliesOpen && (
                  <CommentReplies />
               )}
            </BottomSheetUi>
         )}

         <DeleteCommentModal />
      </>
   );
});