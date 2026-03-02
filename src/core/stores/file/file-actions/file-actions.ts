import { API_BASE_URL, API_BASE_URL_DEV } from '@env';
import { mobxSaiWs, registerEventHandlers } from '@lib/mobx-toolbox/mobxSaiWs';
import { console } from '@utils/console';
import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';
import { generateSimpleUUID } from '@lib/string';
import i18next from 'i18next';
import { makeAutoObservable } from 'mobx';
import { Platform } from 'react-native';
import { websocketApiStore } from '@stores/ws/websocket-api-store';
import { authServiceStore } from 'src/modules/auth/stores';
import { notifyInteractionsStore } from 'src/modules/notify/stores';
import { fileServicesStore } from '../file-services/file-services';
import { UploadSingleFileResponse } from './types';

const toUploadOrigin = (apiBase: string): string => apiBase.replace(/\/api\/?$/, '') || '';

function getApiBaseUrl(): string {
	const whichUrl = websocketApiStore.whichUrl;
	if (whichUrl === 'dev' && typeof API_BASE_URL_DEV !== 'undefined' && API_BASE_URL_DEV !== '') {
		return toUploadOrigin(API_BASE_URL_DEV);
	}
	if (typeof API_BASE_URL === 'undefined' || API_BASE_URL === '') {
		console.warn('API_BASE_URL is not set in .env');
		return "";
	}
	return toUploadOrigin(API_BASE_URL);
}

const UPLOAD_SINGLE_FILE_ENDPOINT = () => `${getApiBaseUrl()}/api/file/upload-single`;
const UPLOAD_VIDEO_ENDPOINT = () => `${getApiBaseUrl()}/api/file/upload-video`;
const HEALTH_CHECK_ENDPOINT = () => `${getApiBaseUrl()}/api/health`;

class FileActionsStore {
	constructor() {
		makeAutoObservable(this);
		this.initEventHandlers();
	}

	initEventHandlers = () => {
		registerEventHandlers([
			{ type: "upload_progress", handler: fileServicesStore.uploadProgressSuccessHandler }
		]);
	};

	signleFileUpload: MobxSaiWsInstance<any> = {};
	currentUploadingId: string | null = null;

	// UPLOAD DEFAULT SINGLE FILE

	uploadSingleFileAction = async (
		file: any,
		uploadId: string
	) => {
		const { showNotify } = notifyInteractionsStore;
		const { registerFileUploadItemToQueue } = fileServicesStore;

		registerFileUploadItemToQueue(uploadId, file);

		this.processUploadQueue();

		return new Promise((resolve, reject) => {
			const checkInterval = setInterval(() => {
				const item = fileServicesStore.fileUploadItemsQueue.get(uploadId);
				if (!item) {
					clearInterval(checkInterval);
					reject(new Error("File upload item not found"));
					return;
				}

				if (item.status === "completed" && item.result) {
					clearInterval(checkInterval);
					resolve(item.result);
				} else if (item.status === "error" && item.error) {
					clearInterval(checkInterval);
					reject(new Error(item.error.message));
				}
			}, 100);

			setTimeout(() => {
				clearInterval(checkInterval);
				reject(new Error("Upload timeout"));
			}, 300000);
		});
	};

	// PROCESS UPLOAD QUEUE

