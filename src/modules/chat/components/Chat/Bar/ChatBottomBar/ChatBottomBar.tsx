import { todoNotify } from '@core/config/const';
import { chatSizes } from '@core/config/sizes';
import { Box, MainText, SimpleButtonUi, TextEditorUi } from '@core/ui';
import { MicIcon } from '@icons/MainPage/Chats/MicIcon';
import { SendMessageIcon } from '@icons/MainPage/Posts/SendMessageIcon';
import { FileIcon } from '@icons/Ui/FileIcon';
import { chatsInteractionsStore } from '@modules/chat/stores/chats';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { t } from 'i18next';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
	Easing,
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { messageInteractionsStore, messageActionsStore } from 'src/modules/chat/stores/message';
import { stickerInteractionsStore } from 'src/modules/sticker/stores/sticker/sticker-interactions/sticker-interactions';
import { themeStore } from 'src/modules/theme/stores';
import { changeRgbA } from '@lib/theme';
import { getCurrentRoute } from '@lib/navigation';
import { ScrollActionButton } from '../../ScrollCircleActions';
import { ChatStickerWidget, STICKER_PANEL_HEIGHT } from '@modules/chat/widgets';
import type { StickerInList } from '@modules/chat/widgets/ChatStickerWidget/types';
import { isLottieSticker, getStickerDisplayUrl } from '@modules/chat/widgets/ChatStickerWidget/utils';
import type { CreateMessageBody } from '@modules/chat/stores/message/message-actions/types';

export { STICKER_PANEL_HEIGHT };

interface ChatBottomBarProps {
	onChange?: (text: string) => void;
	bottomHeight: number;
	scrollProgressForUI: number;
	onScrollToReaction?: () => void;
	onScrollToMention?: () => void;
	reactionCount?: number;
	mentionCount?: number;
	stickerPanelProgress?: SharedValue<number>;
	onSendSticker?: (sticker?: StickerInList) => void;
}

