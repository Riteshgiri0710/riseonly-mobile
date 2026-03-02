import { getServerId } from '@utils/functions';
import { formatId } from '@lib/text';
import { observable, runInAction } from 'mobx';
import * as VideoThumbnails from 'expo-video-thumbnails';
import type { FileUploadState, MobxSaiWsInstance, MobxSaiWsOptions, WebSocketMessage } from '../types';
import { getFileActions, getFileServicesStore } from '../ws-manager/getters';

export { cancelUpload } from './upload-cancel-registry';

function generateTempId(m: any): string {
	return `temp_${Date.now()}_${++m.tempIdCounter}`;
}

function cleanFileUri(uri: string): string {
	if (!uri || typeof uri !== 'string') return uri;
	return uri.split('#')[0].split('?')[0];
}

async function generateVideoThumbnail(uri: string): Promise<string | null> {
	try {
		const cleanUri = cleanFileUri(uri);
		const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(cleanUri, { time: 0, quality: 0.8 });
		return thumbnailUri;
	} catch (error) {
		console.warn('[createEnrichedFileState] Failed to generate video thumbnail:', error);
		return null;
	}
}

function createEnrichedFileState(file: any, tempId: string, index: number) {
	const uploadId = `${tempId}_file_${index}`;
	const isVideo = (() => {
		if (file._rawAsset?.mediaType === 'video') return true;
		if (file.type?.startsWith('video/') || file.file?.type?.startsWith('video/')) return true;
		return false;
	})();
	const displayUrl = file.uri || file.file?.uri || (file._rawAsset && `ph://${file._rawAsset.id}`) || '';
	const cleanedFileUrl = typeof displayUrl === 'string' && displayUrl.startsWith('file://')
		? cleanFileUri(displayUrl)
		: displayUrl;

	console.log(`[createEnrichedFileState] Created fileState for ${uploadId}:`, {
		isVideo,
		originalUrl: displayUrl,
		cleanedFileUrl,
		hasHash: displayUrl.includes('#'),
		hasQuery: displayUrl.includes('?'),
	});

	const fileState = observable({
		id: `${tempId}_filestate_${index}`,
		upload_id: uploadId,
		file,
		progress: 0,
		status: 'pending' as const,
		error: undefined,
		result: undefined,
		url: isVideo ? cleanedFileUrl : displayUrl,
		thumbnail_url: displayUrl,
		file_url: cleanedFileUrl,
		media_type: isVideo ? 'video' : 'image',
		width: file.width || file.file?.width || 0,
		height: file.height || file.file?.height || 0,
		duration: file.duration || 0,
		isUploading: true,
		uploadProgress: 0,
		uploadedBytes: 0,
		totalBytes: 0,
		cancelled: false,
		thumbnailGenerated: false,
	});

	if (isVideo && cleanedFileUrl && cleanedFileUrl.startsWith('file://')) {
		generateVideoThumbnail(cleanedFileUrl)
			.then((thumbnailUri) => {
				if (thumbnailUri && !(fileState as any).cancelled) {
					runInAction(() => {
						fileState.thumbnail_url = thumbnailUri;
						fileState.url = thumbnailUri; // Используем thumbnail для превью
						(fileState as any).thumbnailGenerated = true;
					});
					console.log(`[createEnrichedFileState] Thumbnail generated for ${uploadId}: ${thumbnailUri}`);
				}
			})
			.catch((error) => {
				console.warn(`[createEnrichedFileState] Failed to generate thumbnail for ${uploadId}:`, error);
			});
	}

	return fileState;
}

function addOptimisticDataToUI(m: any, tempData: any, data: Partial<MobxSaiWsInstance<any>>, options: MobxSaiWsOptions) {
	if (!options.pathToArray) return;

	const optimistic = options.optimisticUpdate;
	const addStrategy = optimistic?.addStrategy || 'start';
	const insertAfterLastTemp = optimistic?.insertAfterLastTemp || false;
	const tempFlag = optimistic?.tempFlag || 'isTemp';
	const targetCacheId = optimistic?.targetCacheId;

	let targetData: any = data;

	if (targetCacheId) {
		const targetCacheEntry = m.requestCache.get(formatId(targetCacheId));
		if (targetCacheEntry?.data) {
			targetData = targetCacheEntry.data;
			console.log(`[OptimisticUpdate] Using target cache: ${targetCacheId}`);
		} else {
			console.warn(`[OptimisticUpdate] Target cache ${targetCacheId} not found, using current data`);
		}
	}

	if (!targetData) return;

	console.log(`[OptimisticUpdate] Adding temp data to UI, strategy: ${addStrategy}, insertAfterLastTemp: ${insertAfterLastTemp}`);

	runInAction(() => {
		if (targetData.saiUpdater) {
			targetData.saiUpdater(null, null, (prev: any[]) => {
				let res: any[] = [];

				if (insertAfterLastTemp) {
					let lastTempIndex = -1;
					for (let i = 0; i < prev.length; i++) {
						if (prev[i][tempFlag]) lastTempIndex = i;
					}
					if (lastTempIndex !== -1) {
						const newArray = [...prev];
						newArray.splice(lastTempIndex + 1, 0, tempData);
						console.log(`[OptimisticUpdate] Inserted after last temp at index ${lastTempIndex + 1}`);
						return newArray;
					}
				}

				if (addStrategy === 'start') res = [tempData, ...prev];
				else res = [...prev, tempData];

				return res;
			}, 'id', targetCacheId, options.optimisticUpdate?.updateCache);

			if (targetData.data) targetData.data = { ...targetData.data };
		}

		if (options.optimisticUpdate?.onAddedTempData) {
			options.optimisticUpdate.onAddedTempData(tempData);
		}
	});
}

function itemMatchesDeleteId(item: any, deleteId: string | number, deleteIdKey: string): boolean {
	if (deleteIdKey === 'id') return getServerId(item) === String(deleteId);
	return String(item[deleteIdKey]) === String(deleteId);
}