	processUploadQueue = async () => {
		const { isProcessingQueue, getNextPendingFile, fileUploadItemsQueue } = fileServicesStore;

		if (isProcessingQueue || this.currentUploadingId) {
			console.log("[processUploadQueue] Queue is already being processed");
			return;
		}

		const nextFile = getNextPendingFile();
		if (!nextFile) {
			console.log("[processUploadQueue] No pending files in queue");
			return;
		}

		fileServicesStore.isProcessingQueue = true;
		this.currentUploadingId = nextFile.upload_id;

		console.log(`[processUploadQueue] Starting upload for ${nextFile.upload_id}`);

		try {
			this.signleFileUpload = mobxSaiWs(
				{ uploadId: nextFile.upload_id },
				{
					id: nextFile.upload_id,
					service: "file",
					method: "subscribeToUploadProgress",
					fetchIfHaveData: true,
					fetchIfPending: true
				}
			);

			await new Promise(resolve => setTimeout(resolve, 500));

			fileServicesStore.updateFileUploadItemProgress(nextFile.upload_id, 0, "uploading");

			await uploadSingleFile(nextFile.file, nextFile.upload_id);

			console.log(`[processUploadQueue] Upload initiated for ${nextFile.upload_id}`);

		} catch (err) {
			console.error(`[processUploadQueue] Error uploading file ${nextFile.upload_id}:`, err);
			const { showNotify } = notifyInteractionsStore;

			fileServicesStore.updateFileUploadItemError(
				nextFile.upload_id,
				{ message: err instanceof Error ? err.message : String(err) }
			);

			showNotify("error", {
				message: i18next.t("upload_file_error_message")
			});

			this.currentUploadingId = null;
			fileServicesStore.isProcessingQueue = false;
			this.processUploadQueue();
		}
	};

	uploadSingleFilesAction = async (
		files: any[],
		uploadId: string,
		setLoading?: (progress: number) => void,
	) => {
		const { showNotify } = notifyInteractionsStore;

		files.forEach(async file => {
			try {
				console.log("[uploadSingleFileAction] Starting upload with progress callback:", !!setLoading);

				this.signleFileUpload = mobxSaiWs(
					{
						uploadId: uploadId
					},
					{
						id: uploadId,
						service: "file",
						method: "subscribeToUploadProgress",
						fetchIfHaveData: true,
						fetchIfPending: true
					}
				);

				const result = await uploadSingleFile(file, uploadId, (progress) => {
					console.log("[uploadSingleFileAction] Upload progress:", progress);
					if (setLoading) {
						setLoading(progress);
					}
				});

				console.log("[uploadSingleFileAction] Upload completed:", result);
				return result;
			} catch (err) {
				console.log("[uploadFileAction] Error:", err);
				showNotify("error", {
					message: i18next.t("upload_file_error_message")
				});
				return { status: "error", message: `${err}` };
			}
		});

		return { status: "success", message: "Success" };
	};

	uploadVideo: MobxSaiWsInstance<any> = {};

