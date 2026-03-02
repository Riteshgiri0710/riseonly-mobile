const registry = new Map<string, () => void>();

export function registerCancel(uploadId: string, fn: () => void): void {
	registry.set(uploadId, fn);
}

export function unregisterCancel(uploadId: string): void {
	registry.delete(uploadId);
}

export function cancelUpload(uploadId: string): void {
	const fn = registry.get(uploadId);
	if (fn) {
		fn();
		registry.delete(uploadId);
	}
}
