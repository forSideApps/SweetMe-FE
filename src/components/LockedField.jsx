export default function LockedField({ value }) {
  return (
    <div className="locked-field">
      <span className="comment-member-badge">●</span> {value}
    </div>
  )
}
