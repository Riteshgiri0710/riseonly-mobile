import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';
import { GetDefaultPacksResponse, GetStickersByPackIdResponse, PackRecord, GetStickersByPackLinkResponse, StickerRecord } from '../sticker-action/types';

export type StickerActionsStoreRef = {
	getDefaultPacks: MobxSaiWsInstance<GetDefaultPacksResponse>;
	getSavedPacks: MobxSaiWsInstance<{ packs: PackRecord[]; }> | undefined;
	stickersByPackLink: MobxSaiWsInstance<GetStickersByPackLinkResponse>;
	editPack: MobxSaiWsInstance<{ pack?: PackRecord; }>;
	getFavouritesRequest: MobxSaiWsInstance<{ stickers: StickerRecord[]; }>;
	packStickersByPackId: Record<string, MobxSaiWsInstance<GetStickersByPackIdResponse>>;
};