import client from './client'

export function getRecentRooms(limit = 6) {
  return client.get('/rooms/recent', { params: { limit } }).then(r => r.data)
}

export function getRoomsByTheme(themeId, status = '', page = 0, jobRole = '', keyword = '') {
  return client.get(`/rooms/theme/${themeId}`, { params: { status, page, jobRole: jobRole || undefined, keyword: keyword || undefined } }).then(r => r.data)
}

export function getRoomDetail(id) {
  return client.get(`/rooms/${id}`).then(r => r.data)
}

export function createRoom(themeId, data) {
  return client.post('/rooms', data, { params: { themeId } }).then(r => r.data)
}

export function applyToRoom(id, data) {
  return client.post(`/rooms/${id}/apply`, data).then(r => r.data)
}

export function verifyManagePassword(id, password) {
  return client.post(`/rooms/${id}/manage/verify`, { password }).then(r => r.data)
}

export function getManageApplications(id, password) {
  return client.get(`/rooms/${id}/manage/applications`, { params: { password } }).then(r => r.data)
}

export function approveApplication(appId, roomId, password) {
  return client.post(`/rooms/applications/${appId}/approve`, null, { params: { roomId, password } }).then(r => r.data)
}

export function rejectApplication(appId, roomId, password) {
  return client.post(`/rooms/applications/${appId}/reject`, null, { params: { roomId, password } }).then(r => r.data)
}

export function closeRoom(id, password) {
  return client.post(`/rooms/${id}/close`, null, { params: { password } }).then(r => r.data)
}

export function updateRoom(id, password, data) {
  return client.patch(`/rooms/${id}`, data, { params: { password } }).then(r => r.data)
}
