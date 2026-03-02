import { GetPostFeedResponse } from 'src/modules/post/stores';

export interface SearchPost extends Omit<
	GetPostFeedResponse,
	| 'selectedCommentSort'
	| 'cachedComments'
	| 'cachedCommentsOld'
	| 'cachedCommentsNew'
	| 'cachedCommentsMy'
	| 'isTemp'
	| 'progress'
> { }