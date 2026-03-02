import { VirtualList } from '@core/config/types';
import { Notify } from '../types';

export interface GetAllNotificationsParams {
   relativeId: number | string | null;
   up: boolean;
   limit: number;
   sort: string;
}

export interface GetAllNotificationsResponse extends Pick<VirtualList<Notify[]>, 'items' | 'relativeId'> {
   totalUnread: number;
   isHaveMore: boolean;
}