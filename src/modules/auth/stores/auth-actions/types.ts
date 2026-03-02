import { GenderT } from '@core/config/types';

export interface AuthRegisterBody {
   "code": string,
   "gender": GenderT,
   "name": string,
   "phone_number": string,
   "password": string;
   "device_token"?: string;
   "device_info"?: string;
   "device_type"?: string;
   "platform"?: string;
   "user_agent"?: string;
   "browser"?: boolean;
   "ip_address"?: string;
}

export interface AuthLoginBody {
   "phone_number": string,
   "password": string;
   "device_token"?: string;
   "device_info"?: string;
   "device_type"?: string;
   "platform"?: string;
   "user_agent"?: string;
   "browser"?: boolean;
   "ip_address"?: string;
}

export interface SendCodeBody {
   "phone_number": string;
}

export interface SendCodeResponse {
   message: string;
   statusCode: number;
   error: string;
}

// LOGOUT

export interface LogoutBody {
   session_id: string;
   user_id: string;
   refresh_token: string;
}

export interface LogoutResponse {
   message: string;
}

export interface RefreshTokenBody {
   refresh_token: string;
}