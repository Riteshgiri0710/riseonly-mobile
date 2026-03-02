import { chatSizes } from '@core/config/sizes';
import { CloseIcon } from '@icons/Ui/CloseIcon';
import { ChatTypeEnum, chatsInteractionsStore } from '@modules/chat/stores/chats';
import { messageInteractionsStore } from '@modules/chat/stores/message';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Animated,
	StyleProp,
	StyleSheet,
	TextStyle,
	TouchableOpacity,
	View,
	ViewStyle
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { themeStore } from 'src/modules/theme/stores';
import { Box } from '../BoxUi/Box';
import { LexicalRichTextInputRef } from '../LexicalRichTextInput/LexicalRichTextInput';
import { MainText } from '../MainText/MainText';
import { SimpleButtonUi } from '../SimpleButtonUi/SimpleButtonUi';
import { SimpleTextAreaUi } from '../SimpleTextAreaUi/SimpleTextAreaUi';
import { UserLogo } from '../UserLogo/UserLogo';
import { CleverImage } from '../CleverImage/CleverImage';
import { formatDiffData } from '@lib/text';
import { ChatTitle } from '@modules/chat/components/Chat/Bar';
import { changeRgbA, darkenRGBA } from '@lib/theme';
import { EmojiIcon } from '@icons/MainPage/Posts/EmojiIcon';
import { StickerIcon } from '@icons/Ui/StickerIcon';
import { PressableUi } from '../PressableUi/PressableUi';

interface CreateStylesParams {
	btnBg300: string;
	textColor: string;
	borderColor: string;
	minHeight: number;
}

interface TextEditorUiProps {
	spellCheck?: boolean;
	autoCorrect?: boolean;
	placeholder?: string;
	maxLength?: number;
	onChangeText?: (text: string) => void;
	value?: string;
	considerKeyboard?: boolean;
	minHeight?: number;
	maxHeight?: number;
	inputContainerStyle?: ViewStyle;
	inputStyle?: StyleProp<TextStyle> | StyleProp<ViewStyle>;
	rawText?: string;
	setRawText?: (text: string) => void;
	text?: string;
	setText?: (text: string) => void;
	focus?: boolean;
	onFocus?: (focus: boolean) => void;
	setFocus?: (focus: boolean) => void;
	disabled?: boolean;
	onToggleStickerPanel?: () => void;
}

const COLORS = [
	'#FF5252', // красный
	'#FF4081', // розовый
	'#E040FB', // пурпурный
	'#7C4DFF', // фиолетовый
	'#536DFE', // индиго
	'#448AFF', // синий
	'#40C4FF', // голубой
	'#18FFFF', // бирюзовый
	'#64FFDA', // зеленый (бирюзовый)
	'#69F0AE', // зеленый
	'#B2FF59', // светло-зеленый
	'#EEFF41', // лайм
	'#FFFF00', // желтый
	'#FFD740', // янтарный
	'#FFAB40', // оранжевый
	'#FF6E40', // глубокий оранжевый
];

