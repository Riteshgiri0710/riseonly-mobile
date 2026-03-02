import { mobxSaiWs } from '@lib/mobx-toolbox/mobxSaiWs';
import type { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';
import type { FileUploadState, SaiFile } from '@lib/mobx-toolbox/mobxSaiWs';
import { formatDiffData, formatId } from '@lib/text';
import { makeAutoObservable } from 'mobx';
import { profileStore } from 'src/modules/user/stores/profile';
import { stickerServiceStore } from '../sticker-service/sticker-service';
import type {
	CreatePackBody,
	CreatePackResponse,
	GetDefaultPacksResponse,
	GetSavedPacksResponse,
	GetStickersByPackIdResponse,
	GetStickersByPackLinkResponse,
	CreateStickerResponse,
	PackRecord,
	StickerRecord,
} from './types';
import { stickerInteractionsStore } from '../sticker-interactions/sticker-interactions';

export type { CreatePackBody, CreatePackResponse, PackRecord, StickerRecord };
export type {
	GetDefaultPacksResponse,
	GetSavedPacksResponse,
	GetStickersByPackIdResponse,
	GetStickersByPackLinkResponse,
	CreateStickerResponse,
} from './types';

export const PACK_STICKERS_CACHE_ID = (packId: string) => formatId(`stickers-getStickersByPackId-${packId}`);
export const PACK_LINK_STICKERS_CACHE_ID = (packLink: string) => formatId(`stickers-getStickersByPackLink-${packLink}`);

class StickerActionsStore {
	constructor() { makeAutoObservable(this); }

	// createPack

	createPack: MobxSaiWsInstance<CreatePackResponse> = {};

	createPackAction = (title: string, isDefault: boolean) => {
		const user_id = profileStore.profile?.id ?? '';
		const body: CreatePackBody = { title: title.trim(), ...(isDefault && { is_default: true }) };
		const targetCacheId = `stickers-getSavedPacks-${user_id}`;

		this.createPack = mobxSaiWs(body, {
			id: `stickers-createPack-${user_id}-${Date.now()}`,
			service: 'stickers',
			method: 'createPack',
			needStates: true,
			fetchIfPending: false,
			fetchIfHaveData: false,
			optimisticUpdate: {
				enabled: true,
				updateCache: 'both',
				createTempData: (_, context: { tempId: string; }) => ({
					id: context.tempId,
					title: body.title.trim(),
					link: '',
					is_admin: true,
					is_default: !!body.is_default,
					created_at_ms: Date.now(),
					updated_at_ms: Date.now(),
				}),
				extractRealData: (response: CreatePackResponse) => ({ ...response }),
				addStrategy: 'start',
				tempIdKey: 'id',
				tempFlag: 'isTemp',
				targetCacheId,
			},
		});
	};

	// getDefaultPacks

	getDefaultPacks: MobxSaiWsInstance<GetDefaultPacksResponse> = {};

	getDefaultPacksAction = (page?: number, limit?: number) => {
		const body: { page?: number; limit?: number; } = {};

		if (page != null) body.page = page;
		if (limit != null) body.limit = limit;

		this.getDefaultPacks = mobxSaiWs(body, {
			id: `getDefaultPacks`,
			service: 'stickers',
			method: 'getDefaultPacks',
			fetchIfPending: false,
			fetchIfHaveData: false,
			storageCache: true,
			pathToArray: 'packs',
		});
	};

	// getSavedPacks

	getSavedPacks: MobxSaiWsInstance<GetSavedPacksResponse> = {};

	getSavedPacksAction = (relativeId?: string, limit?: number) => {
		const user_id = profileStore.profile?.id ?? '';

		const body: { user_id: string; relative_id?: string; limit?: number; } = { user_id };

		if (relativeId != null) body.relative_id = relativeId;
		if (limit != null) body.limit = limit;

		this.getSavedPacks = mobxSaiWs(body, {
			id: `stickers-getSavedPacks-${user_id}`,
			service: 'stickers',
			method: 'getSavedPacks',
			fetchIfPending: false,
			fetchIfHaveData: false,
			storageCache: true,
			pathToArray: 'packs',
		});
	};

	// getPackStickers

	packStickersByPackId: MobxSaiWsInstance<GetStickersByPackIdResponse> = {};

	getPackStickersAction = (packId: string) => {
		const user_id = profileStore.profile?.id ?? '';

		this.packStickersByPackId = mobxSaiWs(
			{ user_id, packId },
			{
				id: `stickers-getStickersByPackId-${packId}`,
				service: 'stickers',
				method: 'getStickersByPackId',
				fetchIfPending: false,
				fetchIfHaveData: false,
				pathToArray: 'stickers',
			},
		);
	};

	// stickersByPackLink

	stickersByPackLink: MobxSaiWsInstance<GetStickersByPackLinkResponse> = {};
	currentStickersByPackLinkKey: string | null = null;

	getStickersByPackLinkAction = (packLink: string) => {
		const user_id = profileStore.profile?.id ?? '';
		this.currentStickersByPackLinkKey = packLink;

		this.stickersByPackLink = mobxSaiWs(
			{ user_id, packLink },
			{
				id: `stickers-getStickersByPackLink-${packLink}`,
				service: 'stickers',
				method: 'getStickersByPackLink',
				needStates: true,
				fetchIfPending: false,
				fetchIfHaveData: false,
				pathToArray: 'stickers',
			},
		);
	};

	// stickersByEmoji

	stickersByEmoji: MobxSaiWsInstance<{ stickers: StickerRecord[]; }> = {};
	currentStickersByEmojiKey: string | null = null;

	getStickersByEmojiAction = (emoji: string) => {
		this.currentStickersByEmojiKey = emoji;

		this.stickersByEmoji = mobxSaiWs(
			{ emoji },
			{
				id: `stickers-getStickersByEmoji-${emoji}`,
				service: 'stickers',
				method: 'getStickersByEmoji',
				needStates: true,
				fetchIfPending: false,
				fetchIfHaveData: false,
				pathToArray: 'stickers',
			},
		);
	};

	// getFavouritesRequest

	getFavouritesRequest: MobxSaiWsInstance<{ stickers: StickerRecord[]; }> = {} as MobxSaiWsInstance<{ stickers: StickerRecord[]; }>;

	getFavouritesAction = () => {
		const user_id = profileStore.profile?.id ?? 'none';

		this.getFavouritesRequest = mobxSaiWs(
			{ user_id, limit: 15 },
			{
				id: `stickers-getUserFavourites-${user_id}`,
				service: 'stickers',
				method: 'getUserFavourites',
				needStates: true,
				fetchIfPending: false,
				fetchIfHaveData: false,
				storageCache: true,
				pathToArray: 'stickers',
			},
		);
	};

	// createSticker

	createSticker: MobxSaiWsInstance<CreateStickerResponse> = {};

	createStickerAction = (packId: string, file: SaiFile, emojis: string[]) => {
		if (!emojis.length || emojis.length > 20) {
			console.warn('createStickerAction: emojis must be 1–20');
			return;
		}

		const user_id = profileStore.profile?.id ?? '';

		this.createSticker = mobxSaiWs(
			{ user_id, packId, emojis },
			{
				id: "createSticker",
				service: 'stickers',
				method: 'createSticker',
				needStates: true,
				fetchIfPending: false,
				fetchIfHaveData: true,
				pathToArray: 'stickers',
				optimisticUpdate: {
					enabled: true,
					updateCache: 'both',
					createTempData: stickerServiceStore.createOptimisticStickerData,
					extractRealData: stickerServiceStore.extractRealStickerData,
					addStrategy: 'end',
					tempIdKey: 'id',
					tempFlag: 'isTemp',
					targetCacheId: `stickers-getStickersByPackId-${packId}`,
					files: {
						data: [file],
						maxUploads: 1,
						pathInTempData: 'fileUploadStates',
						filesParamKey: '',
						extractUploadedFiles: (fileStates: FileUploadState[]) => {
							const s = fileStates?.[0];
							if (!s?.status || s.status !== 'completed' || !s.result?.url) return null;
							return {
								fileUrl: s.result.url,
								width: s.result.width ?? 0,
								height: s.result.height ?? 0,
							};
						},
					},
				},
			},
		);
	};

	// addStickerFavourite

	addStickerFavourite: MobxSaiWsInstance<{ message: string; }> = {};

	addStickerFavouriteAction = () => {
		const { selectedSticker: { selectedSticker } } = stickerInteractionsStore;

		const user_id = profileStore.profile?.id ?? '';
		const stickerId = selectedSticker?.id ?? '';
		const targetCacheId = `stickers-getUserFavourites-${user_id}`;

		this.addStickerFavourite = mobxSaiWs(
			{ user_id, stickerId },
			{
				id: `addStickerFavourite`,
				service: 'stickers',
				method: 'addStickerFavourite',
				needStates: true,
				fetchIfPending: false,
				fetchIfHaveData: true,
				...(selectedSticker && {
					optimisticUpdate: {
						enabled: true,
						updateCache: 'both',
						createTempData: () => ({ ...selectedSticker }),
						extractRealData: () => ({ ...selectedSticker }),
						addStrategy: 'start',
						tempIdKey: 'id',
						tempFlag: 'isTemp',
						targetCacheId,
					},
				}),
			},
		);
	};

	// removeStickerFavourite

	removeStickerFavourite: MobxSaiWsInstance<{ message: string; }> = {};

	removeStickerFavouriteAction = (stickerId: string) => {
		const user_id = profileStore.profile?.id ?? '';
		const targetCacheId = `stickers-getUserFavourites-${user_id}`;

		this.removeStickerFavourite = mobxSaiWs(
			{ user_id, stickerId },
			{
				id: `removeStickerFavourite`,
				service: 'stickers',
				method: 'removeStickerFavourite',
				needStates: true,
				fetchIfPending: false,
				fetchIfHaveData: true,
				optimisticUpdate: {
					enabled: true,
					deleteMode: true,
					targetCacheId,
					deleteId: stickerId,
					tempIdKey: 'id',
					updateCache: 'both',
				},
			},
		);
	};

	// removeStickerFromPack

	removeStickerFromPack: MobxSaiWsInstance<{ message: string; }> = {};

	removeStickerFromPackAction = (packId: string, stickerId: string) => {
		const user_id = profileStore.profile?.id ?? '';
		const targetCacheId = `stickers-getStickersByPackId-${packId}`;

		this.removeStickerFromPack = mobxSaiWs(
			{ user_id, stickerId },
			{
				id: `deleteSticker`,
				service: 'stickers',
				method: 'deleteSticker',
				needStates: true,
				fetchIfPending: false,
				fetchIfHaveData: true,
				optimisticUpdate: {
					enabled: true,
					deleteMode: true,
					targetCacheId,
					deleteId: stickerId,
					tempIdKey: 'id',
					updateCache: 'both',
				},
			},
		);
	};

	// reorderStickersInPack

	reorderStickersInPack: MobxSaiWsInstance<{ message: string; }> = {};

	reorderStickersInPackAction = (packId: string, stickerIds: string[]) => {
		const { applyPackStickersOrder } = stickerServiceStore;

		const user_id = profileStore.profile?.id ?? '';

		applyPackStickersOrder(packId, stickerIds);

		this.reorderStickersInPack = mobxSaiWs(
			{ user_id, pack_id: packId, sticker_ids: stickerIds },
			{
				id: `reorderStickers`,
				service: 'stickers',
				method: 'reorderStickers',
				needStates: true,
				fetchIfPending: false,
				fetchIfHaveData: true,
			},
		);
	};

	// deletePack

	deletePack: MobxSaiWsInstance<{ message: string; }> = {};

	deletePackAction = (packId: string) => {
		const user_id = profileStore.profile?.id ?? '';
		const targetCacheId = `stickers-getSavedPacks-${user_id}`;

		this.deletePack = mobxSaiWs(
			{ user_id, pack_id: packId },
			{
				id: `deletePack`,
				service: 'stickers',
				method: 'deletePack',
				needStates: true,
				fetchIfPending: false,
				fetchIfHaveData: true,
				optimisticUpdate: {
					enabled: true,
					deleteMode: true,
					targetCacheId,
					deleteId: packId,
					tempIdKey: 'id',
					updateCache: 'both',
				},
				onSuccess: () => {
					this.getDefaultPacksAction(0, 50);
				},
			},
		);
	};

	// editPack

	editPack: MobxSaiWsInstance<{ pack?: PackRecord; }> = {};

	editPackAction = (packId: string, title: string, isDefault: boolean) => {
		const user_id = profileStore.profile?.id ?? '';
		const targetCacheId = `stickers-getSavedPacks-${user_id}`;

		this.editPack = mobxSaiWs(
			{ user_id, packId, title, is_default: isDefault },
			{
				id: `editPack`,
				service: 'stickers',
				method: 'editPack',
				needStates: true,
				fetchIfPending: false,
				fetchIfHaveData: true,
				optimisticUpdate: {
					enabled: true,
					updateMode: true,
					updateId: packId,
					targetCacheId,
					tempIdKey: 'id',
					updateCache: 'both',
					updateTempData: (body: { title: string; is_default: boolean; }, currentData: PackRecord) => ({
						...currentData,
						title: body.title,
						is_default: body.is_default,
					}),
				},
				onSuccess: (data) => {
					if (data?.pack) stickerServiceStore.applyEditPackToCacheFromResponse(packId, data.pack);
				},
			},
		);
	};

	// savePack

	savePack: MobxSaiWsInstance<{ message?: string; }> = {};

	savePackAction = (pack: PackRecord, options?: { onSuccess?: () => void; }) => {
		const { applySavePackToCache } = stickerServiceStore;
		const user_id = profileStore.profile?.id ?? '';
		const targetCacheId = `stickers-getSavedPacks-${user_id}`;

		const packLink = pack.link;
		const packId = pack.id;

		applySavePackToCache(pack, packLink);

		this.savePack = mobxSaiWs(
			{ user_id, packId },
			{
				id: `savePack`,
				service: 'stickers',
				method: 'savePack',
				needStates: true,
				fetchIfPending: false,
				fetchIfHaveData: true,
				optimisticUpdate: {
					enabled: true,
					updateMode: true,
					updateId: packId,
					targetCacheId,
					tempIdKey: 'id',
					updateCache: 'both',
					updateTempData: (_body: unknown, currentData: PackRecord) => ({ ...currentData, is_saved: true }),
				},
				onSuccess: () => {
					options?.onSuccess?.();
				},
			},
		);
	};

	// removeSavedPack

	removeSavedPack: MobxSaiWsInstance<{ message?: string; }> = {};

	removeSavedPackAction = (pack: PackRecord, options?: { onSuccess?: () => void; packLink?: string; }) => {
		const { applyRemoveSavedPackToCache } = stickerServiceStore;

		const user_id = profileStore.profile?.id ?? '';
		const targetCacheId = `stickers-getSavedPacks-${user_id}`;

		const packId = pack.id;
		const packLink = pack.link;

		applyRemoveSavedPackToCache(packId, packLink);

		this.removeSavedPack = mobxSaiWs(
			{ user_id, packId },
			{
				id: `removeSavedPack`,
				service: 'stickers',
				method: 'removeSavedPack',
				needStates: true,
				fetchIfPending: false,
				fetchIfHaveData: true,
				optimisticUpdate: {
					enabled: true,
					deleteMode: true,
					targetCacheId,
					deleteId: packId,
					tempIdKey: 'id',
					updateCache: 'both',
				},
				onSuccess: () => {
					options?.onSuccess?.();
				},
			},
		);
	};
}

export const stickerActionsStore = new StickerActionsStore();
