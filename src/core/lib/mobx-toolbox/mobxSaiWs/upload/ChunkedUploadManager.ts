import { API_BASE_URL, API_BASE_URL_DEV } from '@env';
import { console } from '@utils/console';
import { websocketApiStore } from '@stores/ws/websocket-api-store';
import axios, { AxiosInstance } from 'axios';

const toUploadOrigin = (apiBase: string): string => apiBase.replace(/\/api\/?$/, '') || '';

export interface ChunkedUploadOptions {
	filename: string;
	contentType: string;
	fileContext: string;
	resourceId?: string;
	totalSize: number;
	chunkSize?: number;
	maxParallelUploads?: number;
	onProgress?: (progress: ChunkedUploadProgress) => void;
	onChunkProgress?: (chunkNumber: number, progress: number) => void;
	onError?: (error: Error) => void;
	accessToken?: string;
}

export interface ChunkedUploadProgress {
	uploadId: string;
	uploadedBytes: number;
	totalBytes: number;
	uploadedChunks: number;
	totalChunks: number;
	percentage: number;
	stage: 'initiating' | 'uploading' | 'completing' | 'completed' | 'error';
	message: string;
}

export interface InitiateUploadResponse {
	upload_id: string;
	s3_upload_id: string;
	chunk_size: number;
}

export interface UploadPartResponse {
	part_number: number;
	etag: string;
	progress_percentage: number;
}

export interface UploadSlabResponse {
	received: number;
	progress_percentage: number;
}

export interface CompleteUploadResponse {
	file_url: string;
	file_key: string;
	thumbnail_url?: string | null;
}

export class ChunkedUploadManager {
	private axiosInstance: AxiosInstance;
	private uploadId: string | null = null;
	private s3UploadId: string | null = null;
	private chunkSize: number = 1024 * 1024; // 1MB default
	private uploadedChunks: Set<number> = new Set();
	private uploadedBytes: number = 0;
	private totalSlabs: number = 0; // for slab-based progress display
	private aborted: boolean = false;

	constructor() {
		this.axiosInstance = axios.create({
			baseURL: this.getApiBaseUrl(),
			timeout: 300000, // 5 minutes per chunk
		});
	}

	getApiBaseUrl(): string {
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

	private setAuthToken(token?: string) {
		if (token) {
			this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
		} else {
			console.warn('[ChunkedUploadManager] ⚠️ No auth token provided!');
		}
	}

	async initiateUpload(options: ChunkedUploadOptions): Promise<InitiateUploadResponse> {
		console.log('[ChunkedUploadManager] Initiating upload with token:', options.accessToken ? '✅ Present' : '❌ Missing');
		this.setAuthToken(options.accessToken);
		this.aborted = false;
		this.uploadedChunks.clear();

		if (options.onProgress) {
			options.onProgress({
				uploadId: '',
				uploadedBytes: 0,
				totalBytes: options.totalSize,
				uploadedChunks: 0,
				totalChunks: Math.ceil(options.totalSize / (options.chunkSize || this.chunkSize)),
				percentage: 0,
				stage: 'initiating',
				message: 'Initiating upload...',
			});
		}

		try {
			const response = await this.axiosInstance.post<{ success: boolean; data: InitiateUploadResponse; }>('/api/file/upload/initiate', {
				filename: options.filename,
				content_type: options.contentType,
				file_context: options.fileContext,
				resource_id: options.resourceId,
				total_size: options.totalSize,
			});

			if (!response.data.success || !response.data.data) {
				throw new Error('Failed to initiate upload');
			}

			const { upload_id, s3_upload_id, chunk_size } = response.data.data;

			this.uploadId = upload_id;
			this.s3UploadId = s3_upload_id;
			this.chunkSize = chunk_size;

			console.log(`✅ Upload initiated: upload_id=${upload_id}, chunk_size=${chunk_size}`);

			return response.data.data;
		} catch (error: any) {
			console.error('❌ Failed to initiate upload:', error);
			if (options.onError) {
				options.onError(new Error(error.response?.data?.message || error.message || 'Failed to initiate upload'));
			}
			throw error;
		}
	}

	/** 64KB slabs: progress after each PUT completes (no xhr.upload.onprogress). */
	private static readonly SLAB_SIZE = 64 * 1024;

	async uploadSlab(
		slab: Uint8Array,
		isLast: boolean,
		options: ChunkedUploadOptions
	): Promise<UploadSlabResponse> {
		if (this.aborted) throw new Error('Upload aborted');
		if (!this.uploadId) throw new Error('Upload not initiated');

		this.setAuthToken(options.accessToken);

		const url = `${this.getApiBaseUrl()}/api/file/upload/slab`;
		const token = options.accessToken;
		const body =
			slab.byteOffset === 0 && slab.byteLength === slab.buffer.byteLength
				? slab.buffer
				: slab.buffer.slice(slab.byteOffset, slab.byteOffset + slab.byteLength);

		return new Promise<UploadSlabResponse>((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open('PUT', url);
			xhr.timeout = 60_000;
			xhr.setRequestHeader('Content-Type', 'application/octet-stream');
			xhr.setRequestHeader('Upload-Id', this.uploadId!);
			xhr.setRequestHeader('Last-Slab', isLast ? 'true' : 'false');
			if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
			xhr.responseType = 'json';

			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					const json = xhr.response as { success?: boolean; data?: UploadSlabResponse; } | null;
					if (json?.success && json?.data) resolve(json.data);
					else reject(new Error('Slab upload failed'));
				} else {
					const err = xhr.response as { message?: string; } | null;
					reject(new Error(err?.message ?? `Slab failed: ${xhr.status}`));
				}
			};
			xhr.onerror = () => reject(new Error('Network error uploading slab'));
			xhr.ontimeout = () => reject(new Error('Slab upload timed out'));
			xhr.onabort = () => reject(new Error('Upload aborted'));
			xhr.send(body);
		});
	}

	async completeUpload(options: ChunkedUploadOptions): Promise<CompleteUploadResponse> {
		if (this.aborted) {
			throw new Error('Upload aborted');
		}

		if (!this.uploadId) {
			throw new Error('Upload not initiated');
		}

		this.setAuthToken(options.accessToken);

		if (options.onProgress) {
			options.onProgress({
				uploadId: this.uploadId,
				uploadedBytes: options.totalSize,
				totalBytes: options.totalSize,
				uploadedChunks: this.totalSlabs || this.uploadedChunks.size,
				totalChunks: this.totalSlabs || this.uploadedChunks.size,
				percentage: 99,
				stage: 'completing',
				message: 'Finalizing upload...',
			});
		}

		try {
			const response = await this.axiosInstance.post<{ success: boolean; data: CompleteUploadResponse; }>(
				'/api/file/upload/complete',
				{},
				{
					headers: {
						'Upload-Id': this.uploadId,
					},
				}
			);

			if (!response.data.success || !response.data.data) {
				throw new Error('Failed to complete upload');
			}

			if (options.onProgress) {
				options.onProgress({
					uploadId: this.uploadId,
					uploadedBytes: options.totalSize,
					totalBytes: options.totalSize,
					uploadedChunks: this.totalSlabs || this.uploadedChunks.size,
					totalChunks: this.totalSlabs || this.uploadedChunks.size,
					percentage: 100,
					stage: 'completed',
					message: 'Upload completed',
				});
			}

			const data = response.data.data;
			console.log(
				`✅ Upload completed: file_url=${data.file_url}, thumbnail_url=${data.thumbnail_url ?? 'none'}`
			);
			return data;
		} catch (error: any) {
			console.error('❌ Failed to complete upload:', error);
			if (options.onError) {
				options.onError(new Error(error.response?.data?.message || error.message || 'Failed to complete upload'));
			}
			throw error;
		}
	}

	async abortUpload(accessToken?: string): Promise<void> {
		if (!this.uploadId) {
			return;
		}

		this.aborted = true;
		this.setAuthToken(accessToken);

		try {
			await this.axiosInstance.post(
				'/api/file/upload/abort',
				{},
				{
					headers: {
						'Upload-Id': this.uploadId,
					},
				}
			);

			console.log(`🛑 Upload aborted: upload_id=${this.uploadId}`);
		} catch (error: any) {
			console.error('❌ Failed to abort upload:', error);
		} finally {
			this.cleanup();
		}
	}

	private cleanup() {
		this.uploadId = null;
		this.s3UploadId = null;
		this.uploadedChunks.clear();
		this.uploadedBytes = 0;
		this.totalSlabs = 0;
	}

	async uploadFileInChunks(
		fileData: Blob | ArrayBuffer,
		options: ChunkedUploadOptions
	): Promise<CompleteUploadResponse> {
		await this.initiateUpload(options);
		this.uploadedBytes = 0;

		const dataArray =
			fileData instanceof ArrayBuffer
				? new Uint8Array(fileData)
				: fileData instanceof Blob
					? new Uint8Array(await fileData.arrayBuffer())
					: new Uint8Array(fileData);

		const totalSize = options.totalSize;
		const slabSize = ChunkedUploadManager.SLAB_SIZE;
		this.totalSlabs = Math.max(1, Math.ceil(totalSize / slabSize));

		for (let offset = 0; (offset < totalSize || (offset === 0 && totalSize === 0)) && !this.aborted; offset += slabSize) {
			const end = Math.min(offset + slabSize, totalSize) || 0;
			const slab = totalSize > 0 ? dataArray.slice(offset, end) : new Uint8Array(0);
			const isLast = end >= totalSize || totalSize === 0;

			let retries = 3;
			while (retries--) {
				try {
					const res = await this.uploadSlab(slab, isLast, options);
					this.uploadedBytes += res.received;
					const pct = totalSize > 0 ? Math.min(99, (this.uploadedBytes / totalSize) * 100) : 99;
					if (options.onProgress && this.uploadId) {
						options.onProgress({
							uploadId: this.uploadId,
							uploadedBytes: this.uploadedBytes,
							totalBytes: totalSize,
							uploadedChunks: Math.ceil(this.uploadedBytes / slabSize),
							totalChunks: this.totalSlabs,
							percentage: pct,
							stage: 'uploading',
							message: `Uploading... ${Math.round(pct)}%`,
						});
					}
					break;
				} catch (e) {
					if (retries === 0) throw e;
					console.warn(`⚠️ Slab at ${offset} failed, retrying (${3 - retries}/3)...`);
					await new Promise((r) => setTimeout(r, 1000));
				}
			}
		}

		if (this.aborted) throw new Error('Upload aborted');

		return this.completeUpload(options);
	}
}
