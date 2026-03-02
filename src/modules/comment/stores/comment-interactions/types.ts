export interface GetTempCommentParams {
	id: number | string
	content: string
	originalContent: string
	postId: number
	parentId?: number | null
	addressedToName?: string | null
	addressedToTag?: string | null
}
