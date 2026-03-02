export function registerEventHandler(m: any, type: string, handler: (data: any) => void) {
	m.eventHandlers.set(type, handler);
	console.log(`[GlobalWebSocketManager] Registered event handler for: ${type}`);
}

export function registerEventHandlers(m: any, handlers: Array<{ type: string; handler: (data: any) => void }>) {
	handlers.forEach(({ type, handler }) => registerEventHandler(m, type, handler));
}

export function getEventHandler(m: any, type: string): ((data: any) => void) | undefined {
	return m.eventHandlers.get(type);
}

export function unregisterEventHandler(m: any, type: string) {
	m.eventHandlers.delete(type);
	console.log(`[GlobalWebSocketManager] Unregistered event handler for: ${type}`);
}

export function clearAllEventHandlers(m: any) {
	m.eventHandlers.clear();
	console.log(`[GlobalWebSocketManager] Cleared all event handlers`);
}

export function getRegisteredEventTypes(m: any): string[] {
	return Array.from(m.eventHandlers.keys());
}
