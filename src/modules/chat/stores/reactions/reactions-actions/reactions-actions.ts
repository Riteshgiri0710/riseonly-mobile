import { makeAutoObservable } from 'mobx';
import { ProtoAddReactionRequest, ProtoAddReactionResponse, ProtoRemoveReactionRequest, ProtoRemoveReactionResponse } from './types';
import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';
import { mobxSaiWs } from '@lib/mobx-toolbox/mobxSaiWs';
import { profileStore } from '@modules/user/stores/profile';
import { reactionsServicesStore } from '../reactions-services/reactions-services';
import { ChatInfo } from '../../chats';
import { messageInteractionsStore } from '../../message';
import { getServerId } from '@core/utils/functions';
import { checker } from '@lib/helpers';
import type { GetMessageMessage, MarkReactionsAsReadBody, MarkReactionsAsReadResponse, ProtoReactionSummary } from '../../message/message-actions/types';

const PATCH_PATHS = ['reactions', 'reacted_by', 'has_reactions', 'reactions_unreaded'] as const;

function buildAddPatch(body: ProtoAddReactionRequest, currentItem: GetMessageMessage, ctx: { chat: ChatInfo; profile: { id: string; name?: string; tag?: string; more?: { logo?: string; }; }; }) {
	const reactions = [...(currentItem.reactions ?? [])];
	const reactedBy = [...(currentItem.reacted_by ?? [])];
	const existing = reactions.find((r) => r.reaction === body.reaction);
	if (existing) {
		existing.count += 1;
		existing.reacted_by_you = true;
	} else {
		reactions.push({ reaction: body.reaction, count: 1, reacted_by_you: true });
	}
	const created_at = Math.floor(Date.now() / 1000);
	reactedBy.push({
		reaction: body.reaction,
		created_at,
		sender: { id: ctx.profile.id, name: ctx.profile.name, tag: ctx.profile.tag, more: ctx.profile.more },
		chat_id: ctx.chat.id,
		_temp: true,
	} as any);
	return { reactions, reacted_by: reactedBy, has_reactions: true, reactions_unreaded: false };
}

function buildRemovePatch(body: ProtoRemoveReactionRequest, currentItem: GetMessageMessage) {
	const reactions = [...(currentItem.reactions ?? [])];
	const reactedBy = [...(currentItem.reacted_by ?? [])];
	const nextReactedBy = reactedBy.filter((r) => !(r.reaction === body.reaction && r.sender?.id === body.user_id));
	const actuallyRemoved = nextReactedBy.length < reactedBy.length;
	const nextReactions = reactions.map((r) => {
		if (r.reaction !== body.reaction) return r;
		if (!actuallyRemoved) return r;
		const count = Math.max(0, r.count - 1);
		return count === 0 ? null : { ...r, count, reacted_by_you: false };
	}).filter(Boolean) as ProtoReactionSummary[];
	return { reactions: nextReactions, reacted_by: nextReactedBy, has_reactions: nextReactions.length > 0 };
}

function buildRollbackSnapshot(_body: any, currentItem: GetMessageMessage) {
	return {
		reactions: (currentItem.reactions ?? []).map((r) => ({ ...r })),
		reacted_by: (currentItem.reacted_by ?? []).map((r) => ({ ...r, sender: r.sender ? { ...r.sender } : undefined })),
		has_reactions: currentItem.has_reactions ?? false,
		reactions_unreaded: currentItem.reactions_unreaded ?? false,
	};
}

function buildConfirmPatch(body: { user_id?: string; reaction?: string; }, currentItem: any) {
	const reacted_by = (currentItem.reacted_by ?? []).map((r: any) => {
		if (!r._temp || r.reaction !== body.reaction || r.sender?.id !== body.user_id) return r;
		const { _temp, ...rest } = r;
		return rest;
	});
	return { reacted_by };
}

class ReactionsActionsStore {
	constructor() { makeAutoObservable(this); }

	addReaction: MobxSaiWsInstance<ProtoAddReactionResponse> = {};

