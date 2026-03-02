import type { FileUploadState } from '@lib/mobx-toolbox/mobxSaiWs';
import type { AnimatedStyle } from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';
import type { PackRecord, StickerRecord } from 'src/modules/sticker/stores/sticker/sticker-action/sticker-actions';

export const STICKER_PANEL_HEIGHT = 350;

export const SETTINGS_BUTTON_SIZE = 40;
export const SETTINGS_BUTTON_INSET = 6;
export const TAB_LETTER_SIZE = 36;
export const SECTION_HEADER_HEIGHT = 32;
export const STICKERS_PER_ROW = 5;
export const CONTENT_PADDING_HORIZONTAL = 12;
export const STICKER_ROW_GAP = 4;

export interface ChatStickerWidgetProps {
	animatedStyle: AnimatedStyle<StyleProp<ViewStyle>>;
	open: boolean;
	onSendSticker?: (sticker?: StickerInList) => void;
}

export type StickerInList = StickerRecord & {
	isTemp?: boolean;
	fileUploadStates?: FileUploadState[];
};

export type ListItem =
	| { type: 'section'; pack: PackRecord; }
	| { type: 'sticker_row'; pack: PackRecord; stickers: StickerRecord[]; showPlus?: boolean; };

export const FAVOURITES_PACK_ID = '__favourites__';
export const FAVOURITES_PACK: PackRecord = {
	id: FAVOURITES_PACK_ID,
	title: 'Избранное',
	link: '',
	is_admin: false,
	is_default: false,
	created_at_ms: 0,
	updated_at_ms: 0,
	is_saved: false,
};

export type { PackRecord, StickerRecord };
