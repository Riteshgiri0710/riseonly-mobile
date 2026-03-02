
export interface UploadFileResponse {
	urls: string[];
}

export interface UploadSingleFileResponse {
	url: string;
	file_name: string;
	file_size: number;
	compressed_size: number;
	mime_type: string;
	media_type: string; // "image" | "video" | "audio" | "voice" | "document"

	// Image/Video specific
	width?: number;
	height?: number;

	// Video/Audio specific
	duration?: number;
	bitrate?: number;
	fps?: number;
	codec?: string;

	// Thumbnail for images/videos
	thumbnail_url?: string;

	// Waveform for voice messages (base64 encoded)
	waveform?: string;
}