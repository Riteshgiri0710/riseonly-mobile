import { showNotify, todoNotify } from '@core/config/const';
import { PrivatePublicType } from '@core/config/types';
import { CheckTagExistResponse } from '@core/stores/tag';
import { checker } from '@lib/helpers';
import { useMobxForm } from '@lib/mobx-toolbox/useMobxForm';
import { goBack, navigate } from '@lib/navigation';
import Clipboard from '@react-native-clipboard/clipboard';
import { routeInteractions } from '@stores/global-interactions';
import { TFunction } from 'i18next';
import { makeAutoObservable, runInAction } from 'mobx';
import { MobxUpdateInstance, mobxDebouncer, mobxState } from 'mobx-toolbox';
import { MutableRefObject } from 'react';
import { GestureResponderEvent, NativeSyntheticEvent, ScrollView, TextInputChangeEventData } from 'react-native';
import { chatSettingsSchema, createChannelSchema, createChatLinkSchema, createGroupSchema, editChatLinkSchema } from 'src/modules/chat/shared/schemas/chatSchema';
import { messageActionsStore } from 'src/modules/chat/stores/message';
import { themeStore } from 'src/modules/theme/stores';
import { chatsActionsStore } from '../chats-actions/chats-actions';
import { ChatInfo, ProtoGetChatPreviewByInviteLinkResponse, ProtoInviteLink } from '../chats-actions/types';

class ChatsInteractionsStore {
	constructor() { makeAutoObservable(this); }

	isLoading: boolean = false;
	setIsLoading = (value: boolean) => this.isLoading = value;

	selectedChat: ChatInfo | null = null;
	setSelectedChat = (chat: ChatInfo | null) => this.selectedChat = chat || null;
	selectChat = (chat: ChatInfo | null) => this.selectedChat = chat;

	notificationPendingPayload: { chatId: string; messageId?: string; } | null = null;
	setNotificationPendingPayload = (v: { chatId: string; messageId?: string; } | null) => {
		this.notificationPendingPayload = v;
	};

	selectedLink: ProtoInviteLink | null = null;
	setSelectedLink = (link: ProtoInviteLink | null) => this.selectedLink = link || null;

	channelChatType = mobxState<PrivatePublicType>('public')("channelChatType");
	forwardInChatEnabled = mobxState(false)("forwardInChatEnabled");

	groupChatType = mobxState<PrivatePublicType>('private')("groupChatType");
	forwardInGroupEnabled = mobxState(false)("forwardInGroupEnabled");

	chatMediaOpen = mobxState(false)("chatMediaOpen");

	// REFS

	allChatsScrollRef: MutableRefObject<ScrollView | null> | null = null;
	setAllChatsScrollRef = (ref: MutableRefObject<ScrollView | null>) => this.allChatsScrollRef = ref;

	// FORMS

	createChannelForm = useMobxForm({
		title: "",
		description: "",
		tag: "",
		image: "",
	}, createChannelSchema, {
		instaValidate: true,
		resetErrIfNoValue: false,
		inputResetErr: false,
	});

	createGroupForm = useMobxForm({
		title: "",
		description: "",
		image: "",
	}, createGroupSchema, {
		instaValidate: true,
		resetErrIfNoValue: false,
		inputResetErr: false,
	});

	chatSettingsForm = useMobxForm({
		title: "",
		description: "",
		image: "",
	}, chatSettingsSchema, {
		instaValidate: true,
		resetErrIfNoValue: false,
		inputResetErr: false,
	});

	createChatLinkForm = useMobxForm({
		name: "",
		creates_join_request: false,
	}, createChatLinkSchema, {
		instaValidate: true,
		resetErrIfNoValue: false,
		inputResetErr: false,
	});

	editChatLinkForm = useMobxForm({
		name: "",
		expires_at: 0,
		usage_limit: 0,
		creates_join_request: false,
	}, editChatLinkSchema, {
		instaValidate: true,
		resetErrIfNoValue: false,
		inputResetErr: false,
	});

	// SHEETS

	isCreateChatSheetOpen = mobxState(false)("isCreateChatSheetOpen");
	isCreateGroupSheetOpen = mobxState(false)("isCreateGroupSheetOpen");
	isCreateChatLinkOpen = mobxState(false)("isCreateChatLinkOpen");
	isEditChatLinkOpen = mobxState(false)("isEditChatLinkOpen");
	isUnlinkChatOpen = mobxState(false)("isUnlinkChatOpen");
	isRaisingMemberOpen = mobxState(false)("isRaisingMemberOpen");
	isRestrictingMemberOpen = mobxState(false)("isRestrictingMemberOpen");
	isPreviewInviteLinkChatOpen = mobxState(false)("isPreviewInviteLinkChatOpen");

	createChatSheetCloseSignal = mobxState(false)("createChatSheetCloseSignal");
	createChatLinkCloseSignal = mobxState(false)("createChatLinkCloseSignal");
	editChatLinkCloseSignal = mobxState(false)("editChatLinkCloseSignal");
	unlinkChatCloseSignal = mobxState(false)("unlinkChatCloseSignal");
	raisingMemberCloseSignal = mobxState(false)("raisingMemberCloseSignal");
	restrictingMemberCloseSignal = mobxState(false)("restrictingMemberCloseSignal");
	previewInviteLinkChatCloseSignal = mobxState(false)("previewInviteLinkChatCloseSignal");