	uploadVideoAction = async (files: any[], uploadId: string) => {
		const { showNotify } = notifyInteractionsStore;

		console.log("[uploadVideoAction] Starting upload with uploadId:", uploadId);

		if (!files || !Array.isArray(files) || files.length === 0) {
			showNotify("error", {
				message: "Файлы для загрузки не предоставлены"
			});
			throw new Error("Файлы для загрузки не предоставлены");
		}

		const results = await Promise.allSettled(
			files.map(async (file, index) => {
				try {
					console.log(`[uploadVideoAction] Обрабатываем файл ${index + 1}/${files.length}`);

					if (!file) {
						throw new Error(`Файл ${index + 1} отсутствует`);
					}

					const uploadPromise = new Promise((resolve, reject) => {
						const videoProgressCallback = (progressMessage: any) => {
							console.log(`[uploadVideoAction] Progress update for file ${index + 1}:`, progressMessage);

							if (progressMessage.stage === "completed") {
								console.log(`[uploadVideoAction] Upload completed for file ${index + 1}, URL:`, progressMessage.url);
								fileServicesStore.unregisterProgressCallback(uploadId, videoProgressCallback);
								resolve({
									url: progressMessage.url,
									file_name: progressMessage.file_name || file.filename || file.name || 'video.mov',
									file_size: progressMessage.file_size || 0,
									compressed_size: progressMessage.compressed_size || 0,
									mime_type: progressMessage.mime_type || 'video/mp4',
									media_type: progressMessage.media_type || 'video',
									width: progressMessage.width,
									height: progressMessage.height,
									duration: progressMessage.duration,
									bitrate: progressMessage.bitrate,
									fps: progressMessage.fps,
									codec: progressMessage.codec,
									thumbnail_url: progressMessage.thumbnail_url,
									waveform: progressMessage.waveform
								});
							} else if (progressMessage.stage === "error") {
								console.error(`[uploadVideoAction] Upload failed for file ${index + 1}:`, progressMessage.message);
								fileServicesStore.unregisterProgressCallback(uploadId, videoProgressCallback);
								reject(new Error(progressMessage.message));
							}
						};

						fileServicesStore.registerProgressCallback(uploadId, videoProgressCallback);

						setTimeout(() => {
							fileServicesStore.unregisterProgressCallback(uploadId, videoProgressCallback);
							reject(new Error("Timeout: Upload took too long"));
						}, 10 * 60 * 1000);
					});

					this.uploadVideo = mobxSaiWs(
						{
							uploadId: uploadId
						},
						{
							id: uploadId,
							service: "file",
							method: "subscribeToUploadProgress",
							fetchIfHaveData: true,
							fetchIfPending: true
						}
					);

					const uploadResponse = await uploadVideo(file, uploadId);

					console.log(`[uploadVideoAction] Initial upload response for file ${index + 1}:`, uploadResponse?.data);

					if (uploadResponse?.data?.url === "processing") {
						console.log(`[uploadVideoAction] File ${index + 1} is being processed, waiting for WebSocket updates...`);
						const finalResult = await uploadPromise;
						return finalResult;
					}

					else if (uploadResponse?.data?.url && uploadResponse.data.url !== "processing") {
						console.log(`[uploadVideoAction] File ${index + 1} uploaded directly, URL:`, uploadResponse.data.url);
						fileServicesStore.unregisterProgressCallback(uploadId);
						return {
							url: uploadResponse.data.url,
							file_name: uploadResponse.data.filename || file.filename || file.name || 'video.mov',
							file_size: uploadResponse.data.original_size || 0,
							compressed_size: uploadResponse.data.compressed_size || 0,
							mime_type: 'video/mp4',
							media_type: 'video',
							width: uploadResponse.data.width,
							height: uploadResponse.data.height,
							duration: Math.trunc(uploadResponse.data.duration),
							bitrate: uploadResponse.data.bitrate,
							fps: uploadResponse.data.fps,
							codec: uploadResponse.data.codec,
							thumbnail_url: uploadResponse.data.thumbnail_url,
							waveform: null
						};
					}

					else {
						fileServicesStore.unregisterProgressCallback(uploadId);
						throw new Error("Сервер не вернул URL файла");
					}

				} catch (err: any) {
					console.error(`[uploadVideoAction] Ошибка загрузки файла ${index + 1}:`, {
						message: err?.message,
						stack: err?.stack,
						file: file?.name || file?.uri
					});

					fileServicesStore.unregisterProgressCallback(uploadId);

					if (index === 0) {
						const errorMessage = err?.message || i18next.t("upload_file_error_message");
						showNotify("error", {
							message: errorMessage
						});
					}

					throw err;
				}
			})
		);

		const successful = results.filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled');
		const failed = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');

		console.log(`[uploadVideoAction] Результаты загрузки: ${successful.length} успешных, ${failed.length} неудачных`);

		if (failed.length > 0) {
			console.error(`[uploadVideoAction] Ошибки загрузки:`, failed.map(f => f.reason));
		}

		return successful.map(result => result.value);
	};
}

export const fileActionsStore = new FileActionsStore();

