import { CleverImage, LoaderUi } from '@core/ui';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { getCellRefKey, getStickerDisplayUrl, isLottieSticker } from './utils';
import type { StickerInList } from './types';
import { isTempId } from '@utils/functions';

const PREVIEW_INSET = 8;

export type StickerCellBounds = { x: number; y: number; width: number; height: number; };

interface StickerCellProps {
	sticker: StickerInList;
	packId: string;
	cellSize: number;
	onRegisterCellRef?: (cellKey: string, view: View) => void;
	onUnregisterCellRef?: (cellKey: string) => void;
	onPress?: (sticker: StickerInList) => void;
}

function getUploadProgress(sticker: StickerInList): number {
	if (!sticker.isTemp || !sticker.fileUploadStates?.length) return 0.1;
	const first = sticker.fileUploadStates[0];
	const raw = first?.overallProgress ?? first?.progress ?? 0;
	return raw / 100;
}

function arePropsEqual(prev: StickerCellProps, next: StickerCellProps): boolean {
	if (prev.packId !== next.packId) return false;
	if (prev.cellSize !== next.cellSize) return false;
	if (prev.onRegisterCellRef !== next.onRegisterCellRef) return false;
	if (prev.onUnregisterCellRef !== next.onUnregisterCellRef) return false;
	if (prev.onPress !== next.onPress) return false;
	const a = prev.sticker;
	const b = next.sticker;
	if (a.id !== b.id) return false;
	if (a.isTemp || b.isTemp) return false;
	return a.file_url === b.file_url;
}

function StickerCellInner({ sticker, packId, cellSize, onRegisterCellRef, onUnregisterCellRef, onPress }: StickerCellProps) {
	const wrapRef = useRef<View | null>(null);
	const cellKey = getCellRefKey(packId, sticker.id);

	useEffect(() => {
		const node = wrapRef.current;
		if (node) onRegisterCellRef?.(cellKey, node);
		return () => {
			onUnregisterCellRef?.(cellKey);
		};
	}, [cellKey, onRegisterCellRef, onUnregisterCellRef]);

	const allUploadsCompleted =
		!sticker.fileUploadStates?.length ||
		(sticker.fileUploadStates?.every((s) => s.status === 'completed') ?? true);
	const hasFileStates = (sticker.fileUploadStates?.length ?? 0) > 0;
	const showLoader =
		isTempId(sticker.id) &&
		sticker.isTemp &&
		hasFileStates &&
		!allUploadsCompleted;
	const isTempUploading = showLoader;
	const uploadProgress = getUploadProgress(sticker);
	const displayUrl = getStickerDisplayUrl(sticker);
	const isLottie = isLottieSticker(displayUrl) || (sticker.fileUploadStates?.[0]?.file?.name?.toLowerCase().endsWith('.json'));

	const previewSize = cellSize - PREVIEW_INSET;
	const cellStyle = [styles.cell, { width: cellSize, height: cellSize }];
	const cellInnerStyle = [styles.cellInner, { width: cellSize, height: cellSize }];
	const previewStyle = [styles.preview, { width: previewSize, height: previewSize }];
	const loaderOverlayStyle = [styles.loaderOverlay, { borderRadius: cellSize / 2 }];
	const loaderSize = Math.max(24, Math.min(36, previewSize - 4));

	return (
		<View
			ref={(node) => {
				wrapRef.current = node;
				if (node) onRegisterCellRef?.(cellKey, node);
			}}
			style={cellStyle}
			collapsable={false}
		>
			<Pressable
				style={StyleSheet.absoluteFill}
				onPress={() => {
					if (!isTempUploading && onPress) onPress(sticker);
				}}
			>
				{isTempUploading ? (
					<View style={cellInnerStyle}>
						{displayUrl ? (
							<>
								{isLottie ? (
									<View pointerEvents="none">
										<LottieView
											source={{ uri: displayUrl }}
											autoPlay={false}
											// loop
											style={previewStyle}
										/>
									</View>
								) : (
									<View pointerEvents="none">
										<CleverImage
											source={{ uri: displayUrl }}
											imageStyles={[previewStyle, styles.previewRound]}
											resizeMode="contain"
										/>
									</View>
								)}
								<View style={StyleSheet.absoluteFill} pointerEvents="none">
									<View style={loaderOverlayStyle}>
										<LoaderUi type="progress" progress={uploadProgress} size={loaderSize} style={{ borderRadius: 1000 }} />
									</View>
								</View>
							</>
						) : (
							<LoaderUi type="progress" progress={uploadProgress} size={loaderSize} />
						)}
					</View>
				) : (
					<View style={cellInnerStyle} pointerEvents="none">
						{displayUrl ? (
							isLottie ? (
								<LottieView
									source={{ uri: displayUrl }}
									autoPlay={false}
									// loop
									style={previewStyle}
								/>
							) : (
								<CleverImage
									source={{ uri: displayUrl }}
									imageStyles={[previewStyle, styles.previewRound]}
									resizeMode="contain"
								/>
							)
						) : null}
					</View>
				)}
			</Pressable>
		</View>
	);
}

export const StickerCell = React.memo(StickerCellInner, arePropsEqual);

const styles = StyleSheet.create({
	cell: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	cellInner: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	preview: {},
	previewRound: {
		borderRadius: 8,
	},
	loaderOverlay: {
		...StyleSheet.absoluteFillObject,
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
	},
});