export const TextEditorUi = observer(({
	placeholder = 'Введите текст...',
	maxLength = 5000,
	onChangeText,
	value,
	setText,
	considerKeyboard = true,
	spellCheck = false,
	autoCorrect = false,
	rawText = '',
	setRawText,
	text = "",
	minHeight = 45,
	onFocus,
	focus,
	inputContainerStyle = {},
	inputStyle = {},
	setFocus,
	maxHeight = 200,
	disabled = false,
	onToggleStickerPanel,
}: TextEditorUiProps) => {
	const { currentTheme } = themeStore;
	const { selectedChat } = chatsInteractionsStore;
	const { replyMessageHandler, editMessageHandler } = messageInteractionsStore;

	const { t } = useTranslation();

	const [showFormatBar, setShowFormatBar] = useState(false);
	const [showColorPalette, setShowColorPalette] = useState(false);
	const inputRef = useRef<LexicalRichTextInputRef>(null);
	const keyboardDidShowListener = useRef<any>(null);
	const keyboardDidHideListener = useRef<any>(null);
	const [isFocused, setIsFocused] = useState(false);

	const fadeAnim = useRef(new Animated.Value(0)).current;
	const translateYAnim = useRef(new Animated.Value(10)).current;

	const paletteAnim = useRef(new Animated.Value(0)).current;
	const paletteTranslateYAnim = useRef(new Animated.Value(10)).current;

	useEffect(() => {
		const input = inputRef.current;
		if (!input) return;
		isFocused ? input.blur() : input.focus();
	}, [focus]);

	const handleChangeText = (text: string) => {
		if (onChangeText) onChangeText(text);
	};

	const handleFormatButtonPress = () => {
		if (showFormatBar) {
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 0,
					duration: 150,
					useNativeDriver: true
				}),
				Animated.timing(translateYAnim, {
					toValue: 10,
					duration: 150,
					useNativeDriver: true
				})
			]).start(() => {
				setShowFormatBar(false);
				setShowColorPalette(false);
			});
		} else {
			setShowFormatBar(true);
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 200,
					useNativeDriver: true
				}),
				Animated.timing(translateYAnim, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true
				})
			]).start();
		}
	};

	const handleBoldPress = () => {
		handleFormatButtonPress();
		inputRef.current?.setBold();
	};

	const handleItalicPress = () => {
		handleFormatButtonPress();
		inputRef.current?.setItalic();
	};

	const handleUnderlinePress = () => {
		handleFormatButtonPress();
		inputRef.current?.setUnderline();
	};

	const handleColorPress = () => {
		if (showColorPalette) {
			Animated.parallel([
				Animated.timing(paletteAnim, {
					toValue: 0,
					duration: 150,
					useNativeDriver: true
				}),
				Animated.timing(paletteTranslateYAnim, {
					toValue: 10,
					duration: 150,
					useNativeDriver: true
				})
			]).start(() => {
				setShowColorPalette(false);
			});
		} else {
			setShowColorPalette(true);
			Animated.parallel([
				Animated.timing(paletteAnim, {
					toValue: 1,
					duration: 200,
					useNativeDriver: true
				}),
				Animated.timing(paletteTranslateYAnim, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true
				})
			]).start();
		}
	};

	const handleColorSelect = (color: string) => {
		inputRef.current?.setTextColor(color);

		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 0,
				duration: 150,
				useNativeDriver: true
			}),
			Animated.timing(translateYAnim, {
				toValue: 10,
				duration: 150,
				useNativeDriver: true
			})
		]).start(() => {
			setShowFormatBar(false);
			setShowColorPalette(false);
		});
	};

	const handleCodePress = () => {
		if (inputRef.current) inputRef.current.insertCode('python');

		handleFormatButtonPress();
	};

	const renderFormatBar = () => {
		return (
			<View style={styles.formatBar}>
				<TouchableOpacity onPress={handleBoldPress} style={styles.formatButton}>
					<MaterialIcons name="format-bold" size={24} color={currentTheme.text_100} />
				</TouchableOpacity>
				<TouchableOpacity onPress={handleItalicPress} style={styles.formatButton}>
					<MaterialIcons name="format-italic" size={24} color={currentTheme.text_100} />
				</TouchableOpacity>
				<TouchableOpacity onPress={handleUnderlinePress} style={styles.formatButton}>
					<MaterialIcons name="format-underlined" size={24} color={currentTheme.text_100} />
				</TouchableOpacity>
				<TouchableOpacity onPress={handleColorPress} style={styles.formatButton}>
					<MaterialIcons name="palette" size={24} color={currentTheme.text_100} />
				</TouchableOpacity>
				<TouchableOpacity onPress={handleCodePress} style={styles.formatButton}>
					<MaterialIcons name="code" size={24} color={currentTheme.text_100} />
				</TouchableOpacity>
			</View>
		);
	};

	const renderColorPalette = () => {
		const rows = [];
		for (let i = 0; i < COLORS.length; i += 4) {
			rows.push(COLORS.slice(i, i + 4));
		}

		return (
			<Animated.View
				style={[
					styles.colorPaletteContainer,
					{
						opacity: paletteAnim,
						transform: [{ translateY: paletteTranslateYAnim }],
					}
				]}
			>
				{rows.map((row, rowIndex) => (
					<View key={`row-${rowIndex}`} style={styles.colorPaletteRow}>
						{row.map((color) => (
							<TouchableOpacity
								key={color}
								style={[styles.colorButton, { backgroundColor: color }]}
								onPress={() => handleColorSelect(color)}
							/>
						))}
					</View>
				))}
			</Animated.View>
		);
	};

	const styles = useMemo(() => createStyles({
		btnBg300: currentTheme.btn_bg_300,
		textColor: currentTheme.text_100,
		borderColor: currentTheme.border_100,
		minHeight,
	}), [currentTheme.btn_bg_300, currentTheme.text_100, currentTheme.border_100, minHeight]);

	return (
		<View
			style={styles.container}
		>
			<Box
				style={[
					styles.inputContainer,
					inputContainerStyle
				]}
				width={"100%"}
			>
				{selectedChat?.selectedMessageToReply && (
					<Box
						style={styles.replyContainer}
						width={"100%"}
					>
						<SimpleButtonUi
							style={[
								styles.replyWrapper,
								{ borderLeftWidth: 2, borderColor: currentTheme.primary_100, }
							]}
							bRad={3}
						>
							<Box
								flex={1}
							>
								<Box
									fD='row'
									gap={5}
								>
									{selectedChat?.selectedMessageToReply?.media_items && selectedChat?.selectedMessageToReply?.media_items?.length > 0 && (
										<Box
											bRad={5}
											overflow="hidden"
										>
											<CleverImage
												source={selectedChat?.selectedMessageToReply?.media_items[0].file_url}
												style={{ width: 35, height: 35 }}
												resizeMode='cover'
												blur
											/>
										</Box>
									)}

									<Box>
										<Box>
											{selectedChat?.type === ChatTypeEnum.CHANNEL ? (
												<ChatTitle
													title={t("reply_to", {
														name: selectedChat?.title
													})}
													chat={selectedChat}
													fontWeight="normal"
													iconSize={14}
													color={currentTheme.primary_100}
													iconColor={currentTheme.primary_100}
												/>
											) : (
												<MainText
													primary
													numberOfLines={1}
												>
													{t("reply_to", {
														name: selectedChat?.selectedMessageToReply?.sender?.name
													})}
												</MainText>
											)}
										</Box>

										<Box>
											<MainText
												numberOfLines={1}
											>
												{selectedChat?.selectedMessageToReply?.content}
											</MainText>
										</Box>
									</Box>
								</Box>
							</Box>

							<Box>
								<SimpleButtonUi
									style={{ paddingVertical: 10, paddingHorizontal: 3 }}
									onPress={() => replyMessageHandler()}
								>
									<CloseIcon
										size={20}
										color={currentTheme.secondary_100}
									/>
								</SimpleButtonUi>
							</Box>
						</SimpleButtonUi>
					</Box>
				)}

				{selectedChat?.selectedMessageToEdit && (
					<Box
						style={styles.replyContainer}
						width={"100%"}
					>
						<SimpleButtonUi
							style={[
								styles.replyWrapper,
								{ borderLeftWidth: 2, borderColor: currentTheme.primary_100 }
							]}
							bRad={3}
						>
							<Box flex={1}>
								<Box fD='row' gap={5}>
									<Box>
										<MainText primary numberOfLines={1}>
											{t("contextMenu_edit")}
										</MainText>
										<Box>
											<MainText numberOfLines={1}>
												{selectedChat.selectedMessageToEdit.content}
											</MainText>
										</Box>
									</Box>
								</Box>
							</Box>
							<Box>
								<SimpleButtonUi
									style={{ paddingVertical: 10, paddingHorizontal: 3 }}
									onPress={() => editMessageHandler(null)}
								>
									<CloseIcon
										size={20}
										color={currentTheme.secondary_100}
									/>
								</SimpleButtonUi>
							</Box>
						</SimpleButtonUi>
					</Box>
				)}

				<Box
					fD='row'
					align='flex-end'
					gap={5}
					width={"100%"}
					style={{ paddingHorizontal: 3, paddingBottom: 3, paddingRight: 10 }}
				>
					{selectedChat?.type !== "CHANNEL" && (
						<Box
							centered
						>
							<Box>
								<UserLogo
									size={chatSizes.logo}
								/>
							</Box>
						</Box>
					)}

					<Box flex={1}>
						<SimpleTextAreaUi
							style={[
								styles.input,
								inputStyle,
							]}
							spellCheck={spellCheck}
							autoCorrect={autoCorrect}
							groupContainerStyle={{ width: "100%" }}
							inputStyle={{ paddingTop: 13, width: "100%" }}
							placeholder={placeholder}
							placeholderTextColor={currentTheme.secondary_100}
							onChangeText={handleChangeText}
							value={value}
							setText={setText}
							maxLength={maxLength}
							maxHeight={maxHeight}
							disabled={disabled}
							useValue
						/>
					</Box>

					<Box>
						<SimpleButtonUi
							style={{ height: 35, paddingHorizontal: 3, alignItems: "center", justifyContent: "center" }}
							onPress={onToggleStickerPanel}
						>
							<StickerIcon size={22.5} />
						</SimpleButtonUi>
					</Box>
				</Box>
			</Box>

		</View>
	);
});

