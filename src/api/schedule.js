import client from './client'

export function getSchedules(upcomingOnly = false) {
  return client.get('/schedules', { params: { upcomingOnly } }).then(r => r.data)
}

export function createSchedule(data) {
  return client.post('/schedules', data).then(r => r.data)
}

export function deleteSchedule(id) {
  return client.delete(`/schedules/${id}`).then(r => r.data)
}
