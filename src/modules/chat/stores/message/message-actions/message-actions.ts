import { getServerId } from '@utils/functions';
import { checker, logger } from '@lib/helpers';
import { getSaiInstanceById, hasSaiCache, mobxSaiWs } from '@lib/mobx-toolbox/mobxSaiWs';
import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';
import { getCurrentRoute } from '@lib/navigation';
import { makeAutoObservable } from 'mobx';
import { mobxState } from 'mobx-toolbox';
import { chatsInteractionsStore, chatsServicesStore } from 'src/modules/chat/stores/chats';
import { User, profileStore } from 'src/modules/user/stores/profile';
import { messageInteractionsStore } from '../message-interactions/message-interactions';
import { messageServicesStore } from '../message-services/message-services';
import { CreateMessageBody, CreateMessageResponse, DeleteMessagesBody, DeleteMessagesResponse, EditMessageBody, EditMessageResponse, GetMessagesBody, GetMessagesResponse, MarkChatAsReadBody, MarkChatAsReadResponse, MarkMessageAsMentionedReadBody, MarkMessageAsMentionedReadResponse, MarkMessagesAsReadBody, MarkMessagesAsReadResponse, ProtoGetMediaMessagesRequest, ProtoGetMediaMessagesResponse, TypingBody, TypingResponse } from './types';

class MessageActionsStore {
   constructor() { makeAutoObservable(this); }

   // GET MESSAGES

   messages: MobxSaiWsInstance<GetMessagesResponse> = {};
   MESSAGES_LIMIT = 100;

   getMessagesAction = async (needPending = true, fetchIfHaveData = false, chatId?: string, needAddToArr = true) => {
      const { getMessagesSuccessHandler, getMessagesErrorHandler } = messageServicesStore;
      const { selectedChat } = chatsInteractionsStore;
      const { messagesScrollRef: { messagesScrollRef } } = messageInteractionsStore;

      if (!messagesScrollRef?.current) {
         logger.debug("MessagesActionsStore", `getMessagesAction: messagesScrollRef is not loaded yet ${messagesScrollRef?.current}`);
         return;
      }

      const routeParams = getCurrentRoute()?.params as { chatId?: string; userChatId?: string; } | undefined;
      const routeUserChatId = routeParams?.userChatId;
      const bodyChatId = chatId ?? selectedChat?.id ?? routeParams?.chatId;

      if (!bodyChatId && !routeUserChatId) return;

      const useUserChatId = Boolean(routeUserChatId) || (
         selectedChat?.type === "PRIVATE" &&
         selectedChat.participant?.user_chat_id &&
         selectedChat.id === selectedChat.participant.user_chat_id
      );
      const effectiveId = bodyChatId || routeUserChatId || "";

      const params = mobxState<GetMessagesBody>({
         limit: this.MESSAGES_LIMIT,
         relative_id: null,
         up: false,
      })("params");

      if (useUserChatId && (routeUserChatId || bodyChatId)) {
         params.params.user_chat_id = routeUserChatId || bodyChatId;
         params.params.chat_id = "";
      } else if (selectedChat || bodyChatId) {
         params.params.chat_id = bodyChatId!;
      }

      this.messages = mobxSaiWs(
         params.params,
         {
            id: `getMessages-null-null-${effectiveId || "empty"}`,
            fetchIfPending: false,
            maxCacheData: 50,
            maxLocalStorageCache: 50,
            needPending,
            fetchIfHaveData: true,
            fetchIfHaveLocalStorage: true,
            storageCache: true,
            takeCachePriority: "localStorage",
            service: "message",
            method: "get_messages",
            onSuccess: getMessagesSuccessHandler,
            onError: getMessagesErrorHandler,
            shadowRequest: {
               enabled: true,
               route: "Chat"
            },
            dataScope: {
               startFrom: "bot",
               scrollRef: messagesScrollRef,
               topPercentage: 20,
               botPercentage: 80,
               setParams: params.setParams,
               relativeParamsKey: "relative_id",
               isHaveMoreResKey: "is_have_more",
               upOrDownParamsKey: "up",
               howMuchGettedToTop: 2,
               relativeIdSelectStrategy: "reversed",
               upStrategy: "reversed",
               scopeLimit: this.MESSAGES_LIMIT * 2
            },
            cacheSystem: {
               limit: this.MESSAGES_LIMIT
            },
            pathToArray: "messages",
            fetchAddTo: {
               path: "messages",
               addTo: "end"
            },
         }
      );
   };

   // CREATE MESSAGE

   createMessage: MobxSaiWsInstance<CreateMessageResponse> = {};

