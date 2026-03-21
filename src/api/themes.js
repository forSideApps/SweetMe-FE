import client from './client'

export function getThemes() {
  return client.get('/themes').then(r => r.data)
}
