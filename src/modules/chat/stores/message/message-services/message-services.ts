import { showNotify } from '@core/config/const';
import { AuthWsResponse } from '@core/stores/ws/types';
import { MediaItem } from '@core/ui';
import { getCurrentRoute, setParams } from '@core/lib/navigation';
import i18next from 'i18next';
import { logger } from '@lib/helpers';
import { FileUploadState, SaiFile, globalWebSocketManager } from '@lib/mobx-toolbox/mobxSaiWs';
import { formatId } from '@lib/text';
import { makeAutoObservable, runInAction } from 'mobx';
import { useMobxUpdate } from 'mobx-toolbox';
import { ErrorResponse } from 'react-router-native';
import { ChatInfo, chatsInteractionsStore, chatsServicesStore } from 'src/modules/chat/stores/chats';
import { profileServiceStore, profileStore } from 'src/modules/user/stores/profile';
import { getServerId } from '@utils/functions';
import { messageActionsStore } from '../message-actions/message-actions';
import { CreateMessageBody, CreateMessageResponse, GetMessageMessage, GetMessagesResponse, ProtoGetMediaMessagesResponse, ReplyToMessage, TypingResponse } from '../message-actions/types';
import { messageInteractionsStore } from '../message-interactions/message-interactions';

class MessageServicesStore {
   constructor() { makeAutoObservable(this, {}, { deep: false }); }

   cloneMsgText = "";
   cloneRawMsgText = "";

   // MEDIA PICKER HANDLERS

   uploadChatMedia: SaiFile[] = [];
   setUploadChatMedia = (file: MediaItem[]) => {
      if (!file || file.length === 0) {
         this.uploadChatMedia = [];
         return;
      }
      const files = file.map(t => t?.file).filter(t => t !== undefined) as SaiFile[];
      if (files.length === 0) return;
      this.uploadChatMedia = files;
   };

   // ================= TEMP DATA =====================

   getCreateMessageTempData = async (tempId: string) => {
      const { getUserProfile } = profileServiceStore;
      const { createChatTempData } = chatsServicesStore;

      const p = await getUserProfile();

      if (!p) return;

      const {
         msgRawText: { msgRawText },
         msgText: { msgText }
      } = messageInteractionsStore;

      this.cloneRawMsgText = msgRawText;
      this.cloneMsgText = msgText;

      const res: GetMessageMessage = {
         chat: {} as ChatInfo,
         id: tempId,
         sender_id: p.id,
         sender_name: p.name,
         content: msgText, // TODO: Заменить когда отредачишь редактор
         original_content: msgText,
         created_at: Math.floor(Date.now() / 1000),
         timestamp: Math.floor(Date.now() / 1000),
         isTemp: true,
         content_type: "text",
         reply_to: null,
         reacted_by: [],
         reactions: [],
         is_read: false,
         sender: {
            id: p.id,
            created_at: p.created_at,
            updated_at: p.updated_at,
            phone: p.phone,
            name: p.name,
            is_premium: p.is_premium,
            tag: p.tag,
            user_chat_id: p.user_chat_id,
            customer_id: p.customer_id,
            gender: p.gender,
            more_id: p.more_id,
            role: p.role,
            is_blocked: p.is_blocked,
            more: p.more,
            posts_count: 0,
            friends_count: 0,
            subs_count: 0,
            subscribers_count: 0,
            friend_request_id: null,
            is_subbed: null,
            is_friend: null
         },
         is_system_message: false,
         has_attachments: false,
         is_forwarded: false,
         is_reply: false,
         has_reactions: false,
         is_pinned: false
      };

      return res;
   };

   addMessageToChat = (data: GetMessageMessage) => {
      const { upChatOrAddToTop } = chatsServicesStore;

      upChatOrAddToTop(data);

      if (!messageActionsStore.messages.data) return;

      const { selectedChat } = chatsInteractionsStore;
      const currentChatId = messageActionsStore.messages.data.chat_id || selectedChat?.id;

      if (data.chat_id && currentChatId && data.chat_id !== currentChatId) return;

      const chatId = data.chat_id || currentChatId || "empty";
      const cacheId = `getMessages-null-null-${chatId}`;

      messageActionsStore.messages?.saiUpdater?.(
         null,
         null,
         (prev: GetMessageMessage[]) => {
            if (!prev || !Array.isArray(prev)) return prev;
            return [data, ...prev];
         },
         "id",
         cacheId,
         "both"
      );
   };