export const uploadVideo = async (file: any, uploadId: string) => {
	if (!file) {
		throw new Error("Файл не предоставлен");
	}

	let fileUri = file.uri || (file._rawAsset && file._rawAsset.uri) || (file.file && file.file.uri);
	if (!fileUri) {
		throw new Error("URI файла отсутствует");
	}

	const cleanUri = (uri: string): string => {
		const hashIndex = uri.indexOf('#');
		if (hashIndex !== -1) {
			return uri.substring(0, hashIndex);
		}
		return uri;
	};

	fileUri = cleanUri(fileUri);

	console.log("[uploadVideo] Начинаем загрузку видео:", {
		uri: fileUri,
		type: file.type || (file.file && file.file.type),
		name: file.filename || (file._rawAsset && file._rawAsset.filename) || (file.file && file.file.name),
		size: file.size || (file._rawAsset && file._rawAsset.size)
	});

	const formData = new FormData();

	const fileToUpload = {
		uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
		type: file.type || (file._rawAsset && 'video/quicktime') || 'video/mp4',
		name: file.filename || (file._rawAsset && file._rawAsset.filename) || 'video.mov',
	};

	console.log("[uploadVideo] Подготовленный файл:", fileToUpload);

	formData.append('upload_id', uploadId);
	// @ts-ignore - ignore because it is simply necessary for RN files
	formData.append('video', fileToUpload);

	try {
		const tokens = authServiceStore.getTokensAndOtherData();

		if (!tokens?.access_token) {
			throw new Error("No access token");
		}

		const headers: HeadersInit = {
			'Accept': '*/*',
			'Authorization': `Bearer ${tokens.access_token}`,
		};

		console.log("[uploadVideo] Отправляем запрос на сервер:", { endpoint: UPLOAD_VIDEO_ENDPOINT(), headers: Object.keys(headers) });

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 60000);

		const response = await fetch(UPLOAD_VIDEO_ENDPOINT(), {
			method: 'POST',
			headers,
			body: formData,
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		console.log("[uploadVideo] Ответ сервера:", response.status);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

			if (response.status === 413) {
				throw new Error("Видео файл слишком большой");
			}

			if (response.status === 400) {
				const errorMsg = errorData?.error || errorData?.message || "Неверный формат видео файла";
				throw new Error(errorMsg);
			}

			throw new Error(errorData?.error || errorData?.message || `Server error: ${response.status}`);
		}

		const data = await response.json();
		if (__DEV__) console.log("[uploadVideo] Данные ответа:", data);

		if (!data) {
			throw new Error("Пустой ответ от сервера");
		}

		return { data, status: response.status };
	} catch (error: any) {
		if (__DEV__) console.error("[uploadVideo] Подробная ошибка:", { message: error?.message, stack: error?.stack, name: error?.name });

		if (error?.name === 'AbortError') {
			throw new Error("Превышено время ожидания загрузки видео");
		}

		if (error?.message?.includes('Network request failed')) {
			throw new Error("Проблема с подключением к серверу");
		}

		throw error;
	}
};

