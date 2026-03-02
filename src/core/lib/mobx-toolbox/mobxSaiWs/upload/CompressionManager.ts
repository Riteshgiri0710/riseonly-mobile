import { Image, Video } from 'react-native-compressor';

export interface CompressionProgress {
	stage: 'loading' | 'compressing' | 'completed' | 'error';
	percentage: number;
	message: string;
	originalSize?: number;
	compressedSize?: number;
}

export interface ImageCompressionOptions {
	maxSizeMB?: number;
	maxWidthOrHeight?: number;
	quality?: number;
	onProgress?: (progress: CompressionProgress) => void;
}

export interface VideoCompressionOptions {
	maxSizeMB?: number;
	targetBitrate?: string; // e.g., '2M' will be converted to 2000000
	targetResolution?: { width: number; height: number; }; // Used to calculate maxSize
	onProgress?: (progress: CompressionProgress) => void;
}

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp'];

function hasVideoExtension(uri: string): boolean {
	const clean = uri.split('#')[0].split('?')[0];
	const lower = clean.toLowerCase();
	return VIDEO_EXTENSIONS.some(ext => lower.endsWith(ext));
}

export class CompressionManager {
	/**
	 * Compress image using react-native-compressor
	 * Native iOS/Android compression with WhatsApp-level quality
	 */
	static async compressImage(
		fileUri: string,
		options: ImageCompressionOptions = {}
	): Promise<{ uri: string; originalSize: number; compressedSize: number; }> {
		const cleanUri = fileUri.split('#')[0].split('?')[0];

		if (!cleanUri || (!cleanUri.startsWith('file://') && !cleanUri.startsWith('content://'))) {
			throw new Error(`Invalid image URI format: ${cleanUri}. Expected file:// or content:// URI.`);
		}

		if (hasVideoExtension(cleanUri)) {
			throw new Error(
				`Cannot compress video as image: ${cleanUri}. Use compressVideo or pass isVideo: true.`
			);
		}

		if (options.onProgress) {
			options.onProgress({
				stage: 'loading',
				percentage: 0,
				message: 'Preparing image...',
			});
		}

		try {
			const originalSize = await this.getFileSize(cleanUri);

			if (options.onProgress) {
				options.onProgress({
					stage: 'compressing',
					percentage: 50,
					message: 'Compressing image...',
					originalSize,
				});
			}

			const compressedUri = await Image.compress(cleanUri, {
				compressionMethod: 'auto',
				maxWidth: options.maxWidthOrHeight || 1920,
				maxHeight: options.maxWidthOrHeight || 1920,
				quality: options.quality || 0.8,
			});

			const compressedSize = await this.getFileSize(compressedUri);

			if (options.onProgress) {
				options.onProgress({
					stage: 'completed',
					percentage: 100,
					message: 'Image compressed',
					originalSize,
					compressedSize,
				});
			}

			const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
			console.log(`✅ Image compressed: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB (${compressionRatio}% saved)`);

			return {
				uri: compressedUri,
				originalSize,
				compressedSize,
			};
		} catch (error: any) {
			console.error('❌ Image compression failed:', error);
			if (options.onProgress) {
				options.onProgress({
					stage: 'error',
					percentage: 0,
					message: error.message || 'Compression failed',
				});
			}
			throw error;
		}
	}

	/**
	 * Compress video using react-native-compressor
	 * Native iOS/Android compression with FFmpeg under the hood
	 */
	static async compressVideo(
		fileUri: string,
		options: VideoCompressionOptions = {}
	): Promise<{ uri: string; originalSize: number; compressedSize: number; }> {
		const cleanUri = fileUri.split('#')[0].split('?')[0];

		if (!cleanUri || (!cleanUri.startsWith('file://') && !cleanUri.startsWith('content://'))) {
			throw new Error(`Invalid video URI format: ${cleanUri}. Expected file:// or content:// URI.`);
		}

		if (options.onProgress) {
			options.onProgress({
				stage: 'loading',
				percentage: 0,
				message: 'Loading video processor...',
			});
		}

		try {
			const originalSize = await this.getFileSize(cleanUri);

			if (options.onProgress) {
				options.onProgress({
					stage: 'compressing',
					percentage: 10,
					message: 'Preparing video...',
					originalSize,
				});
			}

			const compressedUri = await Video.compress(
				cleanUri,
				{
					compressionMethod: 'auto',
					maxSize: options.targetResolution ?
						Math.max(options.targetResolution.width, options.targetResolution.height) :
						1920,
					bitrate: options.targetBitrate ?
						parseInt(options.targetBitrate.replace('M', '000000')) :
						undefined,
				},
				(progress) => {
					if (options.onProgress) {
						const percentage = Math.min(10 + progress * 85, 95);
						options.onProgress({
							stage: 'compressing',
							percentage,
							message: `Compressing video... ${Math.round(percentage)}%`,
							originalSize,
						});
					}
				}
			);

			const compressedSize = await this.getFileSize(compressedUri);

			if (options.onProgress) {
				options.onProgress({
					stage: 'completed',
					percentage: 100,
					message: 'Video compressed',
					originalSize,
					compressedSize,
				});
			}

			const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
			console.log(`✅ Video compressed: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB (${compressionRatio}% saved)`);

			return {
				uri: compressedUri,
				originalSize,
				compressedSize,
			};
		} catch (error: any) {
			console.error('❌ Video compression failed:', error);
			if (options.onProgress) {
				options.onProgress({
					stage: 'error',
					percentage: 0,
					message: error.message || 'Compression failed',
				});
			}
			throw error;
		}
	}

	/**
	 * Compress file (image or video)
	 */
	static async compressFile(
		fileUri: string,
		isVideo: boolean,
		options: ImageCompressionOptions | VideoCompressionOptions = {}
	): Promise<{ uri: string; originalSize: number; compressedSize: number; }> {
		const treatAsVideo = isVideo || hasVideoExtension(fileUri);
		if (treatAsVideo) {
			return await this.compressVideo(fileUri, options as VideoCompressionOptions);
		}
		return await this.compressImage(fileUri, options as ImageCompressionOptions);
	}

	/**
	 * Get file size from URI
	 */
	private static async getFileSize(uri: string): Promise<number> {
		try {
			const RNFS = require('react-native-fs');

			const cleanUri = uri.split('#')[0].split('?')[0];
			const filePath = cleanUri.replace('file://', '');

			const stat = await RNFS.stat(filePath);
			return stat.size;
		} catch (error) {
			console.warn('[CompressionManager] Could not get file size, returning 0:', error);
			return 0;
		}
	}
}