	addReactionAction = async (chat: ChatInfo, reaction: string, messageOrFromContext?: GetMessageMessage) => {
		messageInteractionsStore.setSkipGetMessagesOnFocus();
		const { getMyProfile } = profileStore;
		const { selectedMessageForContextMenu: { selectedMessageForContextMenu } } = messageInteractionsStore;
		const { addReactionSuccessHandler, addReactionErrorHandler } = reactionsServicesStore;

		const message = messageOrFromContext ?? selectedMessageForContextMenu ?? null;
		checker(message, '[addReactionAction] no message (pass message or set selectedMessageForContextMenu)', true);
		const profile = await getMyProfile();
		const user_id = profile?.id;
		checker(user_id, '[addReactionAction] no profile id', true);

		const messageId = getServerId(message);
		const body: ProtoAddReactionRequest = { user_id: user_id!, message_id: messageId, reaction };

		this.addReaction = mobxSaiWs(body, {
			id: ['addReaction', user_id!, messageId, reaction],
			debounceMs: 1500,
			fetchIfHaveData: true,
			fetchIfPending: false,
			service: 'message',
			method: 'add_reaction',
			onSuccess: addReactionSuccessHandler,
			onError: addReactionErrorHandler,
			optimisticUpdate: {
				enabled: true,
				updateCache: 'both',
				patchInPlace: true,
				targetCacheId: `getMessages-null-null-${chat.id}`,
				matchIdKey: 'id',
				matchIdFromRequest: (b) => b.message_id,
				patchPaths: [...PATCH_PATHS],
				createPatch: (b, cur) => buildAddPatch(b, cur, { chat, profile: profile! }),
				createRollbackSnapshot: buildRollbackSnapshot,
				confirmPatch: buildConfirmPatch,
				context: { chat, profile: profile!, message },
			},
		});
	};

	removeReaction: MobxSaiWsInstance<ProtoRemoveReactionResponse> = {};

	removeReactionAction = async (chat: ChatInfo, reaction: string, messageOrFromContext?: GetMessageMessage) => {
		messageInteractionsStore.setSkipGetMessagesOnFocus();
		const { getMyProfile } = profileStore;
		const { selectedMessageForContextMenu: { selectedMessageForContextMenu } } = messageInteractionsStore;
		const { removeReactionSuccessHandler, removeReactionErrorHandler } = reactionsServicesStore;

		const message = messageOrFromContext ?? selectedMessageForContextMenu ?? null;
		checker(message, '[removeReactionAction] no message (pass message or set selectedMessageForContextMenu)', true);
		const profile = await getMyProfile();
		const user_id = profile?.id;
		checker(user_id, '[removeReactionAction] no profile id', true);

		const messageId = getServerId(message);
		const body: ProtoRemoveReactionRequest = { user_id: user_id!, message_id: messageId, reaction };

		this.removeReaction = mobxSaiWs(body, {
			id: ['removeReaction', user_id!, messageId, reaction],
			debounceMs: 1500,
			fetchIfHaveData: true,
			fetchIfPending: false,
			service: 'message',
			method: 'remove_reaction',
			onSuccess: removeReactionSuccessHandler,
			onError: removeReactionErrorHandler,
			optimisticUpdate: {
				enabled: true,
				updateCache: 'both',
				patchInPlace: true,
				targetCacheId: `getMessages-null-null-${chat.id}`,
				matchIdKey: 'id',
				matchIdFromRequest: (b) => b.message_id,
				patchPaths: [...PATCH_PATHS],
				createPatch: (b, cur) => buildRemovePatch(b, cur),
				createRollbackSnapshot: buildRollbackSnapshot,
				context: { chat, profile: profile!, message },
			},
		});
	};

	// MARK REACTIONS AS READ (max 100 message_ids; onSuccess/onError in reactions-services)

	static readonly MARK_REACTIONS_AS_READ_MAX_IDS = 100;

	markReactionsAsRead: MobxSaiWsInstance<MarkReactionsAsReadResponse> = {};

	markReactionsAsReadAction = async (chatId: string, messageIds: string[]) => {
		const { getMyProfile } = profileStore;
		const { markReactionsAsReadSuccessHandler, markReactionsAsReadErrorHandler, subtractUnreadReactionsOptimistic } = reactionsServicesStore;

		if (!messageIds?.length || !chatId) return;

		const profile = await getMyProfile();
		const user_id = profile?.id;
		if (!user_id) return;

		const limitedIds = messageIds.slice(0, ReactionsActionsStore.MARK_REACTIONS_AS_READ_MAX_IDS);

		subtractUnreadReactionsOptimistic(chatId, limitedIds, user_id);

		const body: MarkReactionsAsReadBody = {
			user_id,
			message_ids: limitedIds,
		};

		this.markReactionsAsRead = mobxSaiWs(body, {
			id: `markReactionsAsRead-${user_id}-${[...limitedIds].sort().join(',')}`,
			service: 'message',
			method: 'mark_reactions_as_read',
			fetchIfHaveData: true,
			fetchIfPending: true,
			needStates: false,
			onSuccess: (data: MarkReactionsAsReadResponse) => markReactionsAsReadSuccessHandler(data, chatId, limitedIds.length),
			onError: markReactionsAsReadErrorHandler,
		});
	};
}

export const reactionsActionsStore = new ReactionsActionsStore();
