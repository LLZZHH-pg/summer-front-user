import request from '@/utils/request'
export const getContents = () => request.get('/contents')
export const saveContent = data => request.post('/contents', data)
export const updateState = data => request.post('/contents/state', data)
export const deleteContent = id => request.delete(`/contents/${id}`)