import { makeAutoObservable, runInAction } from 'mobx';
import { profileStore } from '@modules/user/stores/profile';

export interface UserOnlineStatus {
	is_online: boolean;
	last_seen: number | null;
}

const selfStatus: UserOnlineStatus = { is_online: true, last_seen: null };

function parseCreatorOrParticipantMore(obj: any): { is_online: boolean; last_seen: number | null; } {
	const more = obj?.more ?? obj;
	const is_online = Boolean(more?.is_online);
	const raw = more?.last_seen;
	const last_seen =
		raw == null || raw === 0
			? null
			: typeof raw === 'number'
				? raw
				: null;
	return { is_online, last_seen };
}

class OnlineServices {
	constructor() { makeAutoObservable(this); }

	statusByUserId = new Map<string, UserOnlineStatus>();

	getStatus(userId: string | null | undefined): UserOnlineStatus | null {
		if (!userId) return null;
		const stored = this.statusByUserId?.get(userId);
		if (stored) return stored;
		if (profileStore.profile?.id === userId) return selfStatus;
		return null;
	}

	getEffectiveStatus(userId: string | null | undefined, embeddedUser?: any): UserOnlineStatus {
		const stored = this.getStatus(userId);
		if (stored) return stored;
		if (embeddedUser) {
			const iso = embeddedUser.findByKey('is_online');
			const lso = embeddedUser.findByKey('last_seen');
			if (typeof iso === 'boolean' || (lso != null && typeof lso === 'number')) {
				return {
					is_online: typeof iso === 'boolean' ? iso : false,
					last_seen: lso != null && typeof lso === 'number' ? lso : null,
				};
			}
		}
		return { is_online: false, last_seen: null };
	}

	setStatus(userId: string, is_online: boolean, last_seen?: number | null) {
		if (!userId) return;
		const map = this.statusByUserId ?? new Map();
		const prev = map.get(userId);
		const next: UserOnlineStatus = {
			is_online,
			last_seen: last_seen ?? null,
		};
		const reallyChanged = !prev || prev.is_online !== next.is_online || prev.last_seen !== next.last_seen;
		if (!reallyChanged) return;

		runInAction(() => {
			const nextMap = new Map(this.statusByUserId ?? new Map());
			nextMap.set(userId, next);
			this.statusByUserId = nextMap;
		});
	}

	mergeFromChats(chats: any[]) {
		if (!Array.isArray(chats) || chats.length === 0) return;
		const currentUserId = profileStore.profile?.id;

		runInAction(() => {
			const map = this.statusByUserId ?? new Map();
			if (!this.statusByUserId) this.statusByUserId = map;

			const upsert = (id: string, status: UserOnlineStatus) => {
				if (!id) return;
				if (id === currentUserId) return;
				if (map.has(id)) return; // real-time setStatus is source of truth, never overwrite
				map.set(id, status);
			};

			for (const chat of chats) {
				let creator: any = null;
				if (typeof chat.creator_info === 'string') {
					try {
						creator = JSON.parse(chat.creator_info);
					} catch { }
				} else if (chat.creator_info && typeof chat.creator_info === 'object') {
					creator = chat.creator_info;
				}
				if (creator?.id) {
					upsert(creator.id, parseCreatorOrParticipantMore(creator));
				}

				const p = chat.participant;
				if (p?.id) {
					upsert(p.id, parseCreatorOrParticipantMore(p));
				}

				const sender = chat.last_message?.sender;
				if (sender?.id) {
					const iso = sender.findByKey('is_online');
					const lso = sender.findByKey('last_seen');
					if (typeof iso === 'boolean' || (lso != null && typeof lso === 'number')) {
						upsert(sender.id, {
							is_online: typeof iso === 'boolean' ? iso : false,
							last_seen: lso != null && typeof lso === 'number' ? lso : null,
						});
					}
				}
			}
		});
	}

	mergeFromMembers(members: { user?: { id?: string; is_online?: boolean; last_seen?: number | null; }; }[]) {
		if (!Array.isArray(members) || members.length === 0) return;
		const currentUserId = profileStore.profile?.id;

		runInAction(() => {
			const map = this.statusByUserId ?? new Map();
			if (!this.statusByUserId) this.statusByUserId = map;

			for (const m of members) {
				const u = m?.user;
				if (!u?.id) continue;
				if (u.id === currentUserId) continue;
				if (map.has(u.id)) continue;
				const is_online = Boolean(u.is_online);
				const last_seen =
					u.last_seen != null && typeof u.last_seen === 'number' && u.last_seen > 0
						? u.last_seen
						: null;
				const prev = map.get(u.id);
				if (prev && prev.is_online === is_online && prev.last_seen === last_seen) continue;
				map.set(u.id, { is_online, last_seen });
			}
		});
	}
}

export const onlineServices = new OnlineServices();
