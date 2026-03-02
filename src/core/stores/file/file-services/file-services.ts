import { logger } from '@lib/helpers';
import { makeAutoObservable } from 'mobx';
import { postActionsStore, postInteractionsStore, postServiceStore } from 'src/modules/post/stores';
import { fileActionsStore } from '../file-actions/file-actions';
import { FileUploadItem, FileUploadItemError, FileUploadItemResult } from './types';

interface VideoUploadProgressMessage {
	type: string;
	upload_id: string;
	progress: number;
	stage: string;
	message: string;
	url?: string;
}

class FileServicesStore {
	constructor() { makeAutoObservable(this, {}, { deep: false }); }

	// MAPS

	progressCallbacks: Map<string, Array<(progress: VideoUploadProgressMessage) => void>> = new Map();
	uploadIds: Map<string, (message: any) => void> = new Map();
	fileUploadItemsQueue: Map<string, FileUploadItem> = new Map();

	// QUEUE PROCESSING
	isProcessingQueue: boolean = false;

	// MAP METHODS

	registerFileUploadItemToQueue = (uploadId: string, file: File) => {
		const fileUploadItem: FileUploadItem = {
			file: file,
			upload_id: uploadId,
			progress: 0,
			status: "pending",
			error: undefined,
			result: undefined
		};

		this.fileUploadItemsQueue.set(uploadId, fileUploadItem);
	};

	updateFileUploadItemProgress = (uploadId: string, progress: number, status: FileUploadItem["status"]) => {
		const item = this.fileUploadItemsQueue.get(uploadId);
		if (item) {
			item.progress = progress;
			item.status = status;
			this.fileUploadItemsQueue.set(uploadId, item);
		}
	};

	updateFileUploadItemResult = (uploadId: string, result: FileUploadItemResult) => {
		const item = this.fileUploadItemsQueue.get(uploadId);
		if (item) {
			item.result = result;
			item.status = "completed";
			item.progress = 100;
			this.fileUploadItemsQueue.set(uploadId, item);
		}
	};

	updateFileUploadItemError = (uploadId: string, error: FileUploadItemError) => {
		const item = this.fileUploadItemsQueue.get(uploadId);
		if (item) {
			item.error = error;
			item.status = "error";
			this.fileUploadItemsQueue.set(uploadId, item);
		}
	};

	getNextPendingFile = (): FileUploadItem | undefined => {
		for (const [uploadId, item] of this.fileUploadItemsQueue.entries()) {
			if (item.status === "pending") {
				return item;
			}
		}
		return undefined;
	};

	registerUploadId = (uploadId: string, callback: (message: any) => void) => {
		const getted = this.uploadIds.get(uploadId);

		if (getted) {
			logger.error("FileServicesStore", `Upload ID ${uploadId} already registered`);
			return;
		}

		this.uploadIds.set(uploadId, callback);
	};

	// OTHER METHODS

	registerProgressCallback = (uploadId: string, callback: (progress: VideoUploadProgressMessage) => void) => {
		console.log(`[FileServicesStore] Registering progress callback for uploadId: ${uploadId}`);
		const existing = this.progressCallbacks.get(uploadId) || [];
		existing.push(callback);
		this.progressCallbacks.set(uploadId, existing);
	};

	unregisterProgressCallback = (uploadId: string, callbackToRemove?: (progress: VideoUploadProgressMessage) => void) => {
		console.log(`[FileServicesStore] Unregistering progress callback for uploadId: ${uploadId}`);
		if (callbackToRemove) {
			const existing = this.progressCallbacks.get(uploadId) || [];
			const filtered = existing.filter(cb => cb !== callbackToRemove);
			if (filtered.length > 0) {
				this.progressCallbacks.set(uploadId, filtered);
			} else {
				this.progressCallbacks.delete(uploadId);
			}
		} else {
			this.progressCallbacks.delete(uploadId);
		}
	};

