import client from './client'

export function register(data) {
  return client.post('/auth/register', data).then(r => r.data)
}

export function login(data) {
  return client.post('/auth/login', data).then(r => r.data)
}

export function logout() {
  return client.post('/auth/logout').then(r => r.data)
}

export function getMe() {
  return client.get('/auth/me').then(r => r.data)
}

export function updateProfile(data) {
  return client.put('/auth/profile', data).then(r => r.data)
}

export function getMyRooms() {
  return client.get('/auth/me/rooms').then(r => r.data)
}

export function getMyReviews() {
  return client.get('/auth/me/reviews').then(r => r.data)
}

export function getMyPosts() {
  return client.get('/auth/me/posts').then(r => r.data)
}

export function getMyApplications() {
  return client.get('/auth/me/applications').then(r => r.data)
}

export function getMyExchanges() {
  return client.get('/auth/me/exchanges').then(r => r.data)
}
