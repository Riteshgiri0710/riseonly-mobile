import type { ListItem, PackRecord, StickerInList } from './types';
import { CONTENT_PADDING_HORIZONTAL, FAVOURITES_PACK, STICKER_ROW_GAP, STICKERS_PER_ROW } from './types';
import type { StickerRecord } from './types';

export function getStickerCellSize(screenWidth: number): number {
	const contentWidth = screenWidth - 2 * CONTENT_PADDING_HORIZONTAL;
	const gaps = (STICKERS_PER_ROW - 1) * STICKER_ROW_GAP;
	return Math.floor((contentWidth - gaps) / STICKERS_PER_ROW);
}

export function getStickerDisplayUrl(sticker: StickerInList): string {
	if (sticker.file_url) return sticker.file_url;
	if ((sticker as any).fileUrl) return (sticker as any).fileUrl;
	if (!sticker.isTemp || !sticker.fileUploadStates?.length) return '';
	const s = sticker.fileUploadStates[0];
	return s?.result?.url ?? s?.result?.file_url ?? s?.url ?? s?.file_url ?? s?.file?.uri ?? s?.file?.file?.uri ?? '';
}

function buildFavouritesRows(favourites: StickerRecord[]): ListItem[] {
	const out: ListItem[] = [];
	if (favourites.length === 0) return out;
	out.push({ type: 'section', pack: FAVOURITES_PACK });
	for (let i = 0; i < favourites.length; i += STICKERS_PER_ROW) {
		out.push({
			type: 'sticker_row',
			pack: FAVOURITES_PACK,
			stickers: favourites.slice(i, i + STICKERS_PER_ROW),
		});
	}
	return out;
}

export function buildListData(
	packs: PackRecord[],
	getPackStickers: (packId: string) => StickerRecord[],
	favourites: StickerRecord[] = [],
): ListItem[] {
	const out: ListItem[] = buildFavouritesRows(favourites);
	for (const pack of packs) {
		out.push({ type: 'section', pack });
		const stickers = getPackStickers(pack.id);
		const isPackAdmin = pack.is_admin;
		const firstRowSize = isPackAdmin ? STICKERS_PER_ROW - 1 : STICKERS_PER_ROW;
		let i = 0;
		if (i < stickers.length || isPackAdmin) {
			out.push({
				type: 'sticker_row',
				pack,
				stickers: stickers.slice(i, i + firstRowSize),
				showPlus: isPackAdmin,
			});
			i += firstRowSize;
		}
		for (; i < stickers.length; i += STICKERS_PER_ROW) {
			out.push({
				type: 'sticker_row',
				pack,
				stickers: stickers.slice(i, i + STICKERS_PER_ROW),
			});
		}
	}
	return out;
}

const CELL_REF_KEY_SEP = '::';

export function isLottieSticker(fileUrl: string): boolean {
	return fileUrl.toLowerCase().endsWith('.json');
}

export function getCellRefKey(packId: string, stickerId: string): string {
	return `${packId}${CELL_REF_KEY_SEP}${stickerId}`;
}

export function parseCellRefKey(key: string): { packId: string; stickerId: string; } | null {
	const i = key.indexOf(CELL_REF_KEY_SEP);
	if (i < 0) return null;
	return { packId: key.slice(0, i), stickerId: key.slice(i + CELL_REF_KEY_SEP.length) };
}