function deleteOptimisticDataFromUI(m: any, deleteId: string | number, data: Partial<MobxSaiWsInstance<any>>, options: MobxSaiWsOptions, pathToArray?: string) {
	const optimistic = options.optimisticUpdate;
	const targetCacheId = optimistic?.targetCacheId;
	const deleteIdKey = optimistic?.tempIdKey || 'id';
	const actualPathToArray = pathToArray || options.pathToArray;

	if (!actualPathToArray) {
		console.warn(`[OptimisticUpdate] pathToArray is not defined, cannot delete from UI`);
		return;
	}

	if (!data) return;

	console.log(`[OptimisticUpdate] Deleting optimistic data from UI: ${deleteIdKey}=${deleteId}`);

	runInAction(() => {
		if (data.saiUpdater) {
			data.saiUpdater(null, null, (prev: any[]) => prev.filter((item: any) => !itemMatchesDeleteId(item, deleteId, deleteIdKey)), deleteIdKey, targetCacheId, options.optimisticUpdate?.updateCache);
			if (data.data) data.data = { ...data.data };
		}
	});
}

export function createOptimisticData(
	m: any,
	body: any,
	options: MobxSaiWsOptions,
	requestId: string,
	data: Partial<MobxSaiWsInstance<any>>
): { tempId: string; tempData: any; } | null {
	const optimistic = options.optimisticUpdate;
	if (!optimistic?.enabled || !optimistic.createTempData) return null;

	try {
		const tempId = generateTempId(m);
		const tempIdKey = optimistic.tempIdKey || 'id';
		const tempFlag = optimistic.tempFlag || 'isTemp';

		const context: any = { tempId };

		if (optimistic.files) {
			const filesArray = Array.isArray(optimistic.files.data) ? optimistic.files.data : [optimistic.files.data];
			context.fileStates = filesArray.map((file: any, index: number) => createEnrichedFileState(file, tempId, index));
		}

		const tempData = observable(optimistic.createTempData(body, context));

		tempData[tempIdKey] = tempId;
		tempData[tempFlag] = true;

		if (optimistic.files) {
			const pathInTempData = optimistic.files.pathInTempData || 'files';
			const filesArray = Array.isArray(optimistic.files.data) ? optimistic.files.data : [optimistic.files.data];
			const fileStates = filesArray.map((file: any, index: number) => createEnrichedFileState(file, tempId, index));
			tempData[pathInTempData] = fileStates;
			console.log(`[OptimisticUpdate] Set ${fileStates.length} fileStates to ${pathInTempData} in tempData before UI add`);
		}

		console.log(`[OptimisticUpdate] Created temp data:`, tempId);

		m.tempDataMap.set(requestId, { tempId, tempData, options });

		addOptimisticDataToUI(m, tempData, data, options);

		if (optimistic.files) {
			startFileUploads(m, requestId, tempId, tempData, options, data, body);
		}

		return { tempId, tempData };
	} catch (error) {
		console.error('[OptimisticUpdate] Failed to create temp data:', error);
		return null;
	}
}

export function deleteOptimisticData(m: any, deleteId: string | number, data: Partial<MobxSaiWsInstance<any>>, options: MobxSaiWsOptions, requestId: string) {
	const optimistic = options.optimisticUpdate;
	const targetCacheId = optimistic?.targetCacheId;

	let targetData: any = data;
	let pathToArray = options.pathToArray;

	if (targetCacheId) {
		const targetCacheEntry = m.requestCache.get(formatId(targetCacheId));
		if (targetCacheEntry?.data) {
			targetData = targetCacheEntry.data;
			pathToArray = targetCacheEntry.options?.pathToArray || options.pathToArray;
			console.log(`[OptimisticUpdate] Using target cache for deletion: ${targetCacheId}, pathToArray: ${pathToArray}`);
		} else {
			console.warn(`[OptimisticUpdate] Target cache ${targetCacheId} not found, using current data`);
		}
	}

	if (!pathToArray) {
		console.warn(`[OptimisticUpdate] pathToArray is not defined, cannot delete`);
		return;
	}

	if (!targetData || !targetData.data) {
		console.warn(`[OptimisticUpdate] Target data not found, cannot delete`);
		return;
	}

	const arrayData = m.getPathValue(targetData.data, pathToArray);
	if (!Array.isArray(arrayData)) {
		console.warn(`[OptimisticUpdate] Data at pathToArray is not an array: ${pathToArray}`);
		return;
	}

	const deleteIdKey = optimistic?.tempIdKey || 'id';
	const deletedItem = arrayData.find((item: any) => itemMatchesDeleteId(item, deleteId, deleteIdKey));

	if (!deletedItem) {
		const existingRestoreEntry = Array.from(m.restoreOptimisticDataMap.entries()).find((entryTuple) => {
			const [_, entry] = entryTuple as [string, any];
			const entryData = entry.data;
			return entryData && itemMatchesDeleteId(entryData, deleteId, deleteIdKey);
		});

		if (existingRestoreEntry) {
			console.log(`[OptimisticUpdate] Item ${deleteIdKey}=${deleteId} was already deleted in a previous pending request, skipping`);
			return;
		}

		console.log(`[OptimisticUpdate] Item ${deleteIdKey}=${deleteId} not found in array and not in restore map - already deleted successfully, skipping`);
		return;
	}

	m.restoreOptimisticDataMap.set(requestId, { data: { ...deletedItem }, options: { ...options, pathToArray } });

	console.log(`[OptimisticUpdate] Saved deleted item for restoration: ${deleteId}`);

	deleteOptimisticDataFromUI(m, deleteId, targetData, options, pathToArray);
}

/**
 * Remove multiple items from cache optimistically and store all for restore on error.
 */
