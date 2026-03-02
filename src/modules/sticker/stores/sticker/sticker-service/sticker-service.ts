import { getSaiInstanceById } from '@lib/mobx-toolbox/mobxSaiWs';
import type { FileUploadState } from '@lib/mobx-toolbox/mobxSaiWs';
import { formatId } from '@lib/text';
import { makeAutoObservable, runInAction } from 'mobx';
import type {
	GetDefaultPacksResponse,
	GetStickersByPackIdResponse,
	GetStickersByPackLinkResponse,
	PackRecord,
	CreateStickerResponse,
	StickerRecord,
} from '../sticker-action/sticker-actions';
import { profileStore } from 'src/modules/user/stores/profile';
import { PACK_LINK_STICKERS_CACHE_ID, PACK_STICKERS_CACHE_ID, stickerActionsStore } from '../sticker-action/sticker-actions';

class StickerServiceStore {
	constructor() { makeAutoObservable(this); }

	clearStickersByPackLink = () => {
		runInAction(() => {
			stickerActionsStore.currentStickersByPackLinkKey = null;
		});
	};

	createOptimisticStickerData = (
		requestBody: { user_id: string; packId: string; },
		context?: { tempId: string; fileStates?: FileUploadState[]; },
	) => ({
		id: context?.tempId ?? `temp_sticker_${Date.now()}`,
		pack_id: requestBody.packId,
		file_url: '',
		width: 0,
		height: 0,
		position: -1,
		created_at_ms: Date.now(),
		isTemp: true,
		fileUploadStates: context?.fileStates ?? [],
	});

	extractRealStickerData = (response: CreateStickerResponse) => response;

	applyEditPackToCache = (packId: string, title: string, isDefault: boolean) => {
		const { getDefaultPacks } = stickerActionsStore;
		const optsId = (getDefaultPacks as { options?: { id?: string; }; })?.options?.id;
		if (optsId) {
			getDefaultPacks?.saiUpdater?.(
				null,
				null,
				(prev: PackRecord[]) =>
					(prev ?? []).map((p) => (p.id === packId ? { ...p, title, is_default: isDefault } : p)),
				'id',
				formatId(optsId),
				'both',
			);
		}
		const packInst = getSaiInstanceById<GetStickersByPackIdResponse>(PACK_STICKERS_CACHE_ID(packId));
		if (packInst?.data?.pack?.id === packId) {
			runInAction(() => {
				packInst.data = {
					...packInst.data!,
					pack: { ...packInst.data!.pack!, title, is_default: isDefault },
				};
			});
		}
	};

	applyEditPackToCacheFromResponse = (packId: string, pack: PackRecord) => {
		this.applyEditPackToCache(packId, pack.title, pack.is_default);
		const packInst = getSaiInstanceById<GetStickersByPackIdResponse>(PACK_STICKERS_CACHE_ID(packId));
		if (packInst?.data?.pack?.id === packId) {
			runInAction(() => {
				packInst.data = { ...packInst.data!, pack };
			});
		}
	};

	applySavePackToCache = (pack: PackRecord, packLink: string) => {
		const { getSavedPacks } = stickerActionsStore;

		const user_id = profileStore.profile?.id ?? '';
		const cacheId = `stickers-getSavedPacks-${user_id}`;

		getSavedPacks?.saiUpdater?.(
			null,
			null,
			(prev: PackRecord[]) => {
				return [pack, ...prev];
			},
			'id',
			cacheId,
			'both',
		);

		this.updatePackIsSavedInPackLink(packLink, true);
		this.updatePackIsSavedInPackId(pack.id, true);
	};

	applyRemoveSavedPackToCache = (packId: string, packLink: string) => {
		const { getSavedPacks } = stickerActionsStore;

		const user_id = profileStore.profile?.id ?? '';
		const cacheId = `stickers-getSavedPacks-${user_id}`;

		getSavedPacks?.saiUpdater?.(
			null,
			null,
			(prev: PackRecord[]) => (prev ?? []).filter((p) => p.id !== packId),
			'id',
			cacheId,
			'both',
		);

		this.updatePackIsSavedInPackLink(packLink, false);
		this.updatePackIsSavedInPackId(packId, false);
	};

	updatePackIsSavedInPackLink = (packLink: string, isSaved: boolean) => {
		const { stickersByPackLink } = stickerActionsStore;

		stickersByPackLink?.saiUpdater?.(
			null,
			null,
			(prev: GetStickersByPackLinkResponse) => ({
				...prev,
				pack: prev.pack ? { ...prev.pack, is_saved: isSaved } : prev.pack,
			}),
			'id',
			PACK_LINK_STICKERS_CACHE_ID(packLink),
			'both',
			{ fullData: true },
		);
	};

	updatePackIsSavedInPackId = (packId: string, isSaved: boolean) => {
		const { packStickersByPackId } = stickerActionsStore;

		packStickersByPackId?.saiUpdater?.(
			null,
			null,
			(prev: GetStickersByPackIdResponse) => ({
				...prev,
				pack: { ...prev.pack!, is_saved: isSaved },
			}),
			'id',
			PACK_STICKERS_CACHE_ID(packId),
			'both',
			{ fullData: true },
		);
	};

	applyPackStickersOrder = (packId: string, stickerIds: string[]) => {
		const inst = getSaiInstanceById<GetStickersByPackIdResponse>(PACK_STICKERS_CACHE_ID(packId));

		if (!inst?.saiUpdater) return;

		inst.saiUpdater(
			null,
			null,
			(prev: StickerRecord[]) => {
				const list = prev || [];
				const ordered = stickerIds.map((id) => list.find((s) => s.id === id)).filter(Boolean) as StickerRecord[];
				return ordered.length > 0 ? ordered : list;
			},
			'id',
			PACK_STICKERS_CACHE_ID(packId),
			'both',
		);
	};

	getPackStickersData = (packId: string): StickerRecord[] => {
		const inst = getSaiInstanceById<GetStickersByPackIdResponse>(PACK_STICKERS_CACHE_ID(packId));
		return inst?.data?.stickers ?? [];
	};
}

export const stickerServiceStore = new StickerServiceStore();
