import { STICKER_LINK_PATTERN } from '@core/config/const';
import { useMobxForm } from 'mobx-toolbox';
import { mobxState } from 'mobx-toolbox';
import { makeAutoObservable, runInAction } from 'mobx';
import type { PackRecord, StickerRecord } from '../sticker-action/sticker-actions';
import { CreatePackSchema } from 'src/modules/sticker/shared/schemas';
import { profileStore } from 'src/modules/user/stores/profile';
import { stickerActionsStore } from '../sticker-action/sticker-actions';
import { stickerServiceStore } from '../sticker-service/sticker-service';

class StickerInteractionsStore {
	constructor() { makeAutoObservable(this); }

	isStickerPackLinkSheetOpen = mobxState(false)('isStickerPackLinkSheetOpen');
	stickerPackLinkSheetPackLink = mobxState<string | null>(null)('stickerPackLinkSheetPackLink');
	stickerPackSheetOpen = mobxState(false)('stickerPackSheetOpen');
	stickerPackSheetPackId = mobxState<string | null>(null)('stickerPackSheetPackId');
	stickerPackSheetPack = mobxState<PackRecord | null>(null)('stickerPackSheetPack');
	stickerPackSheetStickers = mobxState<StickerRecord[]>([])('stickerPackSheetStickers');
	selectedSticker = mobxState<StickerRecord | null>(null)('selectedSticker');

	reorderSheetOpen = mobxState(false)('reorderSheetOpen');
	reorderSheetPack = mobxState<PackRecord | null>(null)('reorderSheetPack');
	reorderSheetStickers = mobxState<StickerRecord[]>([])('reorderSheetStickers');

	openReorderSheet = (pack: PackRecord, stickers: StickerRecord[]) => {
		runInAction(() => {
			this.reorderSheetPack.setReorderSheetPack(pack);
			this.reorderSheetStickers.setReorderSheetStickers(stickers);
			this.reorderSheetOpen.setReorderSheetOpen(true);
		});
	};

	closeReorderSheet = () => {
		runInAction(() => {
			this.reorderSheetOpen.setReorderSheetOpen(false);
			this.reorderSheetPack.setReorderSheetPack(null);
			this.reorderSheetStickers.setReorderSheetStickers([]);
		});
	};

	openStickerPackByPackId = (packId: string) => {
		runInAction(() => {
			this.stickerPackSheetPackId.setStickerPackSheetPackId(packId);
			this.stickerPackSheetPack.setStickerPackSheetPack(null);
			this.stickerPackSheetStickers.setStickerPackSheetStickers([]);
			this.stickerPackSheetOpen.setStickerPackSheetOpen(true);
		});
	};

	openStickerPackByPack = (pack: PackRecord, stickers: StickerRecord[]) => {
		runInAction(() => {
			this.stickerPackSheetPackId.setStickerPackSheetPackId(null);
			this.stickerPackSheetPack.setStickerPackSheetPack(pack);
			this.stickerPackSheetStickers.setStickerPackSheetStickers(stickers);
			this.stickerPackSheetOpen.setStickerPackSheetOpen(true);
		});
	};

	closeStickerPackSheet = () => {
		runInAction(() => {
			this.stickerPackSheetOpen.setStickerPackSheetOpen(false);
			this.stickerPackSheetPackId.setStickerPackSheetPackId(null);
			this.stickerPackSheetPack.setStickerPackSheetPack(null);
			this.stickerPackSheetStickers.setStickerPackSheetStickers([]);
		});
	};

	openStickerPackLinkSheet = (url: string) => {
		const slug = url.startsWith(STICKER_LINK_PATTERN)
			? url.slice(STICKER_LINK_PATTERN.length).split(/[/?#]/)[0]?.trim()
			: null;
		if (!slug) return;
		runInAction(() => {
			this.stickerPackLinkSheetPackLink.setStickerPackLinkSheetPackLink(slug);
			this.isStickerPackLinkSheetOpen.setIsStickerPackLinkSheetOpen(true);
		});
	};

	closeStickerPackLinkSheet = () => {
		this.isStickerPackLinkSheetOpen.setIsStickerPackLinkSheetOpen(false);
		this.stickerPackLinkSheetPackLink.setStickerPackLinkSheetPackLink(null);
		stickerServiceStore.clearStickersByPackLink();
	};

	createPackForm = useMobxForm(
		{
			title: '',
			is_default: false,
		},
		CreatePackSchema,
		{
			instaValidate: true,
			resetErrIfNoValue: true,
			inputResetErr: true,
		},
	);

	isCreatePackModalOpen = mobxState(false)('isCreatePackModalOpen');
	isEditPackModalOpen = mobxState(false)('isEditPackModalOpen');
	editPackPack: PackRecord | null = null;

	setCreatePackModalOpen = (open: boolean) => {
		this.isCreatePackModalOpen.setIsCreatePackModalOpen(open);
		if (!open) {
			this.createPackForm.reset();
		}
	};

	setEditPackModalOpen = (open: boolean) => {
		this.isEditPackModalOpen.setIsEditPackModalOpen(open);
		if (!open) {
			this.editPackPack = null;
			this.createPackForm.reset();
		}
	};

	openEditPackModal = (pack: PackRecord) => {
		this.editPackPack = pack;
		this.createPackForm.setValue('title', pack.title);
		this.createPackForm.setValue('is_default', pack.is_default ?? false);
		this.isEditPackModalOpen.setIsEditPackModalOpen(true);
	};

	createPackSubmitHandler = () => {
		if (!this.createPackForm.validate()) return;
		const { title, is_default } = this.createPackForm.values;
		stickerActionsStore.createPackAction(title.trim(), is_default);
		this.setCreatePackModalOpen(false);
	};

	editPackSubmitHandler = () => {
		const { editPackAction } = stickerActionsStore;
		const { applyEditPackToCache } = stickerServiceStore;

		if (!this.editPackPack || !this.createPackForm.validate()) return;

		const { title, is_default } = this.createPackForm.values;

		const packId = this.editPackPack.id;
		const titleTrim = title.trim();

		applyEditPackToCache(packId, titleTrim, is_default);
		editPackAction(packId, titleTrim, is_default);

		this.setEditPackModalOpen(false);
	};
}

export const stickerInteractionsStore = new StickerInteractionsStore();