export function deleteOptimisticDataMultiple(m: any, deleteIds: (string | number)[], data: Partial<MobxSaiWsInstance<any>>, options: MobxSaiWsOptions, requestId: string) {
	const optimistic = options.optimisticUpdate;
	const targetCacheId = optimistic?.targetCacheId;
	const deleteIdKey = optimistic?.tempIdKey || 'id';

	let targetData: any = data;
	let pathToArray = options.pathToArray;

	if (targetCacheId) {
		const targetCacheEntry = m.requestCache.get(formatId(targetCacheId));
		if (targetCacheEntry?.data) {
			targetData = targetCacheEntry.data;
			pathToArray = targetCacheEntry.options?.pathToArray || options.pathToArray;
		}
	}

	if (!pathToArray || !targetData?.data) return;

	const arrayData = m.getPathValue(targetData.data, pathToArray);
	if (!Array.isArray(arrayData)) return;

	const matchesDeleteIds = deleteIdKey === 'id'
		? (item: any) => deleteIds.some((id) => getServerId(item) === String(id))
		: (item: any) => deleteIds.some((id) => String(item[deleteIdKey]) === String(id));
	const toRestore = arrayData.filter((item: any) => matchesDeleteIds(item));
	if (toRestore.length === 0) return;

	runInAction(() => {
		if (targetData.saiUpdater) {
			targetData.saiUpdater(null, null, (prev: any[]) => prev.filter((item: any) => !matchesDeleteIds(item)), deleteIdKey, targetCacheId, options.optimisticUpdate?.updateCache);
			if (targetData.data) targetData.data = { ...targetData.data };
		}
	});

	m.restoreOptimisticDataMap.set(requestId, { data: toRestore, options: { ...options, pathToArray } });
	console.log(`[OptimisticUpdate] Saved ${toRestore.length} deleted items for restoration`);
}

function updateTempDataFiles(m: any, requestId: string, tempId: string, tempData: any, pathInTempData: string, options: MobxSaiWsOptions) {
	const tracking = m.fileUploadTracking.get(requestId);
	if (!tracking) return;

	const optimistic = options.optimisticUpdate;
	const targetCacheId = optimistic?.targetCacheId;
	const pathToArray = options.pathToArray;

	if (!pathToArray) return;

	let targetData = tracking.data;

	if (targetCacheId) {
		const targetCacheEntry = m.requestCache.get(formatId(targetCacheId));
		if (targetCacheEntry?.data) {
			targetData = targetCacheEntry.data;
			console.log(`[updateTempDataFiles] Using target cache: ${targetCacheId}`);
		} else {
			console.warn(`[updateTempDataFiles] Target cache ${targetCacheId} not found, using tracking data`);
		}
	}

	if (!targetData || !targetData.data) {
		console.warn(`[updateTempDataFiles] No target data available for requestId: ${requestId}`);
		return;
	}

	const arrayData = m.getPathValue(targetData.data, pathToArray);
	if (!Array.isArray(arrayData)) {
		console.warn(`[updateTempDataFiles] Data at pathToArray is not an array: ${pathToArray}`);
		return;
	}

	const tempIdKey = optimistic?.tempIdKey || 'id';
	const itemIndex = arrayData.findIndex((item: any) => item[tempIdKey] === tempId);

	if (itemIndex !== -1) {
		console.log(`[updateTempDataFiles] Found item at index ${itemIndex} for tempId: ${tempId}`);

		runInAction(() => {
			const item = arrayData[itemIndex];

			if (!item[pathInTempData]) {
				item[pathInTempData] = tracking.fileStates;
				console.log(`[updateTempDataFiles] Set ${tracking.fileStates.length} fileStates to ${pathInTempData}, first state hasFile: ${!!item[pathInTempData][0]?.file}`);
			} else {
				tracking.fileStates.forEach((newState: any, index: number) => {
					if (item[pathInTempData][index]) {
						const existingState = item[pathInTempData][index];
						const preservedFile = existingState.file || newState.file;

						// Обновляем только статус загрузки и прогресс, НЕ трогаем URL'ы
						if (newState.progress !== undefined) existingState.progress = newState.progress;
						if (newState.status !== undefined) existingState.status = newState.status;
						if (newState.error !== undefined) existingState.error = newState.error;
						if (newState.result !== undefined) existingState.result = newState.result;
						if (newState.uploadProgress !== undefined) existingState.uploadProgress = newState.uploadProgress;
						if (newState.uploadedBytes !== undefined) existingState.uploadedBytes = newState.uploadedBytes;
						if (newState.totalBytes !== undefined) existingState.totalBytes = newState.totalBytes;
						if (newState.isUploading !== undefined) existingState.isUploading = newState.isUploading;
						if (newState.isCompressing !== undefined) existingState.isCompressing = newState.isCompressing;
						if (newState.currentStage !== undefined) existingState.currentStage = newState.currentStage;
						if (newState.compressionProgress !== undefined) existingState.compressionProgress = newState.compressionProgress;
						if ((newState as any).thumbnailGenerated !== undefined) (existingState as any).thumbnailGenerated = (newState as any).thumbnailGenerated;
						if (newState.media_type !== undefined) existingState.media_type = newState.media_type;
						if (newState.width !== undefined) existingState.width = newState.width;
						if (newState.height !== undefined) existingState.height = newState.height;
						if (newState.duration !== undefined) existingState.duration = newState.duration;

						if (newState.file) existingState.file = newState.file;
						else if (preservedFile && !existingState.file) existingState.file = preservedFile;

						console.log(`[updateTempDataFiles] Updated fileState at index ${index}, hasFile: ${!!existingState.file}, status: ${existingState.status}, progress: ${existingState.progress}, preserved local URLs`);
					} else {
						item[pathInTempData][index] = newState;
						console.log(`[updateTempDataFiles] Added new fileState at index ${index}, hasFile: ${!!newState.file}`);
					}
				});

				if (item[pathInTempData].length < tracking.fileStates.length) {
					for (let i = item[pathInTempData].length; i < tracking.fileStates.length; i++) {
						item[pathInTempData][i] = tracking.fileStates[i];
					}
				}
			}

			console.log(`[updateTempDataFiles] Final media_items:`, item[pathInTempData]?.map((s: any) => ({
				id: s.id, status: s.status, progress: s.progress, uploadProgress: s.uploadProgress, hasFile: !!s.file, fileUri: s.file?.uri || s.file?.file?.uri || 'no uri'
			})));

			if (targetData && typeof targetData.data === 'object') targetData.data = { ...targetData.data };
		});
	} else {
		console.warn(`[updateTempDataFiles] Item not found in array for tempId: ${tempId}, array length: ${arrayData.length}`);
	}
}

