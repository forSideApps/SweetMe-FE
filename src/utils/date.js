export function formatDate(str) {
  if (!str) return ''
  return str.slice(0, 10)
}

export function formatDateTime(str) {
  if (!str) return ''
  return str.slice(0, 16).replace('T', ' ')
}