	getUploadVideoProgress = (message: any) => {
		logger.info("FileServicesStore", JSON.stringify(message, null, 2));

		if (message.upload_id.includes("createPost")) {
			const { createPostAction } = postActionsStore;
			const { changeCreatePostStatus } = postServiceStore;
			const { postUpdater } = postInteractionsStore;

			const tempId = message.upload_id.split("_")[1];

			postUpdater?.(tempId, "progress" as any, message.progress / 100);

			if (message.progress == 100) {
				changeCreatePostStatus(message.upload_id, "fulfilled");
				createPostAction([message.url]);
				return;
			}
		}

		try {
			if (message.type === "progress") {
				const progressMessage: VideoUploadProgressMessage = {
					type: message.type,
					upload_id: message.upload_id,
					progress: message.progress || 0,
					stage: message.stage || "unknown",
					message: message.message || "",
					url: message.url
				};

				console.log(`[FileServicesStore] Processing progress for uploadId: ${progressMessage.upload_id}`);
				console.log(`[FileServicesStore] Progress: ${progressMessage.progress}%, Stage: ${progressMessage.stage}`);

				if (progressMessage.url) {
					console.log(`[FileServicesStore] Final URL received: ${progressMessage.url}`);
				}

				const callbacks = this.progressCallbacks.get(progressMessage.upload_id);
				if (callbacks && callbacks.length > 0) {
					console.log(`[FileServicesStore] Calling ${callbacks.length} progress callback(s) for uploadId: ${progressMessage.upload_id}`);
					callbacks.forEach(callback => {
						try {
							callback(progressMessage);
						} catch (error) {
							console.error(`[FileServicesStore] Error in progress callback:`, error);
						}
					});
				} else {
					console.warn(`[FileServicesStore] No progress callback found for uploadId: ${progressMessage.upload_id}`);
				}

				if (progressMessage.progress === 100 || progressMessage.stage === "completed" || progressMessage.url) {
					console.log(`[FileServicesStore] Upload completed for uploadId: ${progressMessage.upload_id}, cleaning up callbacks`);
					this.unregisterProgressCallback(progressMessage.upload_id);
				}

			} else if (message.type === "error") {
				console.error("[FileServicesStore] Error message received:", message);

				if (message.upload_id) {
					const callbacks = this.progressCallbacks.get(message.upload_id);
					if (callbacks && callbacks.length > 0) {
						const errorMessage = {
							type: "error",
							upload_id: message.upload_id,
							progress: 0,
							stage: "error",
							message: message.message || "Unknown error",
							url: undefined
						};
						callbacks.forEach(callback => {
							try {
								callback(errorMessage);
							} catch (error) {
								console.error(`[FileServicesStore] Error in error callback:`, error);
							}
						});
					}
					this.unregisterProgressCallback(message.upload_id);
				}
			} else {
				console.log("[FileServicesStore] Unknown message type:", message.type);
			}

		} catch (error) {
			console.error("[FileServicesStore] Error processing WebSocket message:", error);
		}
	};

	// HANDLERS

	// UPLOAD PROGRESS SUCCESS HANDLER

	uploadProgressSuccessHandler = (message: any) => {
		console.log("[FileServicesStore] Upload progress success handler:", message);
		logger.info("FileServicesStore", message);

		const progressData = message.data || message;
		const uploadId = message.upload_id || progressData.upload_id;

		if (!uploadId) {
			console.error("[FileServicesStore] Upload ID is not set");
			logger.error("FileServicesStore", "Upload ID is not set");
			return;
		}

		const progressPercentage = progressData.progress_percentage ?? progressData.progress ?? 0;
		const stage = progressData.stage || "unknown";
		const url = progressData.url || null;
		const progressMessage = progressData.message || "";

		console.log(`[FileServicesStore] Processing upload progress for ${uploadId}: ${progressPercentage}% (${stage})`);

		const fullProgressMessage = {
			type: "progress",
			upload_id: uploadId,
			progress: progressPercentage,
			progress_percentage: progressPercentage,
			stage: stage,
			message: progressMessage,
			url: url,
			mime_type: progressData.mime_type,
			media_type: progressData.media_type,
			width: progressData.width,
			height: progressData.height,
			duration: Math.trunc(progressData.duration),
			bitrate: progressData.bitrate,
			fps: progressData.fps,
			codec: progressData.codec,
			thumbnail_url: progressData.thumbnail_url,
			waveform: progressData.waveform,
			file_name: progressData.file_name,
			file_size: progressData.file_size,
			compressed_size: progressData.compressed_size
		};

		if (stage === "completed" && url) {
			this.updateFileUploadItemResult(uploadId, { url });
			console.log(`[FileServicesStore] Upload completed for ${uploadId}, URL: ${url}`);
		} else if (stage === "error") {
			const errorMessage = progressMessage || "Unknown error";
			this.updateFileUploadItemError(uploadId, { message: errorMessage });
			console.error(`[FileServicesStore] Upload error for ${uploadId}: ${errorMessage}`);
		} else {
			this.updateFileUploadItemProgress(uploadId, progressPercentage, "uploading");
		}

		const callback = this.uploadIds.get(uploadId);
		if (callback) {
			callback(fullProgressMessage);
		}

		const progressCallbacks = this.progressCallbacks.get(uploadId);
		if (progressCallbacks && progressCallbacks.length > 0) {
			progressCallbacks.forEach(callback => {
				try {
					callback(fullProgressMessage);
				} catch (error) {
					console.error(`[FileServicesStore] Error in progress callback:`, error);
				}
			});
		}

		if (stage === "completed" || stage === "error") {
			setTimeout(() => {
				try {
					fileActionsStore.currentUploadingId = null;
					this.isProcessingQueue = false;
					fileActionsStore.processUploadQueue();
				} catch (error) {
					console.error("[FileServicesStore] Error requiring fileActionsStore:", error);
				}
			}, 0);
		}
	};

	uploadProgressErrorHandler = (message: any) => {
		console.log("[FileServicesStore] Upload progress error handler:", message);
		logger.error("FileServicesStore", message);
	};
}

export const fileServicesStore = new FileServicesStore();