function checkFileUploadCompletion(m: any, requestId: string): boolean {
	const tracking = m.fileUploadTracking.get(requestId);
	if (!tracking) return false;

	if (tracking.realMessageSent) {
		console.log(`[FileUpload] Real message already sent for ${requestId}, skipping`);
		return true;
	}

	const { fileStates, requestId: reqId, tempData, options } = tracking;
	const allCompleted = fileStates.every((s: any) => s.status === 'completed');
	const hasErrors = fileStates.some((s: any) => s.status === 'error');
	const allFinished = fileStates.every((s: any) => s.status === 'completed' || s.status === 'error');

	if (allFinished) {
		if (tracking.checkInterval) {
			clearInterval(tracking.checkInterval);
			tracking.checkInterval = undefined;
		}

		console.log(`[FileUpload] All uploads finished for ${reqId}:`, { allCompleted, hasErrors, fileStates: fileStates.map((s: any) => ({ id: s.upload_id, status: s.status })) });

		if (allCompleted) {
			tracking.realMessageSent = true;
			console.log(`[FileUpload] All files uploaded successfully, sending real message`);
			sendRealMessageAfterUploads(m, reqId, tempData, options);
		} else if (hasErrors) {
			console.error(`[FileUpload] Some files failed to upload, not sending message`);
		}

		const pendingReplacement = m.pendingRealDataReplacements.get(reqId);
		if (pendingReplacement && allCompleted) {
			console.log(`[FileUpload] All files completed successfully, now replacing optimistic with real data`);
			m.pendingRealDataReplacements.delete(reqId);
			replaceOptimisticDataWithReal(m, reqId, pendingReplacement.realData, pendingReplacement.data, pendingReplacement.options);
		} else if (pendingReplacement && hasErrors) {
			console.log(`[FileUpload] Some files failed, not replacing optimistic data`);
		}

		return true;
	}

	return false;
}

function cleanupFileUploads(m: any, requestId: string) {
	const tracking = m.fileUploadTracking.get(requestId);
	if (!tracking) return;

	if (tracking.checkInterval) {
		clearInterval(tracking.checkInterval);
		tracking.checkInterval = undefined;
	}

	const fileServicesStore = getFileServicesStore();
	tracking.uploadIds.forEach((uploadId: string) => {
		fileServicesStore.unregisterProgressCallback(uploadId);
	});

	m.fileUploadTracking.delete(requestId);
	for (const [newRequestId, oldRequestId] of m.fileUploadRequestIdMap.entries()) {
		if (oldRequestId === requestId) m.fileUploadRequestIdMap.delete(newRequestId);
	}
	console.log(`[FileUpload] Cleaned up ${tracking.uploadIds.length} file uploads for request ${requestId}`);
}

/**
 * Filters data by excluding given keys from replacement.
 * Supports nested paths with wildcard (e.g. 'media_items.*.file_url').
 *
 * @param source - New data from server (extractedRealData)
 * @param target - Existing UI data (existingItem)
 * @param ignoreKeys - Keys to keep from target instead of source
 */
function filterIgnoredKeys(source: any, target: any, ignoreKeys: string[] = []): any {
	if (!ignoreKeys || ignoreKeys.length === 0) {
		return { ...source };
	}

	const result = { ...source };

	for (const ignoreKey of ignoreKeys) {
		if (ignoreKey.includes('.*.')) {
			const [arrayKey, nestedKey] = ignoreKey.split('.*.');

			if (Array.isArray(target[arrayKey])) {
				if (Array.isArray(source[arrayKey])) {
					result[arrayKey] = source[arrayKey].map((sourceItem: any, index: number) => {
						const targetItem = target[arrayKey][index];
						if (targetItem && nestedKey in targetItem) {
							return { ...sourceItem, [nestedKey]: targetItem[nestedKey] };
						}
						return sourceItem;
					});
				} else {
					result[arrayKey] = target[arrayKey];
				}
			}
		} else {
			if (ignoreKey in target && target[ignoreKey] !== undefined) {
				result[ignoreKey] = target[ignoreKey];
			}
		}
	}

	return result;
}

async function uploadSingleFile(
	m: any,
	file: any,
	uploadId: string,
	requestId: string,
	tempId: string,
	tempData: any,
	pathInTempData: string,
	fileState: FileUploadState,
	options: MobxSaiWsOptions
) {
	try {
		// @ts-ignore
		const { uploadSingleFileChunked } = await import('./chunked-upload');
		// @ts-ignore
		const { getAuthToken } = await import('../ws-manager/getters');

		const accessToken = getAuthToken();

		await uploadSingleFileChunked(
			m,
			file,
			uploadId,
			requestId,
			tempId,
			tempData,
			pathInTempData,
			fileState,
			options,
			accessToken
		);

		checkFileUploadCompletion(m, requestId);
	} catch (error: any) {
		if ((fileState as any).cancelled) return;
		console.error(`[FileUpload] Upload failed for ${uploadId}:`, error);

		runInAction(() => {
			fileState.status = 'error';
			fileState.isCompressing = false;
			fileState.isUploading = false;
			fileState.error = { message: error?.message || 'Upload failed' };
			fileState.currentStage = 'error';
		});

		updateTempDataFiles(m, requestId, tempId, tempData, pathInTempData, options);

		if (options.optimisticUpdate?.files?.onFileError) {
			options.optimisticUpdate.files.onFileError({ message: error?.message || 'Upload failed' }, uploadId);
		}

		checkFileUploadCompletion(m, requestId);
	}
}

