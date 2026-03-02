import { showNotify } from '@core/config/const';
import { MenuItemProps } from '@core/ui/HoldMenu/components/menu/types';
import { formatEditedAt } from '@lib/date';
import { navigate } from '@lib/navigation';
import { chatsInteractionsStore } from '@modules/chat/stores/chats';
import { messageInteractionsStore } from '@modules/chat/stores/message';
import type { GetMessageMessage } from '@modules/chat/stores/message';
import { profileStore } from '@modules/user/stores/profile';
import { TFunction } from 'i18next';

export type MessageContextMenuParams = {
	message: GetMessageMessage | null;
	profile: { id: string } | null;
	selectedChat: { id: string; type?: string } | null;
	params: Record<string, unknown>;
};

/** Build menu items for a specific message (e.g. for HoldItem). Handlers get message from closure, no store read. */
export const getMessageContextMenuActionsForMessage = (
	t: TFunction,
	{ message: msg, profile, selectedChat, params }: MessageContextMenuParams
): MenuItemProps[] => {
	const {
		isSelectingMessages: { setIsSelectingMessages },
		deleteMessagesSheet: { setDeleteMessagesSheet },
		toggleMessageSelection,
		replyMessageHandler,
		editMessageHandler,
		updateSharedValue
	} = messageInteractionsStore;

	const senderId = msg?.sender_id ?? (msg as any)?.sender?.id;
	const isOwnMessage = !!profile?.id && !!senderId && String(senderId) === String(profile.id);

	const editDate = (msg as any)?.edit_date;
	const editedAtLabel = typeof editDate === 'number' && editDate > 0
		? { text: `${t('message_edited_at')} ${formatEditedAt(editDate)}`, isLabel: true as const }
		: null;

	const onPressSelect = () => {
		if (msg?.id) toggleMessageSelection(msg.id);
		setIsSelectingMessages(true);
		updateSharedValue(true);
	};

	return [
		...(editedAtLabel ? [editedAtLabel] : []),
		{
			icon: "reply",
			text: t("contextMenu_reply"),
			onPress: () => replyMessageHandler(msg)
		},
		...(isOwnMessage ? [{
			icon: "create" as const,
			text: t("contextMenu_edit"),
			onPress: () => editMessageHandler(msg ?? null)
		}] : []),
		{
			icon: "content-copy",
			text: t("contextMenu_copy"),
			onPress: () => {
				showNotify("system", { message: "Вы не добавили actions" });
			}
		},
		{
			icon: "push-pin",
			text: t("contextMenu_pin"),
			onPress: () => {
				showNotify("system", { message: "Вы не добавили actions" });
			}
		},
		{
			icon: "link",
			text: t("contextMenu_copy_link"),
			onPress: () => {
				showNotify("system", { message: "Вы не добавили actions" });
			}
		},
		{
			icon: "forward",
			text: t("contextMenu_forward"),
			onPress: () => {
				showNotify("system", { message: "Вы не добавили actions" });
			}
		},
		{
			icon: "report",
			text: t("contextMenu_report"),
			onPress: () => {
				showNotify("system", { message: "Вы не добавили actions" });
			}
		},
		{
			icon: "delete",
			text: t("contextMenu_delete"),
			isDestructive: true,
			onPress: () => {
				if (msg?.id) {
					setTimeout(() => {
						setDeleteMessagesSheet({ isOpen: true, messageIds: [msg.id] });
					}, 0);
				}
			}
		},
		{
			icon: "select-all",
			text: t("contextMenu_select"),
			isBottom: true,
			onPress: onPressSelect
		}
	];
};

