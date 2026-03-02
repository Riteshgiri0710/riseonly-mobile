import { makeAutoObservable } from 'mobx';
import { WebSocketEventItem } from './types';

export class EventsHistory {
	public events: WebSocketEventItem[] = [];

	constructor() {
		makeAutoObservable(this);
	}

	addEvent(message: any) {
		if (message.data?.message === "pong" || message.type === "pong") return;

		const event: WebSocketEventItem = {
			id: `event_${Date.now()}_${Math.random()}`,
			timestamp: Date.now(),
			data: message,
			type: message.type,
			error: message.error,
			request_id: message.request_id?.toString(),
		};

		this.events.unshift(event);
		this.limitSize();
	}

	private limitSize() {
		if (this.events.length > 100) {
			this.events = this.events.slice(0, 100);
		}
	}

	clear() {
		this.events = [];
	}
}