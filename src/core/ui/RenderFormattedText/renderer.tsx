import { INVITE_LINK_PATTERN, STICKER_LINK_PATTERN, showNotify } from '@core/config/const';
import { stickerInteractionsStore } from '@modules/sticker/stores';
import { ContextMenuUi, type ContextMenuItem } from '@core/ui/ContextMenuUi/ContextMenuUi';
import { CopyMsgIcon } from '@icons/MainPage/Chats/CopyMsgIcon';
import { chatsInteractionsStore } from '@modules/chat/stores/chats';
import Clipboard from '@react-native-clipboard/clipboard';
import i18n from 'i18n';
import { TFunction } from 'i18next';
import React, { useCallback, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextStyle, View } from 'react-native';
import { styles } from './styles';
import { highlightCode } from './syntaxHighlighter';
import { Colors, TextSegment } from './types';

const LOG_LINK = __DEV__;

function logLink(message: string, data?: object) {
	if (LOG_LINK && typeof __DEV__ !== 'undefined' && __DEV__) {
		// eslint-disable-next-line no-console
		console.log(`[RenderFormattedText:link] ${message}`, data ?? '');
	}
}

const insertBreakOpportunities = (str: string, interval = 30): string => {
	if (str.length <= interval) return str;
	let result = '';
	for (let i = 0; i < str.length; i += interval) {
		result += str.slice(i, i + interval) + (i + interval < str.length ? '\u200B' : '');
	}
	return result;
};

interface RendererProps {
	segments: TextSegment[];
	colors: Colors;
	textStyle?: TextStyle;
	numberOfLines?: number;
	formatOnlyTags?: boolean;
	onLinkPress?: (url: string) => void;
	onTagPress?: (tag: string) => void;
	onInviteLinkPress?: (url: string) => void;
	onStickerLinkPress?: (url: string) => void;
	t?: TFunction;
}

const LinkWithHoldMenu = ({ url, content, baseStyle, colors, onLinkPress, onInviteLinkPress, onStickerLinkPress, t }: {
	url: string;
	content: string;
	baseStyle: TextStyle;
	colors: Colors;
	onLinkPress?: (url: string) => void;
	onInviteLinkPress?: (url: string) => void;
	onStickerLinkPress?: (url: string) => void;
	t: (key: string) => string;
}) => {
	const { onInviteLinkPressHandler } = chatsInteractionsStore;
	const [contextMenuVisible, setContextMenuVisible] = useState(false);
	const anchorRef = useRef<View>(null);

	const handleLinkPress = useCallback(() => {
		logLink('handleLinkPress called', { url: url.slice(0, 50) });
		if (!url) return;

		if (url.startsWith(INVITE_LINK_PATTERN)) {
			logLink('invite link');
			if (onInviteLinkPress) {
				onInviteLinkPress(url);
			} else {
				onInviteLinkPressHandler(url);
			}
			return;
		}

		if (url.startsWith(STICKER_LINK_PATTERN)) {
			logLink('sticker link, opening sheet');
			if (onStickerLinkPress) {
				onStickerLinkPress(url);
			} else {
				stickerInteractionsStore.openStickerPackLinkSheet(url);
			}
			return;
		}

		logLink('generic link');
		if (onLinkPress) {
			onLinkPress(url);
		} else {
			Linking.openURL(url).catch(() => { });
		}
	}, [url, onInviteLinkPress, onStickerLinkPress, onLinkPress]);

	const contextMenuItems: ContextMenuItem[] = [
		{
			id: 0,
			label: t('contextMenu_open_in'),
			textColor: colors.text,
			callback: () => {
				setContextMenuVisible(false);
				if (onLinkPress) onLinkPress(url);
				else Linking.openURL(url).catch(() => { });
			},
		},
		{
			id: 1,
			label: t('contextMenu_copy_link'),
			textColor: colors.text,
			callback: () => {
				Clipboard.setString(url);
				showNotify('system', { message: 'text_copied', position: 'bottom' });
				setContextMenuVisible(false);
			},
		},
	];

	const onPress = useCallback(() => {
		logLink('Pressable onPress (tap)');
		handleLinkPress();
	}, [handleLinkPress]);

	const onLongPress = useCallback(() => {
		logLink('Pressable onLongPress, opening context menu');
		setContextMenuVisible(true);
	}, []);

	return (
		<>
			<Pressable
				ref={anchorRef}
				onPress={onPress}
				onLongPress={onLongPress}
				delayLongPress={400}
				style={({ pressed }) => [
					{ alignSelf: 'flex-start', paddingHorizontal: 2, paddingVertical: 1, borderRadius: 6 },
					pressed && { backgroundColor: 'rgba(100,100,100,0.2)' },
				]}
			>
				<Text
					style={[
						baseStyle,
						{
							color: colors.link,
							textDecorationLine: 'underline',
						},
					]}
					suppressHighlighting={false}
				>
					{content}
				</Text>
			</Pressable>
			<ContextMenuUi
				items={contextMenuItems}
				isVisible={contextMenuVisible}
				onClose={() => setContextMenuVisible(false)}
				anchorRef={anchorRef}
				width={200}
				offset={{ x: -160, y: 8 }}
				position="bottom"
			/>
		</>
	);
};

export const renderSegments = ({ segments, colors, textStyle, numberOfLines, formatOnlyTags, onLinkPress, onTagPress, onInviteLinkPress, onStickerLinkPress, t = i18n.t }: RendererProps): React.ReactElement[] => {
	const onCopyHandler = (code: string) => {
		Clipboard.setString(code);
		showNotify("system", { message: "text_copied", position: "bottom" });
	};

	const baseStyle: TextStyle = {
		color: colors.text,
		...textStyle
	};

	const elements: React.ReactElement[] = [];
	let currentTextGroup: React.ReactElement[] = [];

	const flushTextGroup = () => {
		if (currentTextGroup.length > 0) {
			elements.push(
				<Text
					key={`text-group-${elements.length}`}
					style={baseStyle}
					numberOfLines={numberOfLines}
					ellipsizeMode={(numberOfLines && numberOfLines > 0) ? "tail" : undefined}
				>
					{currentTextGroup}
				</Text>
			);
			currentTextGroup = [];
		}
	};

	segments.forEach((segment, index) => {
		if (formatOnlyTags) {
			if (segment.type === 'tag') {
				flushTextGroup();
				const textElement = (
					<Text
						key={`${index}-tag`}
						style={{ color: colors.link }}
						onPress={() => {
							if (onTagPress && segment.tag) {
								onTagPress(segment.tag);
							}
						}}
						suppressHighlighting={false}
					>
						{segment.content}
					</Text>
				);
				currentTextGroup.push(textElement);
			} else {
				if (segment.content) {
					currentTextGroup.push(
						<Text key={`${index}-text`}>{segment.content}</Text>
					);
				}
			}
			return;
		}

		if (segment.type === 'codeblock') {
			flushTextGroup();
			const language = segment.language?.toLowerCase() || '';
			const supportedLanguages = ['js', 'javascript', 'ts', 'typescript', 'py', 'python', 'c', 'cpp', 'c++', 'h', 'hpp', 'rs', 'rust'];
			const isSupported = supportedLanguages.includes(language);

			const syntaxColors = {
				text: colors.codeText,
				keyword: '#c792ea',
				string: '#c3e88d',
				comment: '#546e7a',
				function: '#82aaff'
			};

			elements.push(
				<Pressable
					key={index}
					style={[
						styles.codeBlockContainer,
						{ backgroundColor: colors.codeBlockBg }
					]}
					onPress={() => onCopyHandler(segment.content)}
				>
					<View style={[styles.codeBlockLeftBar, { backgroundColor: colors.link }]} />
					<View style={styles.codeBlockContent}>
						{segment.language && segment.language.trim() && (
							<View
								style={[
									styles.codeBlockHeader,
									{ backgroundColor: colors.codeBlockHeaderBg }
								]}
							>
								<Text style={[styles.codeBlockLanguage, { color: colors.linkText }]}>
									{segment.language.charAt(0).toUpperCase() + segment.language.slice(1)}
								</Text>

								<CopyMsgIcon
									color={colors.linkText}
									size={13}
								/>
							</View>
						)}
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={true}
							nestedScrollEnabled={true}
							style={styles.codeBlockScrollView}
						>
							<View style={styles.codeBlockInner}>
								{isSupported ? (
									<Text style={[styles.codeBlockText, { fontFamily: 'monospace', fontSize: 13, color: colors.codeText }]}>
										{highlightCode(segment.content, language, syntaxColors)}
									</Text>
								) : (
									<Text style={[styles.codeBlockText, { fontFamily: 'monospace', fontSize: 13, color: colors.codeText }]}>
										{segment.content}
									</Text>
								)}
							</View>
						</ScrollView>
					</View>
				</Pressable>
			);
			return;
		}

		if (segment.type === 'code') {
			flushTextGroup();
			elements.push(
				<Text
					key={index}
					style={[
						baseStyle,
						{
							fontFamily: 'monospace',
							backgroundColor: colors.codeBg,
							paddingHorizontal: 4,
							paddingVertical: 2,
							borderRadius: 4,
							fontSize: 14,
							color: colors.codeText
						}
					]}
				>
					{segment.content}
				</Text>
			);
			return;
		}

		if (segment.type === 'link' || segment.type === 'email') {
			flushTextGroup();

			const displayContent = insertBreakOpportunities(segment.content);

			elements.push(
				<View key={`${index}-link-wrap`} style={{ flexShrink: 1, minWidth: 0, alignSelf: 'stretch' }}>
					<LinkWithHoldMenu
						url={segment.url || ''}
						content={displayContent}
						baseStyle={baseStyle}
						colors={colors}
						onLinkPress={onLinkPress}
						onInviteLinkPress={onInviteLinkPress}
						onStickerLinkPress={onStickerLinkPress}
						t={t}
					/>
				</View>
			);
			return;
		}

		if (segment.type === 'tag') {
			const textElement = (
				<Text
					key={`${index}-tag`}
					style={{
						color: colors.link
					}}
					onPress={() => {
						if (onTagPress && segment.tag) {
							onTagPress(segment.tag);
						}
					}}
					suppressHighlighting={false}
				>
					{segment.content}
				</Text>
			);
			currentTextGroup.push(textElement);
			return;
		}

		if (segment.type === 'text') {
			if (segment.content) {
				const nextSegment = segments[index + 1];
				const nextIsBlockLink = nextSegment?.type === 'link' || nextSegment?.type === 'email';
				const content = nextIsBlockLink
					? segment.content.replace(/\n+$/, '\n')
					: segment.content;
				const textElement = (
					<Text key={`${index}-text`}>
						{content}
					</Text>
				);
				currentTextGroup.push(textElement);
			}
		} else {
			let textElement: React.ReactElement;
			switch (segment.type) {
				case 'bold':
					textElement = (
						<Text key={`${index}-bold`} style={{ fontWeight: '700' }}>
							{segment.content}
						</Text>
					);
					break;
				case 'italic':
					textElement = (
						<Text key={`${index}-italic`} style={{ fontStyle: 'italic' }}>
							{segment.content}
						</Text>
					);
					break;
				case 'strikethrough':
					textElement = (
						<Text key={`${index}-strike`} style={{ textDecorationLine: 'line-through' }}>
							{segment.content}
						</Text>
					);
					break;
				default:
					textElement = (
						<Text key={`${index}-text`}>
							{segment.content}
						</Text>
					);
			}
			currentTextGroup.push(textElement);
		}
	});

	flushTextGroup();

	return elements;
};