export const ChatBottomBar = observer(({
	onChange,
	bottomHeight,
	scrollProgressForUI,
	onScrollToReaction,
	onScrollToMention,
	reactionCount = 0,
	mentionCount = 0,
	stickerPanelProgress: stickerPanelProgressProp,
	onSendSticker: onSendStickerProp,
}: ChatBottomBarProps) => {
	const { currentTheme } = themeStore;
	const {
		chatMediaOpen: { setChatMediaOpen },
		selectedChat
	} = chatsInteractionsStore;
	const {
		msgIsFocused: { msgIsFocused },
		msgText: { msgText, setMsgText },
		isSendingMessage: { isSendingMessage },
		isSelectingMessages: { isSelectingMessages, setIsSelectingMessages },
		exitSelectionMode,
		selectedMessages: { selectedMessages },
		deleteMessagesSheet: { setDeleteMessagesSheet },
		onSendMsgHandler,
		replyMessageHandler,
	} = messageInteractionsStore;

	const insets = useSafeAreaInsets();
	const [keyboardVisible, setKeyboardVisible] = useState(false);
	const [isStickerPanelMounted, setIsStickerPanelMounted] = useState(false);
	const [bottomText, setBottomText] = useState("");
	const wasEditingRef = useRef(false);
	const prevEditIdRef = useRef<string | null>(null);
	const stickerPanelProgressInternal = useSharedValue(0);
	const stickerPanelProgress = stickerPanelProgressProp ?? stickerPanelProgressInternal;

	useEffect(() => {
		const editId = selectedChat?.selectedMessageToEdit?.id ?? null;
		const editing = !!selectedChat?.selectedMessageToEdit;
		if (editing) {
			wasEditingRef.current = true;
			if (prevEditIdRef.current !== editId) {
				prevEditIdRef.current = editId;
				setBottomText(selectedChat?.selectedMessageToEdit?.content ?? "");
			}
		} else {
			if (wasEditingRef.current) {
				wasEditingRef.current = false;
				prevEditIdRef.current = null;
				setBottomText(msgText ?? "");
			}
		}
	}, [selectedChat?.selectedMessageToEdit, selectedChat?.selectedMessageToEdit?.id, selectedChat?.selectedMessageToEdit?.content, msgText]);

	useEffect(() => {
		if (!selectedChat?.selectedMessageToEdit && (!msgText || msgText.trim().length === 0)) {
			if (bottomText && bottomText.trim().length > 0) {
				setBottomText("");
			}
		}
	}, [msgText, bottomText, selectedChat?.selectedMessageToEdit]);

	useEffect(() => {
		const keyboardDidShowListener = Keyboard.addListener(
			'keyboardDidShow',
			() => {
				setKeyboardVisible(true);
			}
		);
		const keyboardDidHideListener = Keyboard.addListener(
			'keyboardDidHide',
			() => {
				setKeyboardVisible(false);
			}
		);

		return () => {
			keyboardDidShowListener.remove();
			keyboardDidHideListener.remove();
		};
	}, []);

	const onFilePress = () => setChatMediaOpen(true);
	const onMicPress = () => { };
	const onEmojiPress = () => todoNotify();
	const onPressSend = () => {
		if (isSendingMessage) return;
		setBottomText("");
		onSendMsgHandler();
	};
	const onChangeText = (text: string) => {
		setBottomText(text);
		setMsgText(text);
		onChange?.(text);
	};

	const toggleStickerPanel = () => {
		const isOpening = stickerPanelProgress.value === 0;

		if (isOpening) {
			setIsStickerPanelMounted(true);
		}

		stickerPanelProgress.value = withTiming(isOpening ? 1 : 0, {
			duration: 260,
			easing: Easing.out(Easing.cubic),
		}, (finished) => {
			if (finished && !isOpening) {
				runOnJS(setIsStickerPanelMounted)(false);
			}
		});
	};

	const handleScrollToBottom = useCallback(() => {
		const ref = messageInteractionsStore.messagesScrollRef.messagesScrollRef?.current as any;
		if (ref?.scrollToOffset) ref.scrollToOffset({ offset: 0, animated: true });
	}, []);

	const handleScrollToMention = useCallback(() => {
		onScrollToMention?.();
	}, [onScrollToMention]);

	const handleScrollToReaction = useCallback(() => {
		onScrollToReaction?.();
	}, [onScrollToReaction]);

	const handleSendSticker = useCallback((sticker?: StickerInList) => {
		const s = sticker ?? stickerInteractionsStore.selectedSticker.selectedSticker;
		if (!s) return;

		const params = getCurrentRoute()?.params as { chatId?: string; userChatId?: string; previewUser?: { user_chat_id?: string; }; } | undefined;
		const bodyChatId = selectedChat?.id ?? params?.previewUser?.user_chat_id ?? params?.chatId ?? params?.userChatId;
		if (!bodyChatId) return;

		const fileUrl = getStickerDisplayUrl(s)
			|| s.file_url
			|| (s as any).fileUrl
			|| (s as any).url
			|| '';
		if (!fileUrl) return;

		const stickerType = (s as any).sticker_type
			?? (isLottieSticker(fileUrl) ? 'lottie' as const : 'static');

		const body: CreateMessageBody = {
			content: '',
			original_content: '',
			reply_to_id: selectedChat?.selectedMessageToReply?.id ?? null,
			forward_from_message_id: null,
			forward_from_chat_id: null,
			media_group_id: null,
			entities: null,
			caption: null,
			content_type: 'sticker',
			media_items: [{
				media_type: 'sticker',
				file_url: fileUrl,
				width: s.width ?? 0,
				height: s.height ?? 0,
				sticker_id: s.id,
				pack_id: s.pack_id,
				sticker_type: stickerType,
				associated_emojis: s.associated_emojis ?? [],
				variants: [],
			}],
		};

		if (selectedChat?.type === 'PRIVATE' && selectedChat.participant?.user_chat_id && selectedChat.id === selectedChat.participant.user_chat_id) {
			body.user_chat_id = bodyChatId;
		} else {
			body.chat_id = bodyChatId;
		}

		messageActionsStore.createMessageAction(body);
		replyMessageHandler();
	}, [selectedChat, replyMessageHandler]);

	const handleDeleteSelected = useCallback(() => {
		const ids = Array.from(selectedMessages);
		if (!ids.length) return;
		setDeleteMessagesSheet({ isOpen: true, messageIds: ids });
	}, [selectedMessages, setDeleteMessagesSheet]);

	const blurActionWrapperStyle = {
		borderRadius: 1000,
		overflow: "hidden" as const,
		paddingHorizontal: 10,
		paddingVertical: 5,
		backgroundColor: changeRgbA(currentTheme.bg_100, 0.8),
		borderWidth: 0.7,
		borderColor: currentTheme.border_100,
		width: "100%" as const,
		height: "100%" as const,
		alignItems: "center" as const,
		justifyContent: "center" as const,
	};

	const baseMarginBottom = msgIsFocused ? 5 : insets.bottom;
	const gapWhenPanelOpen = 10;

	const animatedContainerStyle = useAnimatedStyle(() => {
		const progress = stickerPanelProgress.value;
		const base = baseMarginBottom * (1 - progress) + gapWhenPanelOpen * progress;
		return {
			marginBottom: base + progress * STICKER_PANEL_HEIGHT,
		};
	}, [baseMarginBottom]);

	const containerStyle: any = {
		paddingHorizontal: 10,
		zIndex: 1000,
		width: "100%",
		paddingTop: 5,
		position: 'absolute',
		bottom: 0,
		overflow: 'visible',
		alignSelf: 'stretch',
	};

	const stickerPanelAnimatedStyle = useAnimatedStyle(() => {
		return {
			opacity: stickerPanelProgress.value,
			transform: [{ translateY: (1 - stickerPanelProgress.value) * STICKER_PANEL_HEIGHT }],
		};
	});

	const gradientAnimatedStyle = useAnimatedStyle(() => {
		const progress = stickerPanelProgress.value;
		return {
			position: 'absolute' as const,
			bottom: -insets.bottom,
			left: -10,
			right: -10,
			height: 100 * (1 - progress),
			zIndex: 0,
			pointerEvents: 'none' as const,
			overflow: 'hidden' as const,
		};
	}, [insets.bottom]);

	return (
		<>
			<Animated.View style={[containerStyle, animatedContainerStyle]}>
				<Animated.View style={gradientAnimatedStyle}>
					<LinearGradient
						colors={[
							'rgba(0, 0, 0, 0.9)',
							'rgba(0, 0, 0, 0.7)',
							'rgba(0, 0, 0, 0.5)',
							'rgba(0, 0, 0, 0.4)',
							'rgba(0, 0, 0, 0.0)',
							'rgba(0, 0, 0, 0)'
						]}
						locations={[0, 0.15, 0.35, 0.6, 0.85, 1]}
						start={{ x: 0, y: 1 }}
						end={{ x: 0, y: 0 }}
						style={{ flex: 1 }}
					/>
				</Animated.View>

				<ScrollActionButton
					scrollToBottomVisible={scrollProgressForUI < 95}
					scrollToMentionVisible={mentionCount > 0}
					scrollToReactionVisible={reactionCount > 0}
					onScrollToBottom={handleScrollToBottom}
					onScrollToMention={handleScrollToMention}
					onScrollToReaction={handleScrollToReaction}
					bottomOffset={50}
					unreadCount={selectedChat?.unread_count || 0}
					mentionCount={mentionCount}
					reactionCount={reactionCount}
				/>

				{isSelectingMessages ? (
					<Box
						fD='row'
						width={"100%"}
						align='center'
						justify='flex-end'
						style={{ zIndex: 2 }}
						gap={10}
					>
						<SimpleButtonUi
							onPress={todoNotify}
							centered
							width={chatSizes.btn}
							height={chatSizes.btn}
						>
							<BlurView
								intensity={25}
								style={blurActionWrapperStyle}
							>
								<MaterialIcons
									name="ios-share"
									size={20}
									color={currentTheme.text_100}
								/>
							</BlurView>
						</SimpleButtonUi>

						<SimpleButtonUi
							onPress={todoNotify}
							centered
							width={chatSizes.btn}
							height={chatSizes.btn}
						>
							<BlurView
								intensity={25}
								style={blurActionWrapperStyle}
							>
								<MaterialIcons
									name="forward"
									size={20}
									color={currentTheme.text_100}
								/>
							</BlurView>
						</SimpleButtonUi>

						<SimpleButtonUi
							onPress={handleDeleteSelected}
							centered
							width={chatSizes.btn}
							height={chatSizes.btn}
						>
							<BlurView
								intensity={25}
								style={blurActionWrapperStyle}
							>
								<MaterialIcons
									name="delete"
									size={20}
									color="red"
								/>
							</BlurView>
						</SimpleButtonUi>

						<SimpleButtonUi
							onPress={exitSelectionMode}
							style={{
								height: chatSizes.btn,
								paddingHorizontal: 16,
								borderRadius: 1000,
								borderColor: currentTheme.border_100,
								borderWidth: 1,
							}}
							bgColor={currentTheme.btn_bg_200}
							centered
						>
							<MainText color={currentTheme.primary_100}>
								{t("cancel")}
							</MainText>
						</SimpleButtonUi>
					</Box>
				) : (
					<Box
						fD='row'
						width={"100%"}
						align='flex-end'
						gap={3}
						style={{ zIndex: 2 }}
					>
						<Box>
							<SimpleButtonUi
								onPress={onFilePress}
								style={{
									width: chatSizes.btn,
									height: chatSizes.btn,
									borderRadius: 1000,
									borderColor: currentTheme.border_100,
									borderWidth: 1,
								}}
								bgColor={currentTheme.btn_bg_200}
								centered
							>
								<FileIcon
									color={currentTheme.text_100}
									size={20}
								/>
							</SimpleButtonUi>
						</Box>

						<Input
							bottomText={bottomText}
							onChangeText={onChangeText}
							onToggleStickerPanel={toggleStickerPanel}
						/>

						<SendMicButton
							hasText={
								!isSendingMessage &&
								((!!bottomText && bottomText.trim().length > 0) ||
									(!!msgText && msgText.trim().length > 0))
							}
							onSend={onPressSend}
							onMicPress={onMicPress}
							isSending={isSendingMessage}
						/>
					</Box>
				)}
			</Animated.View>

			<ChatStickerWidget
				animatedStyle={stickerPanelAnimatedStyle}
				open={isStickerPanelMounted}
				onSendSticker={onSendStickerProp ?? handleSendSticker}
			/>
		</>
	);
});

