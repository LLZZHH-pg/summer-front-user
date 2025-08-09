import request from '@/utils/request'
export const getContents = () => request.get('/contents')
export const saveContent = data => request.post('/contents', {contentId: data.contentId,state: data.state,content: data.content})
export const updateState = data => request.post('/contents/state', {contentId: data.contentId,state: data.state})
export const deleteContent = data => request.post('/contents/delete', {contentId: data.contentId})