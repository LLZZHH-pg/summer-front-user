import request from '@/utils/request'
export const getContentsSquare = (page = 1, pageSize = 10) => request.get('/contentsSquare', { params: { page, pageSize } })
export const likeContent = data => request.post('/contents/like', {contentId: data.contentId})
export const commentContent = data => request.post('/contents/comment', {contentId: data.contentId,commentText: data.commentText})