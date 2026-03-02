export interface SendModerationReqBody {
   reason: string,
   city: string,
   full_name: string,
   phone: string,
   nationality: string
}

export interface ModerationRequestResponse {
   id: number;
   full_name: string;
   status: string;
   phone: string;
   nationality: string;
   city: string;
   reason: string;
}