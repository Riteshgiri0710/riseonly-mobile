import { runInAction } from 'mobx';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { FileUploadOrchestrator, OverallUploadProgress } from '../upload/FileUploadOrchestrator';
import type { FileUploadState, MobxSaiWsOptions, SaiFile } from '../types';
import { registerCancel, unregisterCancel } from './upload-cancel-registry';
import { logger } from '@lib/helpers';
import { formatDiffData } from '@lib/text';

export async function uploadSingleFileChunked(
	m: any,
	file: SaiFile,
	uploadId: string,
	requestId: string,
	tempId: string,
	tempData: any,
	pathInTempData: string,
	fileState: FileUploadState,
	options: MobxSaiWsOptions,
	accessToken?: string
) {
	try {
		const getExtension = (path: string): string => {
			if (!path) return '';
			const cleanPath = path.split('#')[0].split('?')[0];
			const lastDot = cleanPath.lastIndexOf('.');
			return lastDot > 0 ? cleanPath.substring(lastDot).toLowerCase() : '';
		};

		const fileType = file.type || file.file?.type || '';
		const fileName = file.name || file.filename || file.file?.name || file.file?.filename || '';
		const fileUriForType = file.uri || file.file?.uri || '';

		const isVideo = (() => {
			const rawAsset = file._rawAsset || file.file?._rawAsset;
			if (rawAsset?.mediaType === 'video') return true;
			if (fileType.startsWith('video/')) return true;
			const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp'];
			if (fileName && videoExtensions.includes(getExtension(fileName))) return true;
			if (fileUriForType && videoExtensions.includes(getExtension(fileUriForType))) return true;
			return false;
		})();

		const isImage = (() => {
			if (fileType.startsWith('image/')) return true;
			const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];
			if (fileName && imageExtensions.includes(getExtension(fileName))) return true;
			if (fileUriForType && imageExtensions.includes(getExtension(fileUriForType))) return true;
			return false;
		})();

		const isDocument = !isVideo && !isImage;
		const shouldCompress = isVideo || isImage;

		const fileUri = await getFileUri(file);
		if (!fileUri) {
			console.error(`[ChunkedUpload] Failed to get file URI for ${uploadId}`);
			throw new Error('Failed to get file URI');
		}

		console.log(`[ChunkedUpload] Starting upload for ${uploadId}:`, {
			isVideo,
			isImage,
			isDocument,
			shouldCompress,
			fileUri,
			fileState_file_url: fileState.file_url,
			fileState_url: fileState.url,
			fileState_thumbnail_url: fileState.thumbnail_url,
		});

		const rawType = file.type || file.file?.type || '';
		const contentType = isVideo
			? (rawType.startsWith('video/') ? rawType : 'video/mp4')
			: isImage
				? (rawType || 'image/jpeg')
				: (rawType || 'application/octet-stream');

		runInAction(() => {
			if (shouldCompress) {
				fileState.status = 'compressing';
				fileState.isCompressing = true;
				fileState.isUploading = false;
			} else {
				fileState.status = 'uploading';
				fileState.isCompressing = false;
				fileState.isUploading = true;
			}
		});

		updateTempDataFiles(m, requestId, tempId, tempData, pathInTempData, options);

		if (isVideo && !(fileState as any).thumbnailGenerated) {
			try {
				const cleanForThumb = fileUri.split('#')[0].split('?')[0];
				console.log(`[ChunkedUpload] Generating thumbnail for video ${uploadId}, cleanUri: ${cleanForThumb}`);
				const { uri } = await VideoThumbnails.getThumbnailAsync(cleanForThumb, { time: 0, quality: 0.8 });
				console.log(`[ChunkedUpload] Thumbnail generated for ${uploadId}: ${uri}`);
				runInAction(() => {
					fileState.thumbnail_url = uri;
					(fileState as any).thumbnailGenerated = true;
				});
				console.log(`[ChunkedUpload] Updated fileState for ${uploadId}:`, {
					thumbnail_url: fileState.thumbnail_url,
					file_url: fileState.file_url,
					url: fileState.url,
				});
				updateTempDataFiles(m, requestId, tempId, tempData, pathInTempData, options);
			} catch (e) {
				console.warn('[ChunkedUpload] Video thumbnail failed, using placeholder:', e);
			}
		} else if (isVideo && (fileState as any).thumbnailGenerated) {
			console.log(`[ChunkedUpload] Thumbnail already generated for ${uploadId}, skipping`);
		}

		const orchestrator = new FileUploadOrchestrator();

		registerCancel(fileState.upload_id, () => {
			runInAction(() => {
				(fileState as any).cancelled = true;
			});
			updateTempDataFiles(m, requestId, tempId, tempData, pathInTempData, options);
			void orchestrator.abort();
		});

		try {
			const result = await orchestrator.uploadFile({
				fileUri,
				filename: cleanFilename(file.name || file.filename || 'file'),
				contentType,
				fileContext: 'chat',
				shouldCompress,
				compressionOptions: isVideo ? {
					maxSizeMB: 50,
					targetBitrate: '2M', // Will be converted to 2000000
					targetResolution: { width: 1920, height: 1080 }, // Will use max(1920, 1080) = 1920 as maxSize
				} : {
					maxSizeMB: 1,
					maxWidthOrHeight: 1920,
					quality: 0.8,
				},
				maxParallelUploads: 3,
				accessToken,
				onOverallProgress: (progress: OverallUploadProgress) => {
					runInAction(() => {
						if (progress.stage === 'compressing') {
							fileState.status = 'compressing';
							fileState.isCompressing = true;
							fileState.isUploading = false;
							fileState.compressionProgress = progress.compressionProgress;
							fileState.compressionStage = 'compressing';
							fileState.overallProgress = progress.overallProgress;
							fileState.currentStage = 'compressing';
							fileState.compressedSize = progress.compressedSize;
						} else if (progress.stage === 'uploading') {
							fileState.status = 'uploading';
							fileState.isCompressing = false;
							fileState.isUploading = true;
							fileState.compressionProgress = 100;
							fileState.compressionStage = 'completed';
							fileState.uploadProgress = progress.uploadProgress;
							fileState.uploadedBytes = progress.uploadedBytes;
							fileState.totalBytes = progress.totalBytes;
							fileState.overallProgress = progress.overallProgress;
							fileState.currentStage = 'uploading';
							fileState.compressedSize = progress.compressedSize;
						} else if (progress.stage === 'completing') {
							fileState.status = 'uploading';
							fileState.isUploading = true;
							fileState.uploadProgress = 99;
							fileState.overallProgress = 99;
							fileState.currentStage = 'completing';
						} else if (progress.stage === 'completed') {
							fileState.status = 'completed';
							fileState.isCompressing = false;
							fileState.isUploading = false;
							fileState.compressionProgress = 100;
							fileState.uploadProgress = 100;
							fileState.overallProgress = 100;
							fileState.currentStage = 'completed';
						}

						fileState.progress = progress.overallProgress;
					});

					updateTempDataFiles(m, requestId, tempId, tempData, pathInTempData, options);
				},
			});

			runInAction(() => {
				fileState.status = 'completed';
				fileState.isCompressing = false;
				fileState.isUploading = false;
				fileState.progress = 100;
				fileState.overallProgress = 100;
				fileState.uploadProgress = 100;
				fileState.compressionProgress = 100;
				fileState.currentStage = 'completed';
				fileState.result = {
					url: result.file_url,
					file_url: result.file_url,
					file_name: cleanFilename(file.name || file.filename || 'file'),
					file_size: result.originalSize,
					compressed_size: result.compressedSize,
					media_type: result.media_type,
					mime_type: contentType,
					width: result.width,
					height: result.height,
					duration: result.duration,
					thumbnail_url: result.thumbnail_url,
				};
				if (isVideo) {
					(fileState as any).server_file_url = result.file_url;
					(fileState as any).server_thumbnail_url = result.thumbnail_url;
				}
				if (result.media_type) fileState.media_type = result.media_type;
				if (result.width !== undefined) fileState.width = result.width;
				if (result.height !== undefined) fileState.height = result.height;
				if (result.duration !== undefined) fileState.duration = result.duration;

				logger.info('ChunkedUpload', `[ChunkedUpload] Upload completed for ${uploadId}: ${formatDiffData({
					result_file_url: result.file_url,
					preserved_file_url: fileState.file_url,
					preserved_url: fileState.url,
					preserved_thumbnail_url: fileState.thumbnail_url,
					media_type: fileState.media_type,
				})}`);
			});

			updateTempDataFiles(m, requestId, tempId, tempData, pathInTempData, options);

			if (options.optimisticUpdate?.files?.onFileSuccess) {
				options.optimisticUpdate.files.onFileSuccess(fileState.result, uploadId);
			}

			return result;
		} finally {
			unregisterCancel(fileState.upload_id);
		}
	} catch (error: any) {
		if ((fileState as any).cancelled) return;
		console.error(`[ChunkedUpload] Upload failed for ${uploadId}:`, error);

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

		throw error;
	}
}