	onCreateChatPress = () => this.isCreateChatSheetOpen.setIsCreateChatSheetOpen(true);

	// TSX HANDLERS

	onChatPress = (chat: ChatInfo) => {
		this.selectedChat = chat;
		navigate("Chat", { chatId: chat.id, tag: chat.tag, selectedChat: chat });
	};

	openChatWithScrollToReaction = (chat: ChatInfo) => {
		this.selectedChat = chat;
		const raw = chat.unread_info?.reactions?.reactions?.[0];
		const scrollToReactionMessageId = raw ? (raw.includes(':') ? raw.split(':')[0] : raw) : undefined;
		navigate("Chat", { chatId: chat.id, tag: chat.tag, selectedChat: chat, ...(scrollToReactionMessageId && { scrollToReactionMessageId }) });
	};

	openChatWithScrollToMention = (chat: ChatInfo) => {
		this.selectedChat = chat;
		const scrollToMentionMessageId = chat.unread_info?.mentions?.message_ids?.[0];
		navigate("Chat", { chatId: chat.id, tag: chat.tag, selectedChat: chat, ...(scrollToMentionMessageId && { scrollToMentionMessageId }) });
	};

	onCopyLinkHandler = (t: TFunction) => {
		const selectedLink = this.selectedLink;
		checker(selectedLink, "[onCopyLinkHandler]: no selected link");
		Clipboard.setString(selectedLink.link);
		showNotify("system", { message: t("link_copied_to_clipboard") });
		this.editChatLinkCloseSignal.setEditChatLinkCloseSignal(true);
	};

	onShareLinkHandler = (t: TFunction) => {
		todoNotify();
	};

	// TABS

	chatProfileTab = mobxState(0)("chatProfileTab");
	tabScrollPosition = mobxState(0)("tabScrollPosition");
	openedChatProfileTabPage = mobxState(0)("openedChatProfileTabPage");
	isTabScrollEnabled = mobxState(false)("isTabScrollEnabled");
	isMainScrollEnabled = mobxState(true)("isMainScrollEnabled");
	isReachedTabsArea = mobxState(false)("isReachedTabsArea");
	scrollMomentum = mobxState(0)("scrollMomentum");
	tabsAreaY = mobxState(0)("tabsAreaY");

	handleParentScrollEnd = (velocityY: number) => {
		this.scrollMomentum.setScrollMomentum(velocityY);
		if (this.isReachedTabsArea.isReachedTabsArea && velocityY > 0) {
			this.isTabScrollEnabled.setIsTabScrollEnabled(true);
		}
	};

	checkIfReachedTabsArea = (scrollY: number) => {
		const { safeAreaWithContentHeight: { safeAreaWithContentHeight } } = themeStore;

		const reachedTabs = scrollY >= (this.tabsAreaY.tabsAreaY - safeAreaWithContentHeight - 160);
		this.isReachedTabsArea.setIsReachedTabsArea(reachedTabs);
		if (reachedTabs) {
			this.isTabScrollEnabled.setIsTabScrollEnabled(true);
		}
	};

	handleSwap = (index: number) => {
		this.openedChatProfileTabPage.setOpenedChatProfileTabPage(index);
	};

	// INPUT

	chatsInputText = mobxState("")("chatsInputText");
	isChatTyping = mobxState(false)("isChatTyping");

	handleChangeChatsInputText = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
		this.chatsInputText.setChatsInputText(e.nativeEvent.text);