   // OPTIMISTIC UPDATE HANDLERS

   createOptimisticMessageData = (requestBody: CreateMessageBody, context?: { tempId: string; fileStates?: FileUploadState[]; }) => {
      const profile = profileStore.profile;
      if (!profile) return null;

      let content_type = requestBody.content_type || "text";
      if (this.uploadChatMedia.length > 0) {
         const firstType = context?.fileStates?.[0]?.media_type;
         content_type = firstType === "video" ? "video" : "image";
      } else if (requestBody.content_type === "sticker" && requestBody.media_items?.length) {
         content_type = "sticker";
      }

      const chatId = requestBody.chat_id || requestBody.user_chat_id;
      const { selectedChat } = chatsInteractionsStore;
      const cachedData = messageActionsStore.messages?.data as GetMessagesResponse | undefined;
      const chat: ChatInfo =
         selectedChat && selectedChat.id === chatId
            ? selectedChat
            : cachedData?.messages?.[0]?.chat ?? ({ id: chatId ?? '' } as ChatInfo);

      let reply_to: ReplyToMessage | null = null;
      const replyToId = requestBody.reply_to_id;
      if (replyToId && cachedData?.messages?.length) {
         const repliedMessage = cachedData.messages.find(
            (m: GetMessageMessage) => m.id === replyToId || (m as any).server_id === replyToId
         );
         if (repliedMessage?.sender) {
            reply_to = {
               caption: (repliedMessage as any).caption ?? '',
               content: repliedMessage.content ?? '',
               content_type: repliedMessage.content_type ?? 'text',
               created_at: repliedMessage.created_at,
               media_items: repliedMessage.media_items ?? [],
               message_id: getServerId(repliedMessage) || repliedMessage.id,
               sender: repliedMessage.sender,
               sender_id: repliedMessage.sender_id,
            };
         }
      }

      const temp: GetMessageMessage = {
         id: context?.tempId || `temp_${Date.now()}`,
         chat_id: chatId,
         chat,
         reply_to,
         reacted_by: [],
         reactions: [],
         is_read: true,
         sender_id: profile.id,
         sender_name: profile.name,
         content: requestBody.content,
         original_content: requestBody.original_content,
         created_at: Math.floor(Date.now() / 1000),
         timestamp: Math.floor(Date.now() / 1000),
         isTemp: true,
         content_type,
         fileUploadStates: context?.fileStates || [],
         sender: {
            id: profile.id,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            phone: profile.phone,
            name: profile.name,
            is_premium: profile.is_premium,
            tag: profile.tag,
            user_chat_id: profile.user_chat_id,
            customer_id: profile.customer_id,
            gender: profile.gender,
            more_id: profile.more_id,
            role: profile.role,
            is_blocked: profile.is_blocked,
            more: profile.more,
            posts_count: 0,
            friends_count: 0,
            subs_count: 0,
            subscribers_count: 0,
            friend_request_id: null,
            is_subbed: null,
            is_friend: null
         },
         is_system_message: false,
         has_attachments: false,
         is_forwarded: false,
         is_reply: !!reply_to,
         has_reactions: false,
         is_pinned: false
      };

      if (content_type === "sticker" && requestBody.media_items?.length) {
         temp.media_items = requestBody.media_items;
      }

      return temp;
   };

   extractRealMessageData = (response: any, context?: { temp_id?: string; tempData?: any; }) => {
      const message = response?.message;

      if (!message) return message;

      if (context?.temp_id) {
         return {
            ...message,
            id: context.temp_id,
            server_id: message.id,
         };
      }

      return message;
   };

   handleOptimisticMessageError = (tempData: any, error: any): boolean => {
      const isFloodProtection = error?.message?.includes('Flood protection') ||
         error?.message?.includes('too many messages');
      return isFloodProtection;
   };

   shouldRetryOnError = (error: any): boolean => {
      return error?.message?.includes('Flood protection') ||
         error?.message?.includes('too many messages');
   };

   // HANDLERS

   // AUTH HANDLER

