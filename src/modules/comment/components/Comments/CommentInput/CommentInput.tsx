import { Box, TextEditorUi } from '@core/ui';
import { SendMessageIcon } from '@icons/MainPage/Posts/SendMessageIcon';
import { deleteSpacesFromStartAndEnd } from '@lib/text';
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { commentActionsStore, commentInteractionsStore } from 'src/modules/comment/stores';
import { postInteractionsStore } from 'src/modules/post/stores';
import { themeStore } from 'src/modules/theme/stores';

export const CommentInput = observer(() => {
	const { currentTheme } = themeStore;
	const { selectedPost } = postInteractionsStore;
	const { createCommentAction } = commentActionsStore;
	const {
		rawCommentText: { rawCommentText, setRawCommentText },
		commentText: { commentText, setCommentText },
		rawReplyCommentText: { rawReplyCommentText, setRawReplyCommentText },
		replyCommentText: { replyCommentText, setReplyCommentText },
		commentInputFocus: { commentInputFocus, setCommentInputFocus },
		repliesOpen: { repliesOpen }
	} = commentInteractionsStore;

	const hasContent = (text: string) => deleteSpacesFromStartAndEnd(text).length > 0;

	const sendDisabled = selectedPost?.can_comment ? (
		repliesOpen
			? !hasContent(rawReplyCommentText)
			: !hasContent(rawCommentText)
	) : true;

	const { t } = useTranslation();

	const handleChangeText = useCallback((newText: string) => {
		if (repliesOpen) {
			setReplyCommentText(newText);
			setRawReplyCommentText(newText);
			return;
		}
		setCommentText(newText);
		setRawCommentText(newText);
	}, [repliesOpen, setReplyCommentText, setRawReplyCommentText, setCommentText, setRawCommentText]);

	return (
		<View style={styles.container}>
			<View style={styles.editorContainer}>
				<TextEditorUi
					placeholder={t('create_comment_placeholder')}
					value={repliesOpen ? replyCommentText : commentText}
					onChangeText={handleChangeText}
					maxLength={5000}
					maxHeight={120}

					rawText={repliesOpen ? rawReplyCommentText : rawCommentText}
					setRawText={repliesOpen ? setRawReplyCommentText : setRawCommentText}
					text={repliesOpen ? replyCommentText : commentText}
					setText={repliesOpen ? setReplyCommentText : setCommentText}

					focus={commentInputFocus}
					setFocus={setCommentInputFocus}

					disabled={!selectedPost?.can_comment}
				/>
			</View>

			<TouchableOpacity
				style={[
					styles.sendButton,
					{ backgroundColor: currentTheme.btn_bg_300, }
				]}
				onPress={createCommentAction}
				disabled={sendDisabled}
			>
				<Box
					style={{ opacity: sendDisabled ? 0.5 : 1, height: "100%", width: "100%" }}
					centered
				>
					<SendMessageIcon
						size={15}
					/>
				</Box>
			</TouchableOpacity>
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: 3,
		paddingHorizontal: 6,
		paddingVertical: 5
	},
	editorContainer: {
		flex: 1,
	},
	sendButton: {
		width: 33,
		height: 33,
		borderRadius: 100,
		marginBottom: 3,
		justifyContent: 'center',
		alignItems: 'center',
	}
});