import React from 'react';
import { Pressable, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ListItem, PackRecord, StickerInList } from './types';
import { stickerRowStyles } from './styles';
import { StickerCell } from './StickerCell';
import { BlurView } from 'expo-blur';
import { Box, MainText } from '@core/ui';
import { useTranslation } from 'react-i18next';

interface StickerRowProps {
	item: Extract<ListItem, { type: 'sticker_row'; }>;
	cellSize: number;
	uploadingPackId: string | null;
	onPlusPress: (pack: PackRecord) => void;
	plusCellBackgroundColor: string;
	textColor: string;
	onRegisterCellRef?: (stickerId: string, view: View) => void;
	onUnregisterCellRef?: (stickerId: string) => void;
	onSendSticker?: (sticker: StickerInList) => void;
}

function areRowPropsEqual(prev: StickerRowProps, next: StickerRowProps): boolean {
	if (prev.cellSize !== next.cellSize) return false;
	if (prev.uploadingPackId !== next.uploadingPackId) return false;
	if (prev.plusCellBackgroundColor !== next.plusCellBackgroundColor) return false;
	if (prev.textColor !== next.textColor) return false;
	if (prev.onRegisterCellRef !== next.onRegisterCellRef) return false;
	if (prev.onUnregisterCellRef !== next.onUnregisterCellRef) return false;
	if (prev.onSendSticker !== next.onSendSticker) return false;
	if (prev.item.pack.id !== next.item.pack.id) return false;
	if (prev.item.showPlus !== next.item.showPlus) return false;
	if (prev.item.stickers.length !== next.item.stickers.length) return false;
	for (let i = 0; i < prev.item.stickers.length; i++) {
		const a = prev.item.stickers[i] as StickerInList;
		const b = next.item.stickers[i] as StickerInList;
		if (a.id !== b.id) return false;
		if (a.isTemp || b.isTemp) return false;
		if (a.file_url !== b.file_url) return false;
	}
	return true;
}

function StickerRowInner({
	item,
	cellSize,
	uploadingPackId,
	onPlusPress,
	plusCellBackgroundColor,
	textColor,
	onRegisterCellRef,
	onUnregisterCellRef,
	onSendSticker,
}: StickerRowProps) {
	const { t } = useTranslation();

	return (
		<View style={stickerRowStyles.row}>
			{item.showPlus && (
				<Pressable
					onPress={() => onPlusPress(item.pack)}
					style={({ pressed }) => [
						stickerRowStyles.plusCell,
						{
							width: cellSize,
							height: cellSize,
							opacity: pressed ? 0.8 : 1,
							overflow: "hidden",
						},
					]}
				>
					<BlurView
						intensity={15}
						style={{
							width: "100%",
							height: "100%",
							alignItems: "center",
							justifyContent: "center",
							padding: 5,
							paddingVertical: 10,
							backgroundColor: plusCellBackgroundColor,
						}}
					>
						<Box
							centered
						>
							<MaterialIcons name="add" size={32} color={textColor} />
							<MainText
								color='white'
								px={11}
								tac='center'
								numberOfLines={2}
							>
								{t("create_sticker")}
							</MainText>
						</Box>
					</BlurView>
				</Pressable>
			)}
			{item.stickers.map((sticker) => (
				<StickerCell
					key={`${item.pack.id}-${sticker.id}`}
					packId={item.pack.id}
					sticker={sticker as StickerInList}
					cellSize={cellSize}
					onRegisterCellRef={onRegisterCellRef}
					onUnregisterCellRef={onUnregisterCellRef}
					onPress={onSendSticker}
				/>
			))}
		</View>
	);
}

export const StickerRow = React.memo(StickerRowInner, areRowPropsEqual);