function startFileUploads(m: any, requestId: string, tempId: string, tempData: any, options: MobxSaiWsOptions, data: Partial<MobxSaiWsInstance<any>>, requestBody?: any) {
	const optimistic = options.optimisticUpdate;
	if (!optimistic?.files) return;

	const filesArray = Array.isArray(optimistic.files.data) ? optimistic.files.data : [optimistic.files.data];

	const pathInTempDataForUploads = optimistic.files.pathInTempData || 'files';
	let fileStates: FileUploadState[];

	if (tempData[pathInTempDataForUploads] && Array.isArray(tempData[pathInTempDataForUploads])) {
		fileStates = tempData[pathInTempDataForUploads];
		console.log(`[startFileUploads] Using existing fileStates from tempData, count: ${fileStates.length}`);
	} else {
		fileStates = filesArray.map((file: any, index: number) => createEnrichedFileState(file, tempId, index));
		tempData[pathInTempDataForUploads] = fileStates;
		console.log(`[startFileUploads] Created new fileStates, count: ${fileStates.length}`);
	}

	const uploadIds = fileStates.map((s: any) => s.upload_id);
	m.fileUploadTracking.set(requestId, { uploadIds, fileStates, requestId, tempData, options, data, requestBody });

	const pathInTempData = optimistic.files.pathInTempData || 'files';

	const runSequentialUploads = async () => {
		for (let index = 0; index < fileStates.length; index++) {
			const fileState = fileStates[index];
			const file = filesArray[index];
			if ((fileState as any).cancelled) continue;
			try {
				await uploadSingleFile(m, file, fileState.upload_id, requestId, tempId, tempData, pathInTempData, fileState, options);
			} catch (e) {
				if ((fileState as any).cancelled) continue;
				console.error(`[FileUpload] Single file upload failed for ${fileState.upload_id}:`, e);
			}
		}
	};

	runSequentialUploads()
		.then(() => {
			console.log(`[FileUpload] All HTTP uploads initiated for ${requestId}, waiting for WebSocket confirmations`);

			const tracking = m.fileUploadTracking.get(requestId);
			if (tracking) {
				tracking.checkInterval = setInterval(() => checkFileUploadCompletion(m, requestId), 100);

				setTimeout(() => {
					if (tracking.checkInterval) {
						clearInterval(tracking.checkInterval);
						tracking.checkInterval = undefined;
						console.error(`[FileUpload] Timeout waiting for file uploads to complete`);
					}
				}, 300000);
			}
		})
		.catch((error) => console.error(`[FileUpload] Upload execution error:`, error));
}

export function updateOptimisticData(m: any, updateId: string | number, body: any, data: Partial<MobxSaiWsInstance<any>>, options: MobxSaiWsOptions, requestId: string) {
	const optimistic = options.optimisticUpdate;
	if (!optimistic?.updateTempData) {
		console.warn(`[OptimisticUpdate] updateTempData is not defined for updateMode`);
		return;
	}

	const targetCacheId = optimistic?.targetCacheId;

	let targetData: any = data;
	let pathToArray = options.pathToArray;

	if (targetCacheId) {
		const targetCacheEntry = m.requestCache.get(formatId(targetCacheId));
		if (targetCacheEntry?.data) {
			targetData = targetCacheEntry.data;
			pathToArray = targetCacheEntry.options?.pathToArray || options.pathToArray;
			console.log(`[OptimisticUpdate] Using target cache for update: ${targetCacheId}, pathToArray: ${pathToArray}`);
		} else {
			console.warn(`[OptimisticUpdate] Target cache ${targetCacheId} not found, using current data`);
		}
	}

	if (!pathToArray) {
		console.warn(`[OptimisticUpdate] pathToArray is not defined, cannot update`);
		return;
	}

	if (!targetData || !targetData.data) {
		console.warn(`[OptimisticUpdate] Target data not found, cannot update`);
		return;
	}

	const arrayData = m.getPathValue(targetData.data, pathToArray);
	if (!Array.isArray(arrayData)) {
		console.warn(`[OptimisticUpdate] Data at pathToArray is not an array: ${pathToArray}`);
		return;
	}

	const updateIdKey = optimistic?.tempIdKey || 'id';
	const currentItem = arrayData.find((item: any) => item[updateIdKey] === updateId);

	if (!currentItem) {
		console.warn(`[OptimisticUpdate] Item with ${updateIdKey}=${updateId} not found for update`);
		return;
	}

	m.restoreOptimisticDataMap.set(requestId, { data: { ...currentItem }, options: { ...options, pathToArray } });

	const context: any = { updateId };
	const updatedData = optimistic.updateTempData(body, currentItem, context);

	console.log(`[OptimisticUpdate] Updating optimistic data: ${updateIdKey}=${updateId}`);

	runInAction(() => {
		if (targetData.saiUpdater) {
			targetData.saiUpdater(null, null, (prev: any[]) => {
				return prev.map((item: any) => (item[updateIdKey] === updateId ? { ...item, ...updatedData } : item));
			}, updateIdKey, targetCacheId, options.optimisticUpdate?.updateCache);

			if (targetData.data) targetData.data = { ...targetData.data };
		}
	});
}

export function updateOptimisticDataWithReal(m: any, requestId: string, realData: any, data: Partial<MobxSaiWsInstance<any>>, options: MobxSaiWsOptions) {
	const optimistic = options.optimisticUpdate;
	if (!optimistic?.updateMode || !optimistic?.updateId) return;

	const targetCacheId = optimistic?.targetCacheId;
	const updateId = optimistic.updateId;
	const updateIdKey = optimistic?.tempIdKey || 'id';

	let targetData: any = data;
	let pathToArray = options.pathToArray;

	if (targetCacheId) {
		const targetCacheEntry = m.requestCache.get(formatId(targetCacheId));
		if (targetCacheEntry?.data) {
			targetData = targetCacheEntry.data;
			pathToArray = targetCacheEntry.options?.pathToArray || options.pathToArray;
			console.log(`[OptimisticUpdate] Using target cache for real update: ${targetCacheId}, pathToArray: ${pathToArray}`);
		} else {
			console.warn(`[OptimisticUpdate] Target cache ${targetCacheId} not found, using current data`);
		}
	}

	if (!pathToArray) {
		console.warn(`[OptimisticUpdate] pathToArray is not defined, cannot update with real data`);
		return;
	}

	if (!targetData || !targetData.data) {
		console.warn(`[OptimisticUpdate] Target data not found, cannot update with real data`);
		return;
	}

	let extractedRealData = realData;
	if (optimistic?.extractRealData) {
		const tempEntry = m.tempDataMap.get(requestId);
		const context = tempEntry ? { temp_id: tempEntry.tempId, tempData: tempEntry.tempData } : undefined;
		extractedRealData = optimistic.extractRealData(realData, context);
	} else if (pathToArray && typeof realData === 'object' && realData !== null) {
		const singularKey = pathToArray.endsWith('s') ? pathToArray.slice(0, -1) : pathToArray;
		if (singularKey in realData && realData[singularKey] != null) {
			extractedRealData = realData[singularKey];
			console.log(`[OptimisticUpdate] Auto-extracted data from response.${singularKey}`);
		} else {
			extractedRealData = realData;
		}
	}

	console.log(`[OptimisticUpdate] Updating element ${updateIdKey}=${updateId} with real data from server`);

	runInAction(() => {
		if (targetData.saiUpdater) {
			targetData.saiUpdater(null, null, (prev: any[]) => {
				return prev.map((item: any) => (item[updateIdKey] === updateId ? { ...item, ...extractedRealData } : item));
			}, updateIdKey, targetCacheId, options.optimisticUpdate?.updateCache);

			if (targetData.data) targetData.data = { ...targetData.data };
		}
	});

	if (optimistic?.onSuccess) {
		const restoreEntry = m.restoreOptimisticDataMap.get(requestId);
		const originalData = restoreEntry?.data;
		if (originalData) optimistic.onSuccess(originalData, extractedRealData);
	}
}

