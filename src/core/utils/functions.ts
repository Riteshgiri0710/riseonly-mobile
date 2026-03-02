/**
 * Returns the "real" message id: if server_id is present (found via findByKey), returns it;
 * otherwise returns the value at idPath (default "id").
 * For sender messages the id is temporary (temp), and the real id comes in server_id.
 *
 * @param obj - Any object (message or nested object)
 * @param idPath - Path to the id field, default "id" (supports nesting, e.g. "payload.id")
 * @returns server_id value if found via findByKey, otherwise value at idPath
 */
export function getIdOrServerId(obj: any, idPath: string = "id"): string | undefined {
	if (obj == null || typeof obj !== "object") {
		return undefined;
	}

	const findByKey = (obj as { findByKey?: (key: string) => any; }).findByKey;
	if (typeof findByKey === "function") {
		const serverId = findByKey.call(obj, "server_id");
		if (serverId !== undefined && serverId !== null) {
			return typeof serverId === "string" ? serverId : String(serverId);
		}
	}

	const value = getValueByPath(obj, idPath);
	if (value === undefined || value === null) {
		return undefined;
	}
	return typeof value === "string" ? value : String(value);
}

function getValueByPath(obj: any, path: string): any {
	if (!path || !obj) return undefined;
	const keys = path.split(".");
	let current: any = obj;
	for (const key of keys) {
		if (current == null || typeof current !== "object") return undefined;
		current = current[key];
	}
	return current;
}

export function isTempId(id: string | undefined): boolean {
	return typeof id === 'string' && id.startsWith('temp_');
}

export type GetMessageServerIdOptions = {
	/** Path to the id field (default "id"), supports nesting e.g. "payload.id" */
	pathToId?: string;
	/** Path to the server_id field (default "server_id") */
	pathToServerId?: string;
};

/**
 * Generic function to get id for API: reads id from pathToId;
 * if id is temporary (temp_), uses value at pathToServerId, otherwise uses id.
 * Use for add_reaction, remove_reaction, edit_message, delete_messages, etc.
 *
 * @param obj - Object (message or any with id/server_id at the given paths)
 * @param options - pathToId (default "id"), pathToServerId (default "server_id")
 */
export function getServerId(
	obj: any | null | undefined,
	options?: GetMessageServerIdOptions
): string {
	if (obj == null || typeof obj !== 'object') return '';
	const pathToId = options?.pathToId ?? 'id';
	const pathToServerId = options?.pathToServerId ?? 'server_id';
	const idRaw = getValueByPath(obj, pathToId);
	const serverIdRaw = getValueByPath(obj, pathToServerId);
	const id = idRaw != null && idRaw !== '' ? (typeof idRaw === 'string' ? idRaw : String(idRaw)) : '';
	const serverId = serverIdRaw != null && serverIdRaw !== '' ? (typeof serverIdRaw === 'string' ? serverIdRaw : String(serverIdRaw)) : '';
	if (isTempId(id) && serverId) return serverId;
	if (id) return id;
	if (serverId) return serverId;
	return '';
}