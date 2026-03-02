import { ChunkedUploadManager, ChunkedUploadOptions, ChunkedUploadProgress, CompleteUploadResponse } from './ChunkedUploadManager';
import { CompressionManager, CompressionProgress } from './CompressionManager';

export interface FileUploadOrchestratorOptions extends Omit<ChunkedUploadOptions, 'totalSize' | 'onProgress'> {
	fileUri: string;
	shouldCompress?: boolean;
	compressionOptions?: {
		maxSizeMB?: number;
		maxWidthOrHeight?: number;
		quality?: number;
		targetBitrate?: string;
		targetResolution?: { width: number; height: number; };
	};
	onCompressionProgress?: (progress: CompressionProgress) => void;
	onUploadProgress?: (progress: ChunkedUploadProgress) => void;
	onOverallProgress?: (progress: OverallUploadProgress) => void;
}

export interface OverallUploadProgress {
	stage: 'compressing' | 'uploading' | 'completing' | 'completed' | 'error';
	compressionProgress: number;
	uploadProgress: number;
	overallProgress: number;
	message: string;
	uploadedBytes?: number;
	totalBytes?: number;
	compressedSize?: number;
	originalSize?: number;
}

export interface FileUploadResult {
	file_url: string;
	file_key: string;
	originalSize: number;
	compressedSize: number;
	uploadId: string;
	media_type?: string;
	width?: number;
	height?: number;
	duration?: number;
	thumbnail_url?: string | null;
}

export class FileUploadOrchestrator {
	private chunkedUploadManager: ChunkedUploadManager;
	private aborted: boolean = false;

	constructor() {
		this.chunkedUploadManager = new ChunkedUploadManager();
	}

	private isVideo(fileUri: string, contentType?: string): boolean {
		if (contentType?.startsWith('video/')) {
			return true;
		}
		const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp'];
		const cleanUri = fileUri.split('#')[0].split('?')[0];
		const lowerUri = cleanUri.toLowerCase();
		return videoExtensions.some(ext => lowerUri.endsWith(ext));
	}

	private isImage(fileUri: string, contentType?: string): boolean {
		if (contentType?.startsWith('image/')) {
			return true;
		}
		const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];
		const cleanUri = fileUri.split('#')[0].split('?')[0];
		const lowerUri = cleanUri.toLowerCase();
		return imageExtensions.some(ext => lowerUri.endsWith(ext));
	}

	private async extractMediaMetadata(fileUri: string): Promise<{ width?: number; height?: number; duration?: number; }> {
		// For React Native, we'll get metadata from the file picker
		// or use react-native-compressor's metadata extraction if needed
		return {};
	}

	private async getFileSize(uri: string): Promise<number> {
		try {
			const RNFS = require('react-native-fs');

			const cleanUri = uri.split('#')[0].split('?')[0];
			const filePath = cleanUri.replace('file://', '');

			const stat = await RNFS.stat(filePath);
			return stat.size;
		} catch (error) {
			console.warn('[FileUploadOrchestrator] Could not get file size:', error);
			return 0;
		}
	}

	private async uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
		const cleanUri = uri.split('#')[0].split('?')[0];
		console.log('[FileUploadOrchestrator] Converting URI to ArrayBuffer:', cleanUri);

		try {
			return new Promise<ArrayBuffer>((resolve, reject) => {
				const xhr = new XMLHttpRequest();
				xhr.open('GET', cleanUri, true);
				xhr.responseType = 'arraybuffer';

				xhr.onload = () => {
					if (xhr.status === 200) {
						const arrayBuffer = xhr.response as ArrayBuffer;
						console.log(`✅ File loaded: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`);
						resolve(arrayBuffer);
					} else {
						const error = new Error(`Failed to load file: ${xhr.status}`);
						console.error('❌ XMLHttpRequest failed:', error);
						reject(error);
					}
				};

				xhr.onerror = (e) => {
					const error = new Error('Failed to load file via XMLHttpRequest');
					console.error('❌ XMLHttpRequest error:', e);
					reject(error);
				};

				xhr.send();
			});
		} catch (error) {
			console.error('❌ [FileUploadOrchestrator] Failed to convert URI to ArrayBuffer:', error);
			throw error;
		}
	}

	async uploadFile(options: FileUploadOrchestratorOptions): Promise<FileUploadResult> {
		this.aborted = false;
		const originalSize = await this.getFileSize(options.fileUri);
		let compressedUri: string = options.fileUri;
		let compressedSize = originalSize;

		const isVideo = this.isVideo(options.fileUri, options.contentType);
		const isImage = this.isImage(options.fileUri, options.contentType);
		const metadata = await this.extractMediaMetadata(options.fileUri);
		// Only compress image or video; skip compression for documents (e.g. application/json)
		const shouldActuallyCompress = options.shouldCompress !== false && (isImage || isVideo);

		if (shouldActuallyCompress) {
			try {
				if (options.onOverallProgress) {
					options.onOverallProgress({
						stage: 'compressing',
						compressionProgress: 0,
						uploadProgress: 0,
						overallProgress: 0,
						message: isVideo ? 'Compressing video...' : 'Compressing image...',
						originalSize,
					});
				}

				const compressionResult = await CompressionManager.compressFile(
					options.fileUri,
					isVideo,
					{
						...options.compressionOptions,
						onProgress: (progress) => {
							if (options.onCompressionProgress) {
								options.onCompressionProgress(progress);
							}

							if (options.onOverallProgress) {
								const overallProgress = progress.percentage * 0.3;
								options.onOverallProgress({
									stage: 'compressing',
									compressionProgress: progress.percentage,
									uploadProgress: 0,
									overallProgress,
									message: progress.message,
									originalSize,
									compressedSize: progress.compressedSize,
								});
							}
						},
					}
				);

				compressedUri = compressionResult.uri;
				compressedSize = compressionResult.compressedSize;

				console.log(`✅ Compression completed: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB`);
			} catch (error: any) {
				console.error('❌ Compression failed, uploading original file:', error);
				compressedUri = options.fileUri;
				compressedSize = originalSize;
			}
		}

		if (this.aborted) {
			throw new Error('Upload aborted');
		}

		if (options.onOverallProgress) {
			options.onOverallProgress({
				stage: 'uploading',
				compressionProgress: 100,
				uploadProgress: 0,
				overallProgress: 30,
				message: 'Starting upload...',
				originalSize,
				compressedSize,
			});
		}

		// Convert URI to ArrayBuffer for upload
		const arrayBuffer = await this.uriToArrayBuffer(compressedUri);

		const uploadOptions: ChunkedUploadOptions = {
			...options,
			totalSize: compressedSize,
			onProgress: (uploadProgress) => {
				if (options.onUploadProgress) {
					options.onUploadProgress(uploadProgress);
				}

				if (options.onOverallProgress) {
					const uploadPercentage = uploadProgress.percentage;
					const overallProgress = 30 + (uploadPercentage * 0.7);

					options.onOverallProgress({
						stage: uploadProgress.stage === 'completing' ? 'completing' : 'uploading',
						compressionProgress: 100,
						uploadProgress: uploadPercentage,
						overallProgress,
						message: uploadProgress.message,
						uploadedBytes: uploadProgress.uploadedBytes,
						totalBytes: uploadProgress.totalBytes,
						originalSize,
						compressedSize,
					});
				}
			},
			onError: (error) => {
				if (options.onOverallProgress) {
					options.onOverallProgress({
						stage: 'error',
						compressionProgress: 100,
						uploadProgress: 0,
						overallProgress: 0,
						message: error.message,
						originalSize,
						compressedSize,
					});
				}
			},
		};

		const result = await this.chunkedUploadManager.uploadFileInChunks(arrayBuffer, uploadOptions);

		if (options.onOverallProgress) {
			options.onOverallProgress({
				stage: 'completed',
				compressionProgress: 100,
				uploadProgress: 100,
				overallProgress: 100,
				message: 'Upload completed',
				uploadedBytes: compressedSize,
				totalBytes: compressedSize,
				originalSize,
				compressedSize,
			});
		}

		return {
			file_url: result.file_url,
			file_key: result.file_key,
			thumbnail_url: result.thumbnail_url ?? null,
			originalSize,
			compressedSize,
			uploadId: this.chunkedUploadManager['uploadId'] || '',
			media_type: isVideo ? 'video' : isImage ? 'image' : 'document',
			width: metadata.width,
			height: metadata.height,
			duration: metadata.duration,
		};
	}

	async abort(): Promise<void> {
		this.aborted = true;
		await this.chunkedUploadManager.abortUpload();
	}
}