export function replaceOptimisticDataWithReal(m: any, requestId: string, realData: any, data: Partial<MobxSaiWsInstance<any>>, options: MobxSaiWsOptions) {
	const tempEntry = m.tempDataMap.get(requestId);
	if (!tempEntry) {
		console.log(`[OptimisticUpdate] No temp data found for request ${requestId}`);
		return;
	}

	const tempOptions = tempEntry.options;
	const hasFiles = tempOptions.optimisticUpdate?.files;
	const tracking = m.fileUploadTracking.get(requestId);

	console.log(`[OptimisticUpdate] replaceOptimisticDataWithReal called for requestId: ${requestId}, hasFiles: ${!!hasFiles}, hasTracking: ${!!tracking}`);

	if (hasFiles) {
		if (tracking) {
			// Проверяем, что ВСЕ файлы успешно загружены (completed), а не в ошибке
			const allCompleted = tracking.fileStates.every((s: any) => s.status === 'completed');
			const completedCount = tracking.fileStates.filter((s: any) => s.status === 'completed').length;
			const totalCount = tracking.fileStates.length;
			const hasErrors = tracking.fileStates.some((s: any) => s.status === 'error');

			console.log(`[OptimisticUpdate] File upload status: ${completedCount}/${totalCount} completed, hasErrors: ${hasErrors}`);

			if (!allCompleted) {
				console.log(`[OptimisticUpdate] Files still uploading or have errors, saving real data for later replacement`);
				m.pendingRealDataReplacements.set(requestId, { realData, data, options: tempOptions });
				return;
			}
			console.log(`[OptimisticUpdate] All files completed successfully, proceeding with replacement`);
		} else {
			console.log(`[OptimisticUpdate] Files expected but tracking not found for ${requestId}, saving for later replacement`);
			m.pendingRealDataReplacements.set(requestId, { realData, data, options: tempOptions });
			return;
		}
	}

	const { tempId, tempData } = tempEntry;
	const finalOptions = tempEntry.options || options;
	const optimistic = finalOptions.optimisticUpdate;
	const tempIdKey = optimistic?.tempIdKey || 'id';
	const targetCacheId = optimistic?.targetCacheId;

	let targetData: any = data;
	if (targetCacheId) {
		const targetCacheEntry = m.requestCache.get(formatId(targetCacheId));
		if (targetCacheEntry?.data) {
			targetData = targetCacheEntry.data;
			console.log(`[OptimisticUpdate] Using target cache for replacement: ${targetCacheId}`);
		}
	}

	if (!targetData) return;

	console.log(`[OptimisticUpdate] Replacing temp data ${tempId} with real data`);

	let extractedRealData = realData;
	if (optimistic?.extractRealData) {
		const context = { temp_id: tempId, tempData };
		extractedRealData = optimistic.extractRealData(realData, context);
	}

	const ignoreKeys = optimistic?.extractIgnoreKeys || [];

	runInAction(() => {
		if (targetData.saiUpdater) {
			targetData.saiUpdater(null, null, (prev: any[]) => {
				const tempIndex = prev.findIndex((item: any) => item[tempIdKey] === tempId);

				if (tempIndex !== -1) {
					const existingItem = prev[tempIndex];
					const hasExistingMedia = Array.isArray(existingItem?.media_items) && existingItem.media_items.length > 0;

					const merged = filterIgnoredKeys(extractedRealData, existingItem, ignoreKeys);

					if (hasExistingMedia) {
						merged.media_items = existingItem.media_items;
						console.log(`[OptimisticUpdate] Preserved existing media_items with local URLs (${existingItem.media_items.length} items)`);
					}

					const replacedItem = { ...merged, isTemp: false };
					if (hasFiles && replacedItem.fileUploadStates) {
						delete replacedItem.fileUploadStates;
					}
					const newArray = [...prev];
					newArray[tempIndex] = replacedItem;
					console.log(`[OptimisticUpdate] Replaced temp at index ${tempIndex} with new object (no in-place mutation so UI re-renders)`);
					return newArray;
				}

				console.log(`[OptimisticUpdate] Temp not found, adding real data`);
				return [{ ...extractedRealData, isTemp: false }, ...prev];
			}, 'id', targetCacheId, finalOptions.optimisticUpdate?.updateCache);

			if (targetData.data) targetData.data = { ...targetData.data };
		}
	});

	if (optimistic?.onSuccess) optimistic.onSuccess(tempData, extractedRealData);

	cleanupFileUploads(m, requestId);
	m.tempDataMap.delete(requestId);
}

