import { Link } from 'react-router-dom'

export default function EmptyState({ icon = '📭', title, description, actionLabel, actionTo }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn-accent">{actionLabel}</Link>
      )}
    </div>
  )
}