const SendMicButton = observer(({
	hasText,
	onSend,
	onMicPress,
	isSending,
}: {
	hasText: boolean;
	onSend: () => void;
	onMicPress: () => void;
	isSending: boolean;
}) => {
	const { currentTheme } = themeStore;
	const buttonProgress = useSharedValue(hasText ? 1 : 0);

	useEffect(() => {
		buttonProgress.value = withTiming(hasText ? 1 : 0, {
			duration: 300,
			easing: Easing.out(Easing.cubic),
		});
	}, [hasText, buttonProgress]);

	const sendButtonStyle = useAnimatedStyle(() => {
		const opacity = interpolate(
			buttonProgress.value,
			[0, 1],
			[0, 1],
		);
		const scale = interpolate(
			buttonProgress.value,
			[0, 1],
			[0.6, 1],
		);
		const translateY = interpolate(
			buttonProgress.value,
			[0, 1],
			[10, 0],
		);

		return {
			opacity,
			transform: [{ scale }, { translateY }],
			position: 'absolute' as const,
		};
	});

	const micButtonStyle = useAnimatedStyle(() => {
		const opacity = interpolate(
			buttonProgress.value,
			[0, 1],
			[1, 0],
		);
		const scale = interpolate(
			buttonProgress.value,
			[0, 1],
			[1, 0.6],
		);
		const translateY = interpolate(
			buttonProgress.value,
			[0, 1],
			[0, -10],
		);

		return {
			opacity,
			transform: [{ scale }, { translateY }],
			position: 'absolute' as const,
		};
	});

	return (
		<Box
			style={{
				width: chatSizes.btn,
				height: chatSizes.btn,
				position: 'relative',
			}}
		>
			{/* Send Button */}
			<Animated.View
				style={sendButtonStyle}
				pointerEvents={hasText && !isSending ? 'auto' : 'none'}
			>
				<SimpleButtonUi
					onPress={onSend}
					style={{
						width: chatSizes.btn,
						height: chatSizes.btn,
						borderRadius: 1000,
						borderColor: currentTheme.border_100,
						borderWidth: 1,
						paddingLeft: 2,
					}}
					bgColor={currentTheme.primary_100}
					centered
					disabled={!hasText || isSending}
				>
					<Box>
						<SendMessageIcon
							color={currentTheme.text_100}
							size={19}
						/>
					</Box>
				</SimpleButtonUi>
			</Animated.View>

			{/* Mic Button */}
			<Animated.View
				style={micButtonStyle}
				pointerEvents={!hasText ? 'auto' : 'none'}
			>
				<SimpleButtonUi
					onPress={onMicPress}
					style={{
						width: chatSizes.btn,
						height: chatSizes.btn,
						borderRadius: 1000,
						borderColor: currentTheme.border_100,
						borderWidth: 1,
					}}
					bgColor={currentTheme.btn_bg_200}
					centered
					disabled={hasText}
				>
					<Box>
						<MicIcon
							color={currentTheme.text_100}
							size={25}
						/>
					</Box>
				</SimpleButtonUi>
			</Animated.View>
		</Box>
	);
});