async function sendRealMessageAfterUploads(m: any, requestId: string, tempData: any, options: MobxSaiWsOptions) {
	const tracking = m.fileUploadTracking.get(requestId);
	if (!tracking) {
		console.error(`[FileUpload] No tracking found for ${requestId}`);
		return;
	}

	console.log(`[FileUpload] File states before extraction:`, tracking.fileStates.map((s: any) => ({ id: s.upload_id, status: s.status, progress: s.progress, hasResult: !!s.result, url: s.result?.url })));

	const uploadedUrls = tracking.fileStates.filter((s: any) => s.status === 'completed' && s.result?.url).map((s: any) => s.result!.url);

	console.log(`[FileUpload] Sending real message with ${uploadedUrls.length} uploaded files`);

	const tempEntry = m.tempDataMap.get(requestId);
	if (!tempEntry) {
		console.error(`[FileUpload] No temp entry found for ${requestId}`);
		return;
	}

	const originalMessage = tracking.requestBody ?? m.requestParamsMap.get(requestId);
	if (!originalMessage) {
		console.error(`[FileUpload] No original message found for ${requestId}`);
		return;
	}

	const filesConfig = options.optimisticUpdate?.files;
	let filesData: any;

	const messageCopy = { ...originalMessage };

	if (filesConfig?.extractUploadedFiles) {
		filesData = filesConfig.extractUploadedFiles(tracking.fileStates, messageCopy);
	} else {
		filesData = uploadedUrls;
	}

	const filesParamKey = filesConfig?.filesParamKey ?? 'file_urls';

	const messageWithFiles =
		filesParamKey === '' && typeof filesData === 'object' && filesData !== null && !Array.isArray(filesData)
			? { ...messageCopy, ...filesData }
			: { ...messageCopy, [filesParamKey]: filesData };

	const targetCacheId = options.optimisticUpdate?.targetCacheId;
	let targetData: Partial<MobxSaiWsInstance<any>> | null = null;

	if (targetCacheId) {
		const targetCacheEntry = m.requestCache.get(formatId(targetCacheId));
		if (targetCacheEntry?.data) targetData = targetCacheEntry.data;
	}

	if (!targetData) {
		console.error(`[FileUpload] No target data found`);
		return;
	}

	const newRequestId = Date.now();
	const message: WebSocketMessage = {
		id: newRequestId,
		type: 'service_call',
		service: options.service,
		method: options.method,
		data: messageWithFiles,
		timestamp: Date.now(),
		metadata: { headers: {}, correlation_id: null, auth_required: !options.withoutAuth },
	};

	m.requestParamsMap.set(newRequestId.toString(), messageWithFiles);
	m.fileUploadRequestIdMap.set(newRequestId.toString(), requestId);
	const cacheId = options.id ? formatId(options.id) : undefined;
	if (cacheId) m.requestToIdMap.set(newRequestId.toString(), cacheId);

	console.log(`[FileUpload] Sending real request with ID ${newRequestId}`, {
		service: options.service,
		method: options.method,
		filesParamKey,
		filesCount: Array.isArray(filesData) ? filesData.length : 'not array',
		messageKeys: Object.keys(messageWithFiles),
	});

	if (options.bypassQueue) {
		m.pendingRequests.set(newRequestId.toString(), true);
		await m.sendDirectMessage(message, targetData, options);
	} else {
		return new Promise<boolean | undefined>((resolve) => {
			m.requestQueue.push({
				message,
				data: targetData!,
				options: { ...options },
				resolve,
				requestId: newRequestId.toString(),
				tempId: tempEntry.tempId,
				retryCount: 0,
			});

			if (!m.isProcessingQueue) m.processNextRequest();
		});
	}
}

export function restoreOptimisticData(m: any, requestId: string, restoreEntry: { data: any; options: MobxSaiWsOptions; }, data: Partial<MobxSaiWsInstance<any>>, options: MobxSaiWsOptions) {
	const optimistic = options.optimisticUpdate;
	const targetCacheId = optimistic?.targetCacheId;
	const idKey = optimistic?.tempIdKey || 'id';
	const pathToArray = restoreEntry.options.pathToArray;

	if (!pathToArray) {
		console.warn(`[OptimisticUpdate] pathToArray is not defined, cannot restore`);
		return;
	}

	let targetData: any = data;
	if (targetCacheId) {
		const targetCacheEntry = m.requestCache.get(formatId(targetCacheId));
		if (targetCacheEntry?.data) {
			targetData = targetCacheEntry.data;
			console.log(`[OptimisticUpdate] Using target cache for restoration: ${targetCacheId}`);
		} else {
			console.warn(`[OptimisticUpdate] Target cache ${targetCacheId} not found, using current data`);
		}
	}

	if (!targetData) {
		console.warn(`[OptimisticUpdate] Target data not found, cannot restore`);
		return;
	}

	const restoredItems = Array.isArray(restoreEntry.data) ? restoreEntry.data : [restoreEntry.data];

	console.log(`[OptimisticUpdate] Restoring ${restoredItems.length} optimistic item(s)`);

	runInAction(() => {
		if (targetData.saiUpdater) {
			for (const restoredItem of restoredItems) {
				const restoredId = restoredItem[idKey];
				targetData.saiUpdater(null, null, (prev: any[]) => {
					const existingIndex = prev.findIndex((item: any) => item[idKey] === restoredId);
					if (existingIndex !== -1) {
						const newArray = [...prev];
						newArray[existingIndex] = { ...restoredItem };
						return newArray;
					}
					const addStrategy = optimistic?.addStrategy || 'start';
					return addStrategy === 'start' ? [restoredItem, ...prev] : [...prev, restoredItem];
				}, idKey, targetCacheId, options.optimisticUpdate?.updateCache);
			}
			if (targetData.data) targetData.data = { ...targetData.data };
		}
	});
}

export function removeOptimisticData(m: any, requestId: string, error: any, data: Partial<MobxSaiWsInstance<any>>, options: MobxSaiWsOptions): boolean {
	const tempEntry = m.tempDataMap.get(requestId);
	if (!tempEntry) return false;

	const { tempId, tempData } = tempEntry;
	const optimistic = options.optimisticUpdate;
	const tempIdKey = optimistic?.tempIdKey || 'id';
	const targetCacheId = optimistic?.targetCacheId;

	let shouldKeep = false;
	if (optimistic?.onError) shouldKeep = optimistic.onError(tempData, error);

	if (shouldKeep) {
		console.log(`[OptimisticUpdate] Keeping temp data ${tempId} for retry`);
		return true;
	}

	let targetData: any = data;
	if (targetCacheId) {
		const targetCacheEntry = m.requestCache.get(formatId(targetCacheId));
		if (targetCacheEntry?.data) {
			targetData = targetCacheEntry.data;
			console.log(`[OptimisticUpdate] Using target cache for removal: ${targetCacheId}`);
		}
	}

	if (!targetData) return false;

	console.log(`[OptimisticUpdate] Removing temp data ${tempId}`);

	runInAction(() => {
		if (targetData.saiUpdater) {
			targetData.saiUpdater(null, null, (prev: any[]) => prev.filter((item: any) => item[tempIdKey] !== tempId), 'id', targetCacheId, options.optimisticUpdate?.updateCache);

			if (targetData.data) targetData.data = { ...targetData.data };
		}
	});

	cleanupFileUploads(m, requestId);
	m.tempDataMap.delete(requestId);
	return false;
}

export function applyPatchInPlace(
	m: any,
	body: any,
	requestId: string,
	data: Partial<MobxSaiWsInstance<any>>,
	options: MobxSaiWsOptions,
	context?: any
): boolean {
	const optimistic = options.optimisticUpdate;
	if (!optimistic?.patchInPlace || !optimistic.createPatch || !optimistic.createRollbackSnapshot || !optimistic.patchPaths?.length) return false;

	const matchIdKey = optimistic.matchIdKey ?? 'id';
	const matchId = optimistic.matchIdFromRequest?.(body);
	if (matchId === undefined || matchId === null) return false;

	const matchItem =
		optimistic.matchItem ??
		(matchIdKey === 'id' ? (item: any, mid: string | number) => getServerId(item) === String(mid) : undefined);
	const itemMatches = matchItem
		? (item: any) => matchItem(item, matchId)
		: (item: any) => String(item[matchIdKey]) === String(matchId);

	const targetCacheId = optimistic.targetCacheId;
	let targetData: any = data;
	let pathToArray = options.pathToArray;

	if (targetCacheId) {
		const targetCacheEntry = m.requestCache.get(formatId(targetCacheId));
		if (targetCacheEntry?.data) {
			targetData = targetCacheEntry.data;
			pathToArray = targetCacheEntry.options?.pathToArray ?? options.pathToArray;
		}
	}

	if (!pathToArray || !targetData?.data) return false;

	const arrayData = m.getPathValue(targetData.data, pathToArray);
	if (!Array.isArray(arrayData)) return false;

	const currentItem = arrayData.find((item: any) => itemMatches(item));
	if (!currentItem) return false;

	const snapshot = optimistic.createRollbackSnapshot(body, currentItem);
	const patch = optimistic.createPatch(body, currentItem, context);
	const patchPaths = optimistic.patchPaths;

	const restore: any = { matchId, matchIdKey, matchItem, itemMatches: null as any, patchPaths, snapshot, pathToArray, targetCacheId, updateCache: optimistic.updateCache };
	if (matchItem) restore.itemMatches = itemMatches;
	if (!m.patchRestoreMap) m.patchRestoreMap = new Map();
	m.patchRestoreMap.set(requestId, restore);

	runInAction(() => {
		if (targetData.saiUpdater) {
			targetData.saiUpdater(null, null, (prev: any[]) => {
				return prev.map((item: any) => {
					if (!itemMatches(item)) return item;
					const next = { ...item };
					for (const k of patchPaths) {
						if (k in patch) (next as any)[k] = patch[k];
					}
					return next;
				});
			}, matchIdKey, targetCacheId, optimistic.updateCache);
			if (targetData.data) targetData.data = { ...targetData.data };
		}
	});

	return true;
}

export function restorePatchInPlace(
	m: any,
	requestId: string,
	data: Partial<MobxSaiWsInstance<any>>,
	options: MobxSaiWsOptions
): void {
	const entry = m.patchRestoreMap?.get(requestId);
	if (!entry) return;

	const { matchId, matchIdKey, itemMatches, patchPaths, snapshot, pathToArray, targetCacheId, updateCache } = entry;
	const isMatch = itemMatches ?? ((item: any) => String(item[matchIdKey]) === String(matchId));
	let targetData: any = data;

	if (targetCacheId) {
		const targetCacheEntry = m.requestCache.get(formatId(targetCacheId));
		if (targetCacheEntry?.data) targetData = targetCacheEntry.data;
	}

	if (!targetData?.saiUpdater) {
		m.patchRestoreMap.delete(requestId);
		return;
	}

	runInAction(() => {
		targetData.saiUpdater(null, null, (prev: any[]) => {
			return prev.map((item: any) => {
				if (!isMatch(item)) return item;
				const next = { ...item };
				for (const k of patchPaths) {
					if (k in snapshot) (next as any)[k] = snapshot[k];
				}
				return next;
			});
		}, matchIdKey, targetCacheId, updateCache);
		if (targetData.data) targetData.data = { ...targetData.data };
	});

	m.patchRestoreMap.delete(requestId);
}

export function confirmPatchInPlace(
	m: any,
	requestId: string,
	response: any,
	data: Partial<MobxSaiWsInstance<any>>,
	options: MobxSaiWsOptions,
	body?: any
): void {
	const entry = m.patchRestoreMap?.get(requestId);
	const optimistic = options.optimisticUpdate;
	if (!optimistic?.patchInPlace || !optimistic.confirmPatch || !entry) return;

	const { matchId, matchIdKey, itemMatches, patchPaths, pathToArray, targetCacheId, updateCache } = entry;
	const isMatch = itemMatches ?? ((item: any) => String(item[matchIdKey]) === String(matchId));
	let targetData: any = data;
	if (targetCacheId) {
		const targetCacheEntry = m.requestCache.get(formatId(targetCacheId));
		if (targetCacheEntry?.data) targetData = targetCacheEntry.data;
	}
	const arrayData = m.getPathValue(targetData?.data ?? {}, pathToArray);
	const currentItem = Array.isArray(arrayData) ? arrayData.find((item: any) => isMatch(item)) : null;
	if (!currentItem) {
		m.patchRestoreMap.delete(requestId);
		return;
	}

	const patch = optimistic.confirmPatch(body ?? m.requestParamsMap?.get?.(requestId), currentItem, response);
	if (patch == null || typeof patch !== 'object') {
		m.patchRestoreMap.delete(requestId);
		return;
	}

	if (!targetData?.saiUpdater) {
		m.patchRestoreMap.delete(requestId);
		return;
	}

	runInAction(() => {
		targetData.saiUpdater(null, null, (prev: any[]) => {
			return prev.map((item: any) => {
				if (!isMatch(item)) return item;
				const next = { ...item };
				for (const k of patchPaths) {
					if (k in patch) (next as any)[k] = patch[k];
				}
				return next;
			});
		}, matchIdKey, targetCacheId, updateCache);
		if (targetData.data) targetData.data = { ...targetData.data };
	});

	m.patchRestoreMap.delete(requestId);
}

export function clearPatchRestore(m: any, requestId: string): void {
	m.patchRestoreMap?.delete(requestId);
}
