import { makeAutoObservable, runInAction } from 'mobx';
import { generateSimpleUUID } from '@lib/string';
import { logger } from '@lib/helpers';
import { formatId } from '../../text';
import { mobxSaiWs } from '../mobxSaiWs';
import { uploadSingleFile, uploadVideo } from '@stores/file/file-actions/file-actions';
import { fileServicesStore } from '@stores/file/file-services/file-services';
import {
	FileUploadItem,
	FileUploadItemError,
	FileUploadItemResult,
	SaiFile,
	SaiFileUploadOptions
} from './types';

export class SaiFileUpload {
	constructor(options?: SaiFileUploadOptions) {
		this.options = {
			id: undefined,
			maxUploads: 1,
			uploadType: 'single',
			autoStart: true,
			onSuccess: undefined,
			onError: undefined,
			onProgress: undefined,
			onAllComplete: undefined,
			...options
		};
		makeAutoObservable(this, {}, { autoBind: true });
	}

	options: SaiFileUploadOptions & {
		maxUploads: number;
		uploadType: 'single' | 'video';
		autoStart: boolean;
	};
	queue: FileUploadItem[] = [];
	activeUploads: Set<string> = new Set();
	isProcessing: boolean = false;

	/**
	 * Add file(s) to upload queue
	 */
	addFiles = (files: SaiFile | SaiFile[]): this => {
		const filesArray = Array.isArray(files) ? files : [files];

		runInAction(() => {
			filesArray.forEach(file => {
				if (!file?.uri || file.uri === '' || file.uri === 'error') {
					logger.error('[SaiFileUpload]', `Invalid file URI: ${file?.uri}`);
					return;
				}

				if (this.options.maxUploads && this.queue.length >= this.options.maxUploads) {
					logger.warning('[SaiFileUpload]', `Max uploads (${this.options.maxUploads}) reached, skipping file`);
					return;
				}

				const uploadId = generateSimpleUUID();
				const itemId = generateSimpleUUID();

				const uploadItem: FileUploadItem = {
					id: itemId,
					file,
					upload_id: uploadId,
					progress: 0,
					status: 'pending',
					error: undefined,
					result: undefined
				};

				this.queue.push(uploadItem);
				logger.info('[SaiFileUpload]', `Added file to queue: ${uploadId}`);
			});
		});

		if (this.options.autoStart) {
			this.processQueue();
		}

		return this;
	};

	/**
	 * Start processing the upload queue
	 */
	processQueue = async (): Promise<void> => {
		if (this.isProcessing) {
			logger.info('[SaiFileUpload]', 'Queue already processing');
			return;
		}

		runInAction(() => {
			this.isProcessing = true;
		});

		while (this.hasMoreToUpload()) {
			const availableSlots = this.options.maxUploads - this.activeUploads.size;

			if (availableSlots <= 0) {
				await new Promise(resolve => setTimeout(resolve, 100));
				continue;
			}

			const pendingItems = this.queue.filter(item => item.status === 'pending');
			const itemsToUpload = pendingItems.slice(0, availableSlots);

			if (itemsToUpload.length === 0) {
				break;
			}

			await Promise.all(
				itemsToUpload.map(item => this.uploadFile(item))
			);
		}

		runInAction(() => {
			this.isProcessing = false;
		});

		const allComplete = this.queue.every(
			item => item.status === 'completed' || item.status === 'error'
		);

		if (allComplete && this.options.onAllComplete) {
			const results = this.queue
				.filter(item => item.status === 'completed' && item.result)
				.map(item => item.result!);
			this.options.onAllComplete(results);
		}
	};

	/**
	 * Upload a single file
	 */
	private uploadFile = async (item: FileUploadItem): Promise<void> => {
		const { upload_id, file } = item;

		runInAction(() => {
			this.activeUploads.add(upload_id);
			this.updateItemStatus(item.id, 'uploading', 0);
		});

		try {
			logger.info('[SaiFileUpload]', `Starting upload: ${upload_id}`);

			const progressSubscription = mobxSaiWs(
				{ uploadId: upload_id },
				{
					id: upload_id,
					service: 'file',
					method: 'subscribeToUploadProgress',
					fetchIfHaveData: true,
					fetchIfPending: true
				}
			);

			fileServicesStore.registerProgressCallback(upload_id, (progressMessage) => {
				logger.info('[SaiFileUpload]', `Progress for ${upload_id}: ${progressMessage.progress}%`);

				runInAction(() => {
					this.updateItemStatus(item.id, 'uploading', progressMessage.progress);
				});

				if (this.options.onProgress) {
					this.options.onProgress(progressMessage.progress, upload_id);
				}

				if (progressMessage.url && progressMessage.stage === 'completed') {
					const result: FileUploadItemResult = { url: progressMessage.url };

					runInAction(() => {
						this.updateItemResult(item.id, result);
					});

					if (this.options.onSuccess) {
						this.options.onSuccess(result, upload_id);
					}

					fileServicesStore.unregisterProgressCallback(upload_id);
				} else if (progressMessage.stage === 'error') {
					const error: FileUploadItemError = { message: progressMessage.message };

					runInAction(() => {
						this.updateItemError(item.id, error);
					});

					if (this.options.onError) {
						this.options.onError(error, upload_id);
					}

					fileServicesStore.unregisterProgressCallback(upload_id);
				}
			});

			await new Promise(resolve => setTimeout(resolve, 500));

			if (this.options.uploadType === 'video') {
				await uploadVideo(file, upload_id);
			} else {
				const result = await uploadSingleFile(file, upload_id);

				if (result?.url) {
					runInAction(() => {
						this.updateItemResult(item.id, { url: result.url });
					});

					if (this.options.onSuccess) {
						this.options.onSuccess({ url: result.url }, upload_id);
					}
				}
			}

		} catch (error: any) {
			logger.error('[SaiFileUpload]', `Upload failed for ${upload_id}: ${error.message}`);

			const errorObj: FileUploadItemError = {
				message: error?.message || 'Upload failed'
			};

			runInAction(() => {
				this.updateItemError(item.id, errorObj);
			});

			if (this.options.onError) {
				this.options.onError(errorObj, upload_id);
			}

			fileServicesStore.unregisterProgressCallback(upload_id);
		} finally {
			runInAction(() => {
				this.activeUploads.delete(upload_id);
			});
		}
	};