const createStyles = ({ btnBg300, textColor, borderColor, minHeight }: CreateStylesParams) => StyleSheet.create({
	container: { width: "100%" },
	replyWrapper: {
		paddingLeft: 7.5,
		flexDirection: "row",
		width: "100%",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 10,
	},
	replyContainer: {
		paddingHorizontal: 13,
		paddingTop: 10
	},
	inputContainer: {
		position: 'relative',
		borderRadius: 15,
		backgroundColor: btnBg300,
		overflow: 'hidden',
		width: '100%',
		minHeight: minHeight,
	},
	input: {
		color: textColor,
		fontSize: 14,
		fontWeight: 'bold',
	},
	formatBar: {
		flexDirection: 'row',
		backgroundColor: btnBg300,
		borderWidth: 0.5,
		borderColor: borderColor,
		borderRadius: 10,
		padding: 0,
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	formatButton: {
		paddingVertical: 5,
		paddingHorizontal: 5,
	},
	formatToggleButton: {
		paddingRight: 10,
		paddingTop: 10,
	},
	menuContainer: {
		position: 'absolute',
		top: -45,
		right: 0,
		zIndex: 1000,
	},
	colorPaletteContainer: {
		position: 'absolute',
		top: -145,
		right: 0,
		zIndex: 1000,
		marginTop: 8,
		backgroundColor: btnBg300,
		borderRadius: 15,
		padding: 8,
		borderWidth: 0.5,
		borderColor: borderColor,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	colorPaletteRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginBottom: 4,
	},
	colorButton: {
		width: 24,
		height: 24,
		borderRadius: 12,
		marginHorizontal: 2,
		borderWidth: 1,
		borderColor: textColor,
	}
});