   createMessageAction = async (body: CreateMessageBody) => {
      const { upChatOrAddToTop } = chatsServicesStore;
      const { selectedChat } = chatsInteractionsStore;
      const {
         createOptimisticMessageData,
         extractRealMessageData,
         handleOptimisticMessageError,
         shouldRetryOnError,
         uploadChatMedia,
         setUploadChatMedia,
         messageFileUploadErrorHandler,
         messageFileUploadProgressHandler,
         messageFileUploadSuccessHandler
      } = messageServicesStore;
      const {
         msgCloneText: { setMsgCloneText },
         replyMessageHandler
      } = messageInteractionsStore;

      const params: {
         chatId: string;
         previewUser: User;
         userChatId?: string;
      } = getCurrentRoute()?.params as any;

      const bodyChatId = body.chat_id || body.user_chat_id || (selectedChat ? selectedChat.id : params?.previewUser?.user_chat_id);
      const routeUserChatId = params?.userChatId;
      const effectiveId = bodyChatId || routeUserChatId || "";

      setMsgCloneText("");

      if (!body.chat_id && !body.user_chat_id) {
         if (selectedChat) body.chat_id = bodyChatId;
         else if (params?.previewUser?.user_chat_id) body.user_chat_id = bodyChatId;
         else if (bodyChatId) {
            body.chat_id = bodyChatId;
         }
      }

      replyMessageHandler();

      const hasMedia = uploadChatMedia.length > 0;
      const isSticker = body.content_type === "sticker" && (body.media_items?.length ?? 0) > 0;
      const createMessageId = (hasMedia || isSticker)
         ? `createMessage-${effectiveId}-${Date.now()}`
         : `createMessage-${effectiveId}`;

      this.createMessage = mobxSaiWs(
         body,
         {
            id: createMessageId,
            pathToArray: "messages",
            service: "message",
            method: "create_message",
            needStates: false,
            bypassQueue: false,
            fetchIfHaveData: true,
            fetchIfPending: true,

            optimisticUpdate: {
               updateCache: "both",
               enabled: true,
               createTempData: createOptimisticMessageData,
               addStrategy: "start",
               insertAfterLastTemp: false,
               extractRealData: extractRealMessageData,
               extractIgnoreKeys: ["file_url", "thumbnail_url", "media_items.*.file_url", "media_items.*.thumbnail_url"],
               onAddedTempData: upChatOrAddToTop,
               onError: handleOptimisticMessageError,
               onSuccess: () => setUploadChatMedia([]),
               targetCacheId: `getMessages-null-null-${effectiveId || "empty"}`,

               ...(hasMedia ? {
                  files: {
                     data: uploadChatMedia,
                     maxUploads: 10,
                     pathInTempData: 'media_items',
                     filesParamKey: 'media_items',
                     extractUploadedFiles: (fileStates, requestBody) => {
                        if (!fileStates || fileStates.length === 0) return null;

                        const uploadedFiles = fileStates
                           .filter(state => !(state as any).cancelled && state.status === 'completed' && state.result)
                           .map(state => state.result);

                        if (uploadedFiles.length === 0) return null;

                        const mediaItems = uploadedFiles.map(file => ({
                           media_type: file.media_type,
                           file_url: file.url,
                           thumbnail_url: file.thumbnail_url || null,
                           width: file.width || null,
                           height: file.height || null,
                           file_name: file.file_name,
                           file_size: file.file_size,
                           mime_type: file.mime_type,
                           duration: file.duration || null,
                           bitrate: file.bitrate || null,
                           fps: file.fps || null,
                           codec: file.codec || null,
                           waveform: file.waveform || null,
                           variants: []
                        }));

                        if (requestBody) {
                           requestBody.content_type = uploadedFiles[0].media_type;
                           if (uploadedFiles.length > 1) {
                              requestBody.media_group_id = `mg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                           }
                        }

                        return mediaItems;
                     },
                     onProgress: messageFileUploadProgressHandler,
                     onFileSuccess: messageFileUploadSuccessHandler,
                     onFileError: messageFileUploadErrorHandler
                  }
               } : {})
            },

            queueStrategy: {
               enabled: true,
            }
         }
      );
   };

   // CHAT TYPING

   typing: MobxSaiWsInstance<TypingResponse> = {};

   typingAction = async (isTyping: boolean) => {
      const { selectedChat } = chatsInteractionsStore;

      if (!selectedChat) return;

      const body: TypingBody = {
         chat_id: selectedChat?.id || "",
         is_typing: isTyping,
         user_id: profileStore?.profile?.id || ""
      };

      this.typing = mobxSaiWs(
         body,
         {
            id: `typing_${selectedChat.id}_${isTyping}`,
            service: "message",
            method: "message_typing",
            fetchIfHaveData: true,
            fetchIfPending: true,
         }
      );
   };

   // GET MEDIA MESSAGES

   mediaMessages: MobxSaiWsInstance<ProtoGetMediaMessagesResponse> = {};

   getMediaMessagesAction = async () => {
      const { getMyProfile } = profileStore;
      const { selectedChat } = chatsInteractionsStore;
      const { mediaMessagesScrollRef: { mediaMessagesScrollRef } } = messageInteractionsStore;
      const { getMediaMessagesSuccessHandler, getMediaMessagesErrorHandler } = messageServicesStore;

      checker(selectedChat, "getMediaMessagesAction: selectedChat is not loaded yet");

      const profile = await getMyProfile();
      const user_id = profile?.id;
      const chat_id = selectedChat.id;

      const body: ProtoGetMediaMessagesRequest = {
         user_id,
         chat_id,
         limit: this.MESSAGES_LIMIT,
         relative_id: null,
         up: false,
      };

      const needPending = !(await hasSaiCache("all", ["getMediaMessages", body.chat_id]));

      this.mediaMessages = mobxSaiWs(
         body,
         {
            id: ["getMediaMessages", body.chat_id],
            service: "message",
            method: "get_media_messages",
            fetchIfPending: false,
            fetchIfHaveData: true,
            maxCacheData: 50,
            maxLocalStorageCache: 50,
            fetchIfHaveLocalStorage: true,
            shadowRequest: {
               enabled: true,
               route: "ChatProfile"
            },
            needPending,
            storageCache: true,
            takeCachePriority: "localStorage",
            pathToArray: "messages",
            dataScope: {
               startFrom: "top",
               scrollRef: mediaMessagesScrollRef,
               topPercentage: 80,
               botPercentage: 20,
               relativeParamsKey: "relative_id",
               upOrDownParamsKey: "up",
               isHaveMoreResKey: "is_have_more",
               upStrategy: "reversed",
               scopeLimit: this.MESSAGES_LIMIT * 2
            },
            fetchAddTo: {
               path: "messages",
               addTo: "end"
            },
            onSuccess: getMediaMessagesSuccessHandler,
            onError: getMediaMessagesErrorHandler,
         }
      );
   };

   // MARK CHAT AS READ

   markChatAsRead: MobxSaiWsInstance<MarkChatAsReadResponse> = {};

   markChatAsReadAction = async (chatId: string) => {
      const { getMyProfile } = profileStore;

      if (!chatId) return;

      const profile = await getMyProfile();
      const user_id = profile?.id;

      if (!user_id) return;

      const body: MarkChatAsReadBody = {
         user_id,
         chat_id: chatId,
      };

      this.markChatAsRead = mobxSaiWs(
         body,
         {
            id: `markChatAsRead-${user_id}-${chatId}`,
            service: "message",
            method: "mark_chat_as_read",
            fetchIfHaveData: true,
            fetchIfPending: true,
            needStates: false,
         }
      );
   };

   // MARK MESSAGES AS READ

   markMessagesAsRead: MobxSaiWsInstance<MarkMessagesAsReadResponse> = {};

   markMessagesAsReadAction = async (messageIds: string[]) => {
      const { getMyProfile } = profileStore;

      if (!messageIds || messageIds.length === 0) {
         console.warn("[markMessagesAsReadAction] No message IDs provided");
         return;
      }

      const profile = await getMyProfile();
      const user_id = profile?.id;

      if (!user_id) {
         console.warn("[markMessagesAsReadAction] User ID not available");
         return;
      }

      const body: MarkMessagesAsReadBody = {
         user_id,
         message_ids: messageIds,
      };

      this.markMessagesAsRead = mobxSaiWs(
         body,
         {
            id: `markMessagesAsRead-${user_id}-${messageIds.join(',')}`,
            service: "message",
            method: "mark_messages_as_read",
            fetchIfHaveData: true,
            fetchIfPending: true,
            needStates: false,
         }
      );
   };

   // MARK MESSAGE AS MENTIONED READ (max 100 message_ids per request)

   static readonly MARK_MENTIONED_READ_MAX_IDS = 100;

   markMessageAsMentionedRead: MobxSaiWsInstance<MarkMessageAsMentionedReadResponse> = {};

   markMessageAsMentionedReadAction = async (messageIds: string[]) => {
      const { getMyProfile } = profileStore;

      if (!messageIds?.length) return;

      const profile = await getMyProfile();
      const user_id = profile?.id;
      if (!user_id) return;

      const limitedIds = messageIds.slice(0, MessageActionsStore.MARK_MENTIONED_READ_MAX_IDS);

      const body: MarkMessageAsMentionedReadBody = {
         user_id,
         message_ids: limitedIds,
      };

      this.markMessageAsMentionedRead = mobxSaiWs(
         body,
         {
            id: `markMessageAsMentionedRead-${user_id}-${limitedIds.sort().join(',')}`,
            service: "message",
            method: "mark_message_as_mentioned_read",
            fetchIfHaveData: true,
            fetchIfPending: true,
            needStates: false,
         }
      );
   };

   // EDIT MESSAGE

   editMessage: MobxSaiWsInstance<EditMessageResponse> = {};

   editMessageAction = async (body: EditMessageBody) => {
      const { editMessageRevertHandler } = messageServicesStore;
      const message_id = body.message_id;
      const content = body.content;
      const chat_id = body.chat_id;

      this.editMessage = mobxSaiWs(
         body,
         {
            id: `editMessage-${body.user_id}-${message_id}`,
            service: "message",
            method: "edit_message",
            needStates: false,
            fetchIfHaveData: true,
            fetchIfPending: false,
            deepCompare: true,
            initialMessage: body.previous_content != null ? { ...body, content: body.previous_content } : undefined,
            preData: {
               enabled: true,
               targetCacheId: `getMessages-null-null-${chat_id}`,
               idKey: "id",
               updateCache: "both",
               updater: (prev: any, body?: EditMessageBody) => {
                  if (!Array.isArray(prev)) return prev;
                  const b = body ?? { message_id, content };
                  const nowSec = Math.floor(Date.now() / 1000);
                  return prev.map((m: any) =>
                     getServerId(m) === b.message_id
                        ? { ...m, content: b.content, original_content: b.content, edit_date: m.edit_date ?? nowSec }
                        : m
                  );
               },
               onApply: (b: EditMessageBody) => ({
                  message_id: b.message_id,
                  previous_content: b.previous_content,
                  chat_id: b.chat_id,
               }),
               onRevert: (snapshot: any) => editMessageRevertHandler(snapshot),
            },
            onSuccess: (responseData: EditMessageResponse) => {
               if (responseData?.edit_date == null || !responseData?.message_id) return;
               const messagesInst = getSaiInstanceById<GetMessagesResponse>(`getMessages-null-null-${chat_id}`);
               if (!messagesInst?.saiUpdater) return;
               const cacheId = `getMessages-null-null-${chat_id}`;
               messagesInst.saiUpdater(null, null, (prev: any[]) => {
                  if (!Array.isArray(prev)) return prev;
                  return prev.map((m: any) =>
                     getServerId(m) === responseData.message_id ? { ...m, edit_date: responseData.edit_date } : m
                  );
               }, "id", cacheId, "both");
            },
         }
      );
   };

   // DELETE MESSAGES

   deleteMessages: MobxSaiWsInstance<DeleteMessagesResponse> = {};

   deleteMessagesAction = async (messageIds: string[], forEveryone = false) => {
      const { getMyProfile } = profileStore;
      const { selectedChat } = chatsInteractionsStore;
      const routeParams = getCurrentRoute()?.params as { chatId?: string; userChatId?: string; } | undefined;
      const routeUserChatId = routeParams?.userChatId;
      const bodyChatId = selectedChat?.id ?? routeParams?.chatId;
      const useUserChatId = Boolean(routeUserChatId) || (
         selectedChat?.type === "PRIVATE" &&
         selectedChat?.participant?.user_chat_id &&
         selectedChat.id === selectedChat.participant.user_chat_id
      );
      const effectiveId = bodyChatId || routeUserChatId || "";

      if (!messageIds?.length) return;

      const profile = await getMyProfile();
      const user_id = profile?.id;
      if (!user_id) return;

      const messages = (this.messages?.data as GetMessagesResponse | undefined)?.messages ?? [];
      const serverIds = messageIds.map((id) => {
         const msg = messages.find((m) => m.id === id || getServerId(m) === id);
         return getServerId(msg ?? { id });
      }).filter(Boolean);

      if (!serverIds.length) return;

      const body: DeleteMessagesBody = {
         user_id,
         message_ids: serverIds,
         ...(forEveryone ? { for_everyone: true } : {}),
      };

      logger.info("deleteMessages", effectiveId);

      this.deleteMessages = mobxSaiWs(
         body,
         {
            id: `deleteMessages-${user_id}-${serverIds.sort().join(",")}`,
            service: "message",
            method: "delete_messages",
            needStates: false,
            fetchIfHaveData: true,
            fetchIfPending: true,
            optimisticUpdate: {
               enabled: true,
               deleteMode: true,
               deleteId: serverIds[0],
               deleteIds: serverIds,
               targetCacheId: `getMessages-null-null-${effectiveId || "empty"}`,
               updateCache: "both",
            },
         }
      );
   };
}

export const messageActionsStore = new MessageActionsStore();