   authResHandler = (message: AuthWsResponse) => {
      // const { msgAuthLoading: { setMsgAuthLoading } } = messageWebsocketStore;

      if (!message.success) return;
      // setMsgAuthLoading(false);
      // messageWebsocketStore.messageWs.isLogined.setIsLogined(true);
   };

   // GET MESSAGES HANDLER

   getMessagesSuccessHandler = async (msg: GetMessagesResponse) => {
      const { setMessageUpdater } = messageInteractionsStore;

      setMessageUpdater(useMobxUpdate(() => messageActionsStore?.messages.data?.messages || []));

      const resolvedChatId = msg?.chat_id ?? (msg as any)?.data?.chat_id;
      if (resolvedChatId) {
         const route = getCurrentRoute();
         const params = route?.params as { name?: string; chatId?: string; userChatId?: string; selectedChat?: { id: string;[k: string]: any; }; } | undefined;
         const currentChatId = params?.chatId;
         const hadUserChatId = Boolean(params?.userChatId);
         if (route?.name === "Chat" && (currentChatId || hadUserChatId) && currentChatId !== resolvedChatId) {
            const fromId = formatId(`getMessages-null-null-${currentChatId || params?.userChatId || ""}`);
            const toId = formatId(`getMessages-null-null-${resolvedChatId}`);
            runInAction(() => {
               const entry = globalWebSocketManager.requestCache.get(fromId);
               if (entry?.data) {
                  globalWebSocketManager.requestCache.set(toId, { ...entry, data: entry.data });
               }
            });
            const nextParams: { chatId: string; userChatId?: undefined; selectedChat?: any; } = { chatId: resolvedChatId, userChatId: undefined };
            if (params?.selectedChat && typeof params.selectedChat === "object") {
               nextParams.selectedChat = { ...params.selectedChat, id: resolvedChatId };
            }
            setParams(nextParams);
         }
      }
   };

   getMessagesErrorHandler = (msg: GetMessagesResponse) => { };

   // CREATE MESSAGE HANDLER

   createMessageSuccessHandler = async (data: any) => {
      runInAction(() => {
         this.uploadChatMedia = [];
      });
   };

   createMessageErrorHandler = (msg: CreateMessageResponse) => { };

   editMessageRevertHandler = (snapshot: { message_id: string; previous_content?: string; chat_id: string; }) => {
      const { messages } = messageActionsStore;
      if (!messages?.saiUpdater || !snapshot?.message_id || !snapshot?.chat_id) return;
      const cacheId = `getMessages-null-null-${snapshot.chat_id}`;
      const prevContent = snapshot.previous_content ?? "";
      messages.saiUpdater(
         null,
         null,
         (prev: GetMessageMessage[]) => {
            if (!prev || !Array.isArray(prev)) return prev;
            return prev.map((m) =>
               m.id === snapshot.message_id
                  ? { ...m, content: prevContent, original_content: prevContent }
                  : m
            );
         },
         "id",
         cacheId,
         "both"
      );
   };

   // TYPING HANDLERS

   messageTypingSuccessHandler = (msg: TypingResponse) => { };

   messageTypingErrorHandler = (error: any) => { };

   // MESSAGE FILE UPLOAD HANDLERS

   messageFileUploadErrorHandler = (error: any, uploadId: string) => {
      logger.info("[messageFileUploadErrorHandler] error:", `${uploadId} - ${error}`);
   };

   messageFileUploadSuccessHandler = (result: any, uploadId: string) => {
      logger.info("[messageFileUploadSuccessHandler] Result:", `${uploadId} - ${result}`);
   };

   messageFileUploadProgressHandler = (progress: number, uploadId: string, fileStates: FileUploadState[]) => {
      logger.info("[messageFileUploadProgressHandler] Progress:", `${uploadId} - ${progress}`);
   };

   // GET MEDIA MESSAGES HANDLERS

   getMediaMessagesSuccessHandler = (message: ProtoGetMediaMessagesResponse) => {
      console.log("getMediaMessagesSuccessHandler", message);
   };

   getMediaMessagesErrorHandler = (message: ErrorResponse) => {
      console.log("getMediaMessagesErrorHandler", message);
   };
}

export const messageServicesStore = new MessageServicesStore();
