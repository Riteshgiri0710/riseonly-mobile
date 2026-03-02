export interface FileUploadItemError {
	message: string;
}

export interface FileUploadItemResult {
	url: string;
}

export interface FileUploadItem {
	id: string;
	file: SaiFile;
	upload_id: string;
	progress: number;
	status: "pending" | "uploading" | "error" | "completed";
	error?: FileUploadItemError;
	result?: FileUploadItemResult;
}

export interface SaiFileUploadOptions {
	/**
	 * Unique identifier for this upload instance
	 * Can be string, array of strings/numbers, or null
	 */
	id?: string | string[] | number | number[] | null;

	/**
	 * Maximum number of concurrent uploads
	 * @default 1
	 */
	maxUploads?: number;

	/**
	 * Upload type: 'single' for images, 'video' for videos
	 * @default 'single'
	 */
	uploadType?: 'single' | 'video';

	/**
	 * Callback when a file upload succeeds
	 */
	onSuccess?: (result: FileUploadItemResult, uploadId: string) => void;

	/**
	 * Callback when a file upload fails
	 */
	onError?: (error: FileUploadItemError, uploadId: string) => void;

	/**
	 * Callback for progress updates
	 */
	onProgress?: (progress: number, uploadId: string) => void;

	/**
	 * Callback when all uploads complete
	 */
	onAllComplete?: (results: FileUploadItemResult[]) => void;

	/**
	 * Auto-start processing queue when files are added
	 * @default true
	 */
	autoStart?: boolean;
}

export type FileUploadInstance = FileUploadItem[];

export interface SaiFile {
	uri: string;
	type?: string;
	name?: string;
	filename?: string;
	size?: number;
	file?: any;
	_rawAsset?: any;
}

