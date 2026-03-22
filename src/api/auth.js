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