const Input = observer(({
	bottomText,
	onChangeText,
	onToggleStickerPanel,
}: {
	bottomText: string;
	onChangeText: (text: string) => void;
	onToggleStickerPanel: () => void;
}) => {
	const { currentTheme } = themeStore;
	const {
		msgText: { msgText, setMsgText },
		msgRawText: { msgRawText, setMsgRawText },
		msgInputFocus: { msgInputFocus, setMsgInputFocus },
		msgIsFocused: { setMsgIsFocused },
	} = messageInteractionsStore;

	return (
		<Box
			flex={1}
		>
			<TextEditorUi
				inputContainerStyle={{
					backgroundColor: currentTheme.btn_bg_200,
					borderColor: currentTheme.border_100,
					borderWidth: 1,
					borderRadius: 25,
				}}
				inputStyle={{ fontSize: 15 }}
				maxLength={5000}
				maxHeight={120}
				spellCheck={false}
				autoCorrect={false}
				rawText={msgRawText}
				setRawText={setMsgRawText}
				text={msgText}
				value={bottomText}
				setText={setMsgText}
				onChangeText={onChangeText}
				onToggleStickerPanel={onToggleStickerPanel}
				focus={msgInputFocus}
				setFocus={setMsgInputFocus}
				onFocus={(focus) => setMsgIsFocused(focus)}
				placeholder={t("funny_chat_placeholder")} // TODO: Change it to serious placeholder after BETA
			/>
		</Box>
	);
});