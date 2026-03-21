import client from './client'

export function getPosts(category = '', page = 0) {
  return client.get('/community', { params: { category, page } }).then(r => r.data)
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
