import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getReviews } from '../api/review'
import { JOB_ROLES } from '../constants/jobRoles'

const TYPES = [
  { value: '', label: '전체' },
  { value: 'PORTFOLIO', label: '포트폴리오' },
  { value: 'RESUME', label: '이력서' },
]
const STATUSES = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: '검토전' },
  { value: 'DONE', label: '완료' },
]
const CAREER_LEVELS = [
  { value: '', label: '전체' },
  { value: 'JUNIOR', label: '신입' },
  { value: 'EXPERIENCED', label: '경력' },
]

function formatDate(str) {
  if (!str) return ''
  return str.slice(0, 10)
}

export default function Review() {
  const [reviews, setReviews] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [jobCategory, setJobCategory] = useState('')
  const [careerLevel, setCareerLevel] = useState('')
  const [keyword, setKeyword] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const debounceRef = useRef(null)
  const filterRef = useRef(null)

  useEffect(() => {
    if (!filterOpen) return
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [filterOpen])

  const load = useCallback((params) => {
    setLoading(true)
    getReviews(params)
      .then(data => {
        setReviews(data.content || data)
        setTotalPages(data.totalPages || 1)
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load({ type, status, jobCategory, careerLevel, keyword, page })
  }, [type, status, jobCategory, careerLevel, keyword, page, load])

  function handleFilterChange(setter, value) {
    setter(value)
    setPage(0)
  }

  function resetFilters() {
    setStatus(''); setType(''); setCareerLevel(''); setJobCategory('')
    setPage(0)
  }

  const activeFilters = [
    status && STATUSES.find(s => s.value === status)?.label,
    type && TYPES.find(t => t.value === type)?.label,
    careerLevel && CAREER_LEVELS.find(c => c.value === careerLevel)?.label,
    jobCategory && JOB_ROLES.find(j => j.value === jobCategory)?.label,
  ].filter(Boolean)
  const hasFilter = activeFilters.length > 0

  function handleSearch(e) {
    e.preventDefault()
    setKeyword(inputValue)
    setPage(0)
  }

  function handleInputChange(e) {
    const val = e.target.value
    setInputValue(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setKeyword(val)
      setPage(0)
    }, 400)
  }



  return (
    <div className="container">
      <div className="community-header">
        <div>
          <h1 className="community-title">포폴 · 이력서 검토</h1>
          <p className="community-desc">포트폴리오나 이력서 피드백을 요청해보세요.</p>
        </div>
        <Link to="/reviews/new" className="btn btn-accent">검토 요청하기</Link>
      </div>

      {/* 검색창 */}
      <div className="review-search-wrap">
        <svg className="review-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="review-search-input"
          placeholder="제목 또는 작성자 검색"
          value={inputValue}
          onChange={handleInputChange}
        />
      </div>

      <div ref={filterRef}>
      {/* 필터 토글 바 */}
      <div className="review-filter-toggle-bar">
        <button
          className={`review-filter-toggle-btn${hasFilter ? ' has-filter' : ''}`}
          onClick={() => setFilterOpen(o => !o)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          필터
          {hasFilter && <span className="review-filter-count">{activeFilters.length}</span>}
          <span className="review-filter-toggle-arrow">{filterOpen ? '▴' : '▾'}</span>
        </button>
        {hasFilter && (
          <div className="review-active-filters">
            {activeFilters.map(f => (
              <span key={f} className="review-active-chip">{f}</span>
            ))}
            <button className="review-filter-reset" onClick={resetFilters}>초기화</button>
          </div>
        )}
      </div>

      {/* 필터 패널 */}
      {filterOpen && (
        <div className="review-filter-panel">
          <div className="review-filter-row">
            <span className="review-filter-label">상태</span>
            <div className="review-chip-group">
              {STATUSES.map(s => (
                <button key={s.value} className={`review-chip${status === s.value ? ' active' : ''}`} onClick={() => handleFilterChange(setStatus, s.value)}>{s.label}</button>
              ))}
            </div>
          </div>
          <div className="review-filter-row">
            <span className="review-filter-label">종류</span>
            <div className="review-chip-group">
              {TYPES.map(t => (
                <button key={t.value} className={`review-chip${type === t.value ? ' active' : ''}`} onClick={() => handleFilterChange(setType, t.value)}>{t.label}</button>
              ))}
            </div>
          </div>
          <div className="review-filter-row">
            <span className="review-filter-label">경력</span>
            <div className="review-chip-group">
              {CAREER_LEVELS.map(c => (
                <button key={c.value} className={`review-chip${careerLevel === c.value ? ' active' : ''}`} onClick={() => handleFilterChange(setCareerLevel, c.value)}>{c.label}</button>
              ))}
            </div>
          </div>
          <div className="review-filter-row">
            <span className="review-filter-label">직군</span>
            <div className="review-chip-group">
              <button className={`review-chip${jobCategory === '' ? ' active' : ''}`} onClick={() => handleFilterChange(setJobCategory, '')}>전체</button>
              {JOB_ROLES.map(j => (
                <button key={j.value} className={`review-chip${jobCategory === j.value ? ' active' : ''}`} onClick={() => handleFilterChange(setJobCategory, j.value)}>{j.label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="review-filter-reset" onClick={resetFilters}>초기화</button>
          </div>
        </div>
      )}
      </div>

      <div className="section-sm" style={{ paddingTop: 8 }}>
        {loading ? (
          <p className="text-muted">로딩 중...</p>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>게시글이 없습니다</h3>
            <p>첫 번째 검토 요청을 작성해보세요!</p>
            <Link to="/reviews/new" className="btn btn-accent">검토 요청하기</Link>
          </div>
        ) : (
          <div className="post-list">
            {reviews.map(r => (
              <Link key={r.id} to={`/reviews/${r.id}`} className="post-row">
                <div className="post-row-left">
                  <span className={`post-cat-badge ${r.type}`}>{r.typeDisplayName}</span>
                  <span className={`post-cat-badge ${r.status}`}>{r.statusDisplayName}</span>
                  <span className="post-title">
                    <span style={{ color: 'var(--text-3)', marginRight: 4 }}>
                      [{r.careerLevelDisplayName}·{r.jobCategoryDisplayName}]
                    </span>
                    {r.title}
                  </span>
                  {r.commentCount > 0 && (
                    <span className="post-comment-count">[{r.commentCount}]</span>
                  )}
                </div>
                <div className="post-row-right">
                  <span className="post-author">{r.authorName}</span>
                  {r.viewCount != null && <span>조회 {r.viewCount}</span>}
                  <span>{formatDate(r.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>이전</button>
            <span className="page-info">{page + 1} / {totalPages}</span>
            <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>다음</button>
          </div>
        )}
      </div>
    </div>
  )
}
