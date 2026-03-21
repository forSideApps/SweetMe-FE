export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="pagination">
      <button className="page-btn" disabled={page === 0} onClick={() => onPageChange(page - 1)}>이전</button>
      <span className="page-info">{page + 1} / {totalPages}</span>
      <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>다음</button>
    </div>
  )
}