export const uploadSingleFile = async (
	file: any,
	uploadId: string,
	onProgress?: (progress: number) => void
): Promise<UploadSingleFileResponse> => {
	if (!file?.uri || file.uri === '' || file.uri === 'error') {
		const errorMessage = `Invalid file URI: ${file?.uri || 'undefined'}`;
		if (__DEV__) console.error("[uploadSingleFile] Error:", errorMessage);
		throw new Error(errorMessage);
	}
	if (__DEV__) console.log("[uploadSingleFile] Generated upload_id:", uploadId);

	const formData = new FormData();

	const cleanUri = (uri: string): string => {
		const hashIndex = uri.indexOf('#');
		if (hashIndex !== -1) {
			return uri.substring(0, hashIndex);
		}
		return uri;
	};

	let processedUri = cleanUri(file.uri);
	if (Platform.OS !== 'android' && processedUri.startsWith('file://')) {
		processedUri = processedUri.replace('file://', '');
	}

	const fileToUpload = {
		uri: processedUri,
		type: file.type || 'image/jpeg',
		name: file.name || 'image.jpg',
	};

	if (__DEV__) console.log("[uploadSingleFile] Uploading file:", fileToUpload);

	formData.append('upload_id', uploadId);

	// @ts-ignore - ignore because it is simply necessary for RN files
	formData.append('file', fileToUpload);

	try {
		const tokens = authServiceStore.getTokensAndOtherData();

		if (!tokens?.access_token) {
			throw new Error("No access token");
		}

		const headers: HeadersInit = {
			'Content-Type': 'multipart/form-data',
			'Accept': '*/*',
			'Authorization': `Bearer ${tokens.access_token}`,
		};

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

		const response = await fetch(UPLOAD_SINGLE_FILE_ENDPOINT(), {
			method: 'POST',
			headers,
			body: formData,
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (__DEV__) console.log("[uploadSingleFile] Response status:", response.status);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			throw new Error(errorData?.error || errorData?.message || `Upload failed: ${response.status}`);
		}

		const data = await response.json();
		if (__DEV__) console.log("[uploadSingleFile] Upload completed:", data);
		return data;
	} catch (error: any) {
		if (__DEV__) console.error("[uploadSingleFile] Error:", {
			message: error?.message,
			stack: error?.stack,
			name: error?.name,
		});

		if (error?.name === 'AbortError') {
			throw new Error("Превышено время ожидания загрузки файла");
		}

		if (error?.message?.includes('Network request failed')) {
			throw new Error("Проблема с подключением к серверу");
		}

		throw error;
	}
};

export const diagnoseVideoUpload = async (file: any) => {
	if (__DEV__) console.log("=== ДИАГНОСТИКА ЗАГРУЗКИ ВИДЕО ===");
	try {
		if (__DEV__) console.log("1. Проверяем файл:", { exists: !!file, uri: file?.uri, name: file?.name, type: file?.type, size: file?.size });

		if (!file) {
			throw new Error("Файл не предоставлен");
		}

		if (!file.uri) {
			throw new Error("URI файла отсутствует");
		}

		if (__DEV__) console.log("2. Проверяем API URL:", { apiUrl: getApiBaseUrl(), platform: Platform.OS, isDev: __DEV__ });
		if (__DEV__) console.log("3. Тестируем подключение к серверу...");
		try {
			const tokens = authServiceStore.getTokensAndOtherData();
			const headers: HeadersInit = {
				'Authorization': tokens?.access_token ? `Bearer ${tokens.access_token}` : '',
			};

			const pingResponse = await fetch(HEALTH_CHECK_ENDPOINT(), {
				method: 'GET',
				headers,
			});

			if (__DEV__) console.log("   ✅ Сервер доступен:", pingResponse.status);
		} catch (pingError: any) {
			if (__DEV__) console.error("   ❌ Сервер недоступен:", pingError?.message);
			throw new Error(`Сервер недоступен: ${pingError?.message}`);
		}

		if (__DEV__) console.log("4. Пробуем загрузить видео...");
		const uploadId = generateSimpleUUID();
		const result = await fileActionsStore.uploadVideoAction([file], uploadId);
		if (__DEV__) console.log("✅ Диагностика завершена успешно:", result);
		return result;
	} catch (error: any) {
		if (__DEV__) {
			console.error("❌ Диагностика выявила проблему:", { message: error?.message, stack: error?.stack, name: error?.name });
			if (error?.message?.includes("Network request failed")) console.error("💡 Проблема с сетью. Проверьте подключение к интернету.");
			else if (error?.message?.includes("timeout") || error?.name === 'AbortError') console.error("💡 Превышено время ожидания. Возможно, файл слишком большой или медленное соединение.");
			else if (error?.message?.includes("ECONNREFUSED")) console.error("💡 Сервер не запущен или недоступен по указанному адресу.");
			else if (error?.message?.includes("413") || error?.message?.includes("слишком большой")) console.error("💡 Файл слишком большой для загрузки.");
			else if (error?.message?.includes("400") || error?.message?.includes("неверный")) console.error("💡 Неверный формат файла или проблема с данными.");
		}

		throw error;
	}
};