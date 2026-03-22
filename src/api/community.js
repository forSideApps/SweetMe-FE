import client from './client'

export function getPosts(category = '', keyword = '', page = 0) {
  return client.get('/community', { params: { category, keyword, page } }).then(r => r.data)
}

export function getPost(id) {
  return client.get(`/community/${id}`).then(r => r.data)
}

export function createPost(data) {
  return client.post('/community', data).then(r => r.data)
}

export function addComment(postId, data) {
  return client.post(`/community/${postId}/comments`, data).then(r => r.data)
}

export function incrementPostView(postId) {
  return client.post(`/community/${postId}/view`)
}

export function deletePost(id) {
  return client.delete(`/community/${id}`)
}

export function updateComment(postId, commentId, data) {
  return client.put(`/community/${postId}/comments/${commentId}`, data)
}

export function deleteComment(postId, commentId) {
  return client.delete(`/community/${postId}/comments/${commentId}`)
}

export function createNotice(data) {
  return client.post('/community', { ...data, category: 'NOTICE' }).then(r => r.data)
}
