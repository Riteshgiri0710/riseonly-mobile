import { REACTIONS_LIST_BY_DEFAULT } from '@core/config/const';
import { changeRgbA } from '@lib/theme';
import { BlurView } from 'expo-blur';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { themeStore } from 'src/modules/theme/stores';
import { Box, MainText } from '@core/ui';

const EMOJI_CELL_SIZE = 44;
const EMOJI_COLUMNS = 6;
const MAX_EMOJIS = 20;

export interface StickerEmojiPickerModalProps {
	visible: boolean;
	onClose: () => void;
	onDone: (emojis: string[]) => void;
}

export function StickerEmojiPickerModal({
	visible,
	onClose,
	onDone,
}: StickerEmojiPickerModalProps) {
	const { t } = useTranslation();
	const { currentTheme } = themeStore;
	const [selected, setSelected] = useState<Set<string>>(new Set());

	const toggle = useCallback((emoji: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(emoji)) {
				next.delete(emoji);
			} else if (next.size < MAX_EMOJIS) {
				next.add(emoji);
			}
			return next;
		});
	}, []);

	const handleDone = useCallback(() => {
		const list = Array.from(selected);
		if (list.length >= 1 && list.length <= MAX_EMOJIS) {
			onDone(list);
			setSelected(new Set());
		}
	}, [selected, onDone]);

	const handleClose = useCallback(() => {
		setSelected(new Set());
		onClose();
	}, [onClose]);

	const canDone = selected.size >= 1 && selected.size <= MAX_EMOJIS;

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={handleClose}
		>
			<Pressable style={s.backdropStyle} onPress={handleClose}>
				<Pressable style={s.contentWrapStyle} onPress={(e) => e.stopPropagation()}>
					<BlurView
						intensity={40}
						style={[
							s.blurStyle,
							{
								backgroundColor: changeRgbA(currentTheme.bg_100, 0.85),
								borderColor: currentTheme.border_100,
							},
						]}
					>
						<Text style={[s.titleStyle, { color: currentTheme.text_100 }]}>
							{t('stickers.selectEmojis', { defaultValue: `Выберите эмодзи (до ${MAX_EMOJIS})`, count: MAX_EMOJIS })}
						</Text>
						<View style={s.listWrapStyle}>
							<FlashList
								data={REACTIONS_LIST_BY_DEFAULT}
								renderItem={({ item: emoji }) => {
									const isSelected = selected.has(emoji);
									return (
										<Pressable
											onPress={() => toggle(emoji)}
											style={[
												s.emojiCellStyle,
												{
													backgroundColor: isSelected
														? changeRgbA(currentTheme.primary_100 ?? currentTheme.text_100, 0.35)
														: 'transparent',
												},
											]}
										>
											<Text style={s.emojiTextStyle}>{emoji}</Text>
										</Pressable>
									);
								}}
								estimatedItemSize={EMOJI_CELL_SIZE}
								numColumns={EMOJI_COLUMNS}
								keyExtractor={(item) => item}
							/>
						</View>
						<Box align="center" justify="space-between" style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
							<Text style={[s.hintStyle, { color: currentTheme.text_100 }]}>
								{selected.size}/{MAX_EMOJIS}
							</Text>
							<Pressable
								onPress={handleDone}
								disabled={!canDone}
								style={[
									s.doneButtonStyle,
									{
										backgroundColor: canDone
											? (currentTheme.primary_100 ?? currentTheme.text_100)
											: changeRgbA(currentTheme.text_100, 0.3),
									},
								]}
							>
								<MainText style={[s.doneButtonTextStyle, { color: currentTheme.bg_100 }]}>
									{t('common.done')}
								</MainText>
							</Pressable>
						</Box>
					</BlurView>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

const s = StyleSheet.create({
	backdropStyle: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
	contentWrapStyle: { width: '90%', maxWidth: 360, maxHeight: '70%' },
	blurStyle: { borderRadius: 20, borderWidth: 0.7, overflow: 'hidden' as const, paddingTop: 16 },
	titleStyle: { fontSize: 17, fontWeight: '600', textAlign: 'center' as const, marginBottom: 12 },
	listWrapStyle: { height: 260 },
	emojiCellStyle: { width: EMOJI_CELL_SIZE, height: EMOJI_CELL_SIZE, borderRadius: EMOJI_CELL_SIZE / 2, alignItems: 'center' as const, justifyContent: 'center' as const, margin: 4 },
	emojiTextStyle: { fontSize: 26 },
	hintStyle: { fontSize: 14 },
	doneButtonStyle: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
	doneButtonTextStyle: { fontSize: 16, fontWeight: '600' },
});
