import request from '@/utils/request'
export const uploadImage = file => {
  const form = new FormData()
  form.append('file', file)
  return request.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}