export const getMessageContextMenuActions = (t: TFunction): MenuItemProps[] => {
	const {
		selectedMessage: { selectedMessage },
		isSelectingMessages: { setIsSelectingMessages },
		selectedMessageForContextMenu: { selectedMessageForContextMenu },
		deleteMessagesSheet: { setDeleteMessagesSheet },
		toggleMessageSelection,
		replyMessageHandler,
		editMessageHandler,
		updateSharedValue
	} = messageInteractionsStore;
	const { profile } = profileStore;

	const msg = selectedMessageForContextMenu ?? selectedMessage;
	const senderId = msg?.sender_id ?? (msg as any)?.sender?.id;
	const isOwnMessage = !!profile?.id && !!senderId && String(senderId) === String(profile.id);

	const editDate = (msg as any)?.edit_date;
	const editedAtLabel = typeof editDate === 'number' && editDate > 0
		? { text: `${t('message_edited_at')} ${formatEditedAt(editDate)}`, isLabel: true as const }
		: null;

	const onPressSelect = () => {
		const messageId = (selectedMessage as any)?.id;
		if (messageId) toggleMessageSelection(messageId);
		setIsSelectingMessages(true);
		updateSharedValue(true);
	};

	const items: MenuItemProps[] = [
		...(editedAtLabel ? [editedAtLabel] : []),
		{
			icon: "reply",
			text: t("contextMenu_reply"),
			onPress: () => replyMessageHandler(msg)
		},
		...(isOwnMessage ? [{
			icon: "create" as const,
			text: t("contextMenu_edit"),
			onPress: () => {
				const current = messageInteractionsStore.selectedMessageForContextMenu.selectedMessageForContextMenu
					?? messageInteractionsStore.selectedMessage.selectedMessage;
				editMessageHandler(current ?? null);
			}
		}] : []),
		{
			icon: "content-copy",
			text: t("contextMenu_copy"),
			onPress: () => {
				showNotify("system", { message: "Вы не добавили actions" });
			}
		},
		{
			icon: "push-pin",
			text: t("contextMenu_pin"),
			onPress: () => {
				showNotify("system", { message: "Вы не добавили actions" });
			}
		},
		{
			icon: "link",
			text: t("contextMenu_copy_link"),
			onPress: () => {
				showNotify("system", { message: "Вы не добавили actions" });
			}
		},
		{
			icon: "forward",
			text: t("contextMenu_forward"),
			onPress: () => {
				showNotify("system", { message: "Вы не добавили actions" });
			}
		},
		{
			icon: "report",
			text: t("contextMenu_report"),
			onPress: () => {
				showNotify("system", { message: "Вы не добавили actions" });
			}
		},
		{
			icon: "delete",
			text: t("contextMenu_delete"),
			isDestructive: true,
			onPress: () => {
				const msg = messageInteractionsStore.selectedMessageForContextMenu.selectedMessageForContextMenu;
				if (msg?.id) {
					const messageIds = [msg.id];
					setTimeout(() => {
						setDeleteMessagesSheet({ isOpen: true, messageIds });
					}, 0);
				}
			}
		},
		{
			icon: "select-all",
			text: t("contextMenu_select"),
			isBottom: true,
			onPress: onPressSelect
		}
	];

	return items;
};

export const getMemberContextMenuActions = (t: TFunction, user: Record<string, any>): MenuItemProps[] => {
	const { onRaiseMemberHandler, onRestrictMemberHandler } = chatsInteractionsStore;

	return [
		{
			text: t("contextMenu_view_profile"),
			onPress: () => {
				navigate("UserPage", { userId: user.findByKey('id') });
			}
		},
		{
			text: t("contextMenu_write_message"),
			onPress: () => {
				navigate("Chat", { chatId: user.findByKey('user_chat_id') || undefined, tag: user.findByKey('tag') });
			}
		},
		{
			text: t("contextMenu_raise"),
			onPress: onRaiseMemberHandler
		},
		{
			text: t("contextMenu_restrict"),
			onPress: onRestrictMemberHandler
		},
		{
			text: t("contextMenu_delete"),
			isDestructive: true,
			onPress: () => {
				showNotify("system", { message: "Удалить" });
			},
		}
	];
};