/**
 * Clean URI by removing iOS metadata fragments and query parameters
 */
function cleanUri(uri: string): string {
	if (!uri) return uri;
	return uri.split('#')[0].split('?')[0];
}

/**
 * Clean filename by removing # and ? (used in S3 keys; # breaks multipart complete).
 */
function cleanFilename(name: string): string {
	if (!name) return name;
	return name.split('#')[0].split('?')[0];
}

async function getFileUri(file: SaiFile): Promise<string | null> {
	try {
		let selectedUri: string | null = null;

		// Priority 1: file.file.uri (picker provides file:// path here)
		if (file.file?.uri && file.file.uri.startsWith('file://')) {
			selectedUri = file.file.uri;
		}
		// Priority 2: file.uri if it's file://
		else if (file.uri && file.uri.startsWith('file://')) {
			selectedUri = file.uri;
		}
		// Priority 3: Any file.file.uri (even if not file://)
		else if (file.file?.uri) {
			selectedUri = file.file.uri;
		}
		// Priority 4: Any file.uri
		else if (file.uri) {
			selectedUri = file.uri;
		}
		// Priority 5: React Native asset (last resort)
		else if (file._rawAsset) {
			const asset = file._rawAsset;

			// Try asset.uri
			if (asset.uri) {
				selectedUri = asset.uri;
			}
			// Construct ph:// URI (may not work with compressor)
			else if (asset.id) {
				console.warn('[ChunkedUpload] Using ph:// URI - this may not work with compressor');
				selectedUri = `ph://${asset.id}`;
			}
		}

		if (!selectedUri) {
			console.error('[ChunkedUpload] No valid URI found in file:', file);
			return null;
		}

		const cleanedUri = cleanUri(selectedUri);

		if (cleanedUri !== selectedUri) {
			console.log('[ChunkedUpload] Cleaned URI:', { original: selectedUri, cleaned: cleanedUri });
		} else {
			console.log('[ChunkedUpload] Using URI:', cleanedUri);
		}

		return cleanedUri;
	} catch (error) {
		console.error('[ChunkedUpload] Failed to get file URI:', error);
		return null;
	}
}

function updateTempDataFiles(
	m: any,
	requestId: string,
	tempId: string,
	tempData: any,
	pathInTempData: string,
	options: MobxSaiWsOptions
) {
	const tracking = m.fileUploadTracking.get(requestId);
	if (!tracking) return;

	const optimistic = options.optimisticUpdate;
	const targetCacheId = optimistic?.targetCacheId;
	const pathToArray = options.pathToArray;

	if (!pathToArray) return;

	let targetData = tracking.data;

	if (targetCacheId) {
		const { formatId } = require('@lib/text');
		const targetCacheEntry = m.requestCache.get(formatId(targetCacheId));
		if (targetCacheEntry?.data) {
			targetData = targetCacheEntry.data;
		}
	}

	if (!targetData || !targetData.data) {
		return;
	}

	const arrayData = m.getPathValue(targetData.data, pathToArray);
	if (!Array.isArray(arrayData)) {
		return;
	}

	const tempIdKey = optimistic?.tempIdKey || 'id';
	const itemIndex = arrayData.findIndex((item: any) => item[tempIdKey] === tempId);

	if (itemIndex !== -1) {
		runInAction(() => {
			const item = arrayData[itemIndex];

			if (!item[pathInTempData]) {
				item[pathInTempData] = tracking.fileStates;
			} else {
				tracking.fileStates.forEach((newState: any, index: number) => {
					if (item[pathInTempData][index]) {
						const existingState = item[pathInTempData][index];
						const preservedFile = existingState.file || newState.file;

						const keysToUpdate = [
							'progress', 'status', 'error', 'result', 'uploadProgress', 'uploadedBytes', 'totalBytes',
							'isUploading', 'isCompressing', 'currentStage', 'compressionProgress', 'compressionStage',
							'overallProgress', 'compressedSize', 'media_type', 'width', 'height', 'duration',
							'thumbnailGenerated', 'server_file_url', 'server_thumbnail_url',
						] as const;
						for (const k of keysToUpdate) {
							if ((newState as any)[k] !== undefined) (existingState as any)[k] = (newState as any)[k];
						}
						existingState.file = newState.file || preservedFile;
					} else {
						item[pathInTempData][index] = newState;
					}
				});
			}

			if (targetData && typeof targetData.data === 'object') {
				targetData.data = { ...targetData.data };
			}
		});
	}
}
