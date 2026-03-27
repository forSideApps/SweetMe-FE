export default function FilterTab({ value, activeValue, onClick, children }) {
  return (
    <button
      className={`filter-tab${value === activeValue ? ' active' : ''}`}
      onClick={() => onClick(value)}
    >
      {children}
    </button>
  )
}
