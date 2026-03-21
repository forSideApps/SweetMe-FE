export default function StatusBadge({ status, size = 'lg' }) {
  const cls = `badge badge-${size}`
  if (status === 'OPEN') return <span className={`${cls} badge-green`}>모집중</span>
  if (status === 'CLOSED') return <span className={`${cls} badge-gray`}>마감</span>
  return <span className={`${cls} badge-amber`}>{status}</span>
}