		mobxDebouncer.debouncedAction(
			"handleChangeChatsInputText",
			() => todoNotify(),
			2000
		);
	};

	onChangeChatInput = (text: string) => {
		const { typingAction } = messageActionsStore;
		const { isChatTyping: { isChatTyping, setIsChatTyping } } = this;

		runInAction(() => {
			setIsChatTyping(true);
			if (!isChatTyping) typingAction(true);
		});

		mobxDebouncer.debouncedAction(
			"onChangeChatInput",
			() => {
				runInAction(() => {
					setIsChatTyping(false);
					typingAction(false);
				});
			},
			1500
		);
	};

	// TABS

	chatsTab = mobxState(0)("chatsTab");
	chatsTabScrollPosition = mobxState(0)("chatsTabScrollPosition");

	// UPDATERS

	chatUpdater: MobxUpdateInstance<ChatInfo> | null = null;
	setChatUpdater = (updater: MobxUpdateInstance<ChatInfo>) => this.chatUpdater = updater;

	// HANDLERS

	// TAG HANDLERS

	checkTagSuccessHandler = (data: CheckTagExistResponse, t: TFunction) => {
		if (data.exists) {
			this.createChannelForm.setError("tag", t("tag_already_exists"));
			return;
		}
		this.createChannelForm.setError("tag", "");
	};

	// CHAT HANDLERS

	onChatPressHandler = (item: ChatInfo, chatCallback?: (item: ChatInfo) => void) => {
		if (chatCallback) {
			chatCallback(item);
			return;
		}

		this.onChatPress(item);
	};

	toChatHandler = (chat?: ChatInfo) => {
		const { getPreLastRoute } = routeInteractions;

		checker(chat, "[toChatHandler]: chat is not set");
		if (!chat) return;

		const prePrevRoute = getPreLastRoute()?.name;
		const user = chat.participant;

		if (prePrevRoute === "Chat") {
			goBack();
			return;
		}

		const chatId = chat?.type === "FAVOURITES" ? chat?.id : user?.user_chat_id;

		checker(chatId, "[toChatHandler]: chatId is required");

		navigate(
			"Chat",
			{ chatId: chatId }
		);
	};

	// HOLD CONTEXT MENU

	itemCordinates = mobxState<{ x: number, y: number; }>({ x: 0, y: 0 })("itemCordinates");
	chatPreviewOpen = mobxState(false)("chatPreviewOpen");

	onChatLongPressHandler = (e: GestureResponderEvent) => {
		const { safeAreaWithContentHeight: { safeAreaWithContentHeight } } = themeStore;
		const {
			itemCordinates: { setItemCordinates },
			chatPreviewOpen: { setChatPreviewOpen }
		} = this;

		runInAction(() => {
			setItemCordinates({ x: 0, y: safeAreaWithContentHeight + 30 });
			setChatPreviewOpen(true);
		});
	};

	onChatPreviewCloseHandler = () => {
		this.chatPreviewOpen.setChatPreviewOpen(false);
	};

	onCreateLinkHandler = (t: TFunction) => {
		const { inviteLinks } = chatsActionsStore;

		if (inviteLinks?.data?.invite_links?.length >= 10) {
			showNotify("system", { message: t("max_links_reached") });
			return;
		}

		this.isCreateChatLinkOpen.setIsCreateChatLinkOpen(true);
	};

	onEditLinkHandler = (link: ProtoInviteLink) => {
		this.setSelectedLink(link);
		this.isEditChatLinkOpen.setIsEditChatLinkOpen(true);
	};

	// PRE DATA

	changeChatTypeHandler = async (isPublic: boolean) => {
		const { editChatAction } = chatsActionsStore;

		checker(this.selectedChat, "[changeChatTypeHandler]: no selected chat");

		editChatAction({ is_public: isPublic });
	};

	createChatLinkHandler = () => {
		const { createInviteLinkAction } = chatsActionsStore;
		const { createChatLinkCloseSignal: { setCreateChatLinkCloseSignal } } = this;

		setCreateChatLinkCloseSignal(true);
		createInviteLinkAction();
	};

	deleteChatLinkHandler = () => {
		const { revokeInviteLinkAction } = chatsActionsStore;
		const { editChatLinkCloseSignal: { setEditChatLinkCloseSignal } } = this;

		setEditChatLinkCloseSignal(true);
		revokeInviteLinkAction();
	};

	editChatLinkHandler = () => {
		const { editInviteLinkAction } = chatsActionsStore;
		const { editChatLinkCloseSignal: { setEditChatLinkCloseSignal } } = this;

		setEditChatLinkCloseSignal(true);
		editInviteLinkAction();
	};

	unlinkChatHandler = () => {
		const { isUnlinkChatOpen: { setIsUnlinkChatOpen } } = this;

		setIsUnlinkChatOpen(true);
	};

	unlinkChatConfirmHandler = () => {
		const { unlinkChatCloseSignal: { setUnlinkChatCloseSignal } } = this;
		setUnlinkChatCloseSignal(true);
	};

	onRaiseMemberHandler = () => {
		const { isRaisingMemberOpen: { setIsRaisingMemberOpen } } = this;
		setIsRaisingMemberOpen(true);
	};

	onRaiseMemberConfirmHandler = () => {
		const { raisingMemberCloseSignal: { setRaisingMemberCloseSignal } } = this;
		setRaisingMemberCloseSignal(true);
	};

	onRestrictMemberHandler = () => {
		const { isRestrictingMemberOpen: { setIsRestrictingMemberOpen } } = this;
		setIsRestrictingMemberOpen(true);
	};

	onRestrictMemberConfirmHandler = () => {
		const { restrictingMemberCloseSignal: { setRestrictingMemberCloseSignal } } = this;
		setRestrictingMemberCloseSignal(true);
	};

	onInviteLinkPressHandler = (url: string) => {
		const { inviteLinkPreviewAction } = chatsActionsStore;
		inviteLinkPreviewAction(url);
	};

	onAcceptInviteOrSendJoinRequestHandler = (previewLink: ProtoGetChatPreviewByInviteLinkResponse) => {
		const { acceptInviteOrSendJoinRequestAction } = chatsActionsStore;
		const { previewInviteLinkChatCloseSignal: { setPreviewInviteLinkChatCloseSignal } } = this;

		acceptInviteOrSendJoinRequestAction(previewLink);
		setPreviewInviteLinkChatCloseSignal(true);
	};
}

export const chatsInteractionsStore = new ChatsInteractionsStore();