	/**
	 * Update item status and progress
	 */
	private updateItemStatus = (itemId: string, status: FileUploadItem['status'], progress: number): void => {
		const item = this.queue.find(i => i.id === itemId);
		if (item) {
			item.status = status;
			item.progress = progress;
		}
	};

	/**
	 * Update item result
	 */
	private updateItemResult = (itemId: string, result: FileUploadItemResult): void => {
		const item = this.queue.find(i => i.id === itemId);
		if (item) {
			item.result = result;
			item.status = 'completed';
			item.progress = 100;
		}
	};

	/**
	 * Update item error
	 */
	private updateItemError = (itemId: string, error: FileUploadItemError): void => {
		const item = this.queue.find(i => i.id === itemId);
		if (item) {
			item.error = error;
			item.status = 'error';
		}
	};

	/**
	 * Check if there are more files to upload
	 */
	private hasMoreToUpload = (): boolean => {
		return this.queue.some(item =>
			item.status === 'pending' || item.status === 'uploading'
		);
	};

	/**
	 * Get current queue state
	 */
	getQueue = (): FileUploadItem[] => {
		return this.queue;
	};

	/**
	 * Get item by upload_id
	 */
	getItem = (uploadId: string): FileUploadItem | undefined => {
		return this.queue.find(item => item.upload_id === uploadId);
	};

	/**
	 * Get item by id
	 */
	getItemById = (id: string): FileUploadItem | undefined => {
		return this.queue.find(item => item.id === id);
	};

	/**
	 * Remove item from queue
	 */
	removeItem = (itemId: string): void => {
		runInAction(() => {
			const index = this.queue.findIndex(item => item.id === itemId);
			if (index !== -1) {
				const item = this.queue[index];

				if (item.status === 'uploading') {
					this.activeUploads.delete(item.upload_id);
					fileServicesStore.unregisterProgressCallback(item.upload_id);
				}

				this.queue.splice(index, 1);
				logger.info('[SaiFileUpload]', `Removed item: ${itemId}`);
			}
		});
	};

	/**
	 * Clear all items from queue
	 */
	clear = (): void => {
		runInAction(() => {
			this.activeUploads.forEach(uploadId => {
				fileServicesStore.unregisterProgressCallback(uploadId);
			});

			this.activeUploads.clear();
			this.queue = [];
			this.isProcessing = false;
			logger.info('[SaiFileUpload]', 'Queue cleared');
		});
	};

	/**
	 * Retry failed uploads
	 */
	retryFailed = (): void => {
		runInAction(() => {
			this.queue.forEach(item => {
				if (item.status === 'error') {
					item.status = 'pending';
					item.progress = 0;
					item.error = undefined;
				}
			});
		});

		if (this.options.autoStart) {
			this.processQueue();
		}
	};

	/**
	 * Get upload statistics
	 */
	getStats = () => {
		const total = this.queue.length;
		const pending = this.queue.filter(i => i.status === 'pending').length;
		const uploading = this.queue.filter(i => i.status === 'uploading').length;
		const completed = this.queue.filter(i => i.status === 'completed').length;
		const failed = this.queue.filter(i => i.status === 'error').length;

		return {
			total,
			pending,
			uploading,
			completed,
			failed,
			activeUploads: this.activeUploads.size
		};
	};
}

/**
 * Global file upload manager - manages all upload instances by ID
 */
class GlobalFileUploadManager {
	private instances: Map<string, SaiFileUpload> = new Map();

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true });
	}

	/**
	 * Get or create an upload instance by ID
	 */
	getInstance(id: string, options?: SaiFileUploadOptions): SaiFileUpload {
		if (!this.instances.has(id)) {
			const instance = new SaiFileUpload({ ...options, id });
			this.instances.set(id, instance);
			logger.info('[GlobalFileUploadManager]', `Created new instance: ${id}`);
		}
		return this.instances.get(id)!;
	}

	/**
	 * Remove an instance by ID
	 */
	removeInstance(id: string): void {
		const instance = this.instances.get(id);
		if (instance) {
			instance.clear();
			this.instances.delete(id);
			logger.info('[GlobalFileUploadManager]', `Removed instance: ${id}`);
		}
	}

	/**
	 * Clear all instances
	 */
	clearAll(): void {
		this.instances.forEach(instance => instance.clear());
		this.instances.clear();
		logger.info('[GlobalFileUploadManager]', 'Cleared all instances');
	}

	/**
	 * Get all instances
	 */
	getAllInstances(): Map<string, SaiFileUpload> {
		return this.instances;
	}
}

export const globalFileUploadManager = new GlobalFileUploadManager();

/**
 * Factory function to create/get upload instance and add files
 * Similar to mobxSaiWs - returns the queue (FileUploadItem[])
 */
export const saiFileUpload = (
	file: SaiFile | SaiFile[],
	options: SaiFileUploadOptions
): FileUploadItem[] => {
	if (!options.id) {
		throw new Error('[saiFileUpload] options.id is required');
	}

	const instanceId = typeof options.id === 'string'
		? options.id
		: formatId(options.id);
	const instance = globalFileUploadManager.getInstance(instanceId, options);

	instance.addFiles(file);

	return instance.getQueue();
};

