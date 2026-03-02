import { MobxSaiFetchCacheSystemOptions, MobxSaiFetchFetchAddToOptions, MobxStateWithGetterAndSetter } from 'mobx-toolbox';
import { AuthResultResponse, ChatCreatedResponse, ChatDeletedResponse, ChatEditedResponse, ChatsListResponse, CreateChatRequest, DeleteChatRequest, EditChatRequest, ErrorResponse, GetChatHistoryRequest, GetChatsRequest, PingRequest, PongResponse, SendMessageRequest } from '../../../modules/chat/stores/chats/chats-services/types';
import { CreateMessageBody, CreateMessageResponse, GetMessagesBody, GetMessagesResponse } from '../../../modules/chat/stores/message/message-actions/types';

export type RelativeIdSelectStrategy = 'default' | 'reversed'; // "default" by default

export interface MobxSaiWsDataScopeOptions {
   class: string | null;
   startFrom: 'bot' | 'top';
   scrollRef?: any;
   onScroll?: (event: any) => void;
   topPercentage: number | null;
   botPercentage: number | null;
   relativeParamsKey: string | null;
   relativeIdSelectStrategy?: RelativeIdSelectStrategy;
   upOrDownParamsKey: string | null;
   isHaveMoreResKey: string | null;
   howMuchGettedToTop: number;
   setParams: null | ((newValue: any[] | ((prev: any[]) => any[])) => void) | any;
}


export interface WsBaseBody {
   service: string;
   method: string;
}

export interface WsSendMessageOptions {
   id?: string;
   arrPath?: string;
   setData?: (data: any) => void;
   page?: MobxStateWithGetterAndSetter<number, string> | null;
   pageSetterName?: string | null;
   isFetchUp?: boolean;
   fetchType?: "default" | "pagination";
   isSetData?: boolean;
   cacheSystem?: Partial<MobxSaiFetchCacheSystemOptions>;
   dataScope?: Partial<MobxSaiWsDataScopeOptions>;
   fetchAddTo?: Partial<MobxSaiFetchFetchAddToOptions>;
   fetchIfHaveData?: boolean;
   fetchIfPending?: boolean;
   needPending?: boolean;
   stateId?: string;
   needStates?: boolean;
   bypassQueue?: boolean;
   maxCacheData?: number;
   service?: string;
   method?: string;
}

export interface WebsocketStoreProps {
   wsUrl: string;
   reconnectTimeout?: number;
   reconnectAttempts?: number;
   maxReconnectAttempts?: number;
   reconnectionTime?: number;
   connectionTimeout?: number;
   wsName?: string;
   withoutAuth?: boolean;
   withoutHeartbeat?: boolean;
   pingRequest?: any;
}

export interface AuthRequest {
   type: 'auth';
   token: string;
   device_id?: string;
}

export type WebSocketRequest =
   | AuthRequest
   | GetChatsRequest
   | CreateChatRequest
   | EditChatRequest
   | DeleteChatRequest
   | SendMessageRequest
   | GetChatHistoryRequest
   | PingRequest
   | GetMessagesBody
   | CreateMessageBody;

export interface BaseWebSocketResponse {
   type: string;
   request_id?: string;
   error?: string | any;
   status?: string;
   message?: string;
   result?: any;
   data?: any;
}

export type WebSocketResponse =
   | (AuthResultResponse & BaseWebSocketResponse)
   | (ChatsListResponse & BaseWebSocketResponse)
   | (ChatCreatedResponse & BaseWebSocketResponse)
   | (ChatEditedResponse & BaseWebSocketResponse)
   | (ChatDeletedResponse & BaseWebSocketResponse)
   | (PongResponse & BaseWebSocketResponse)
   | (ErrorResponse & BaseWebSocketResponse)
   | (GetMessagesResponse & BaseWebSocketResponse)
   | (CreateMessageResponse & BaseWebSocketResponse);

// RESULTS

export interface AuthWsResponse {
   "message": string;
   "success": boolean;
   "type": string;
   "user_id": string;
}

export type WsLoadingStatus = "idle" | "pending" | "fulfilled" | "rejected";

export interface WsResponse<T = unknown> {
   request_id: number;
   status: string;
   type: string;
   error: string | null;
   timestamp: number;
   data: T;
}