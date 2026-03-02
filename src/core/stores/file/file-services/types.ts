export interface FileUploadItemError {
	message: string;
}

export interface FileUploadItemResult {
	url: string;
}

export interface FileUploadItem {
	file: File;
	upload_id: string;
	progress: number;
	status: "pending" | "uploading" | "error" | "completed";
	error?: FileUploadItemError;
	result?: FileUploadItemResult;
}