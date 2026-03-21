import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getReviews } from '../api/review'
import { JOB_ROLES } from '../constants/jobRoles'
import { formatDate } from '../utils/date'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'

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

export default function Review() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [reviews, setReviews] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const debounceRef = useRef(null)
  const filterRef = useRef(null)

  const type = searchParams.get('type') || ''
  const status = searchParams.get('status') || ''
  const jobCategory = searchParams.get('jobCategory') || ''
  const careerLevel = searchParams.get('careerLevel') || ''
  const keyword = searchParams.get('keyword') || ''
  const page = parseInt(searchParams.get('page') || '0', 10)
  const [inputValue, setInputValue] = useState(keyword)

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

  useEffect(() => () => clearTimeout(debounceRef.current), [])

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

  function updateParam(key, value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      next.delete('page')
      return next
    }, { replace: true })
  }

  function handlePageChange(newPage) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (newPage > 0) next.set('page', String(newPage))
      else next.delete('page')
      return next
    }, { replace: true })
  }

  function handleInputChange(e) {
    const val = e.target.value
    setInputValue(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParam('keyword', val)
    }, 400)
  }

  const activeCount = [status, type, careerLevel, jobCategory].filter(Boolean).length
  const activeLabels = [
    status && STATUSES.find(s => s.value === status)?.label,
    type && TYPES.find(t => t.value === type)?.label,
    careerLevel && CAREER_LEVELS.find(c => c.value === careerLevel)?.label,
    jobCategory && JOB_ROLES.find(j => j.value === jobCategory)?.label,
  ].filter(Boolean)

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

      {/* 필터 토글 */}
      <div ref={filterRef} style={{ marginBottom: 16 }}>
        <div className="review-filter-toggle-bar">
          <button
            className={`review-filter-toggle-btn${activeCount > 0 ? ' has-filter' : ''}`}
            onClick={() => setFilterOpen(o => !o)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            필터
            {activeCount > 0 && <span className="review-filter-count">{activeCount}</span>}
            <span className="review-filter-toggle-arrow">{filterOpen ? '▴' : '▾'}</span>
          </button>
          {activeLabels.length > 0 && (
            <div className="review-active-filters">
              {activeLabels.map(l => (
                <span key={l} className="review-active-chip">{l}</span>
              ))}
            </div>
          )}
        </div>

        {filterOpen && (
          <div className="review-filter-panel">
            {/* 상태 */}
            <div className="filter-tabs" style={{ marginBottom: 8 }}>
              {STATUSES.map(s => (
                <button key={s.value} className={`filter-tab${status === s.value ? ' active' : ''}`} onClick={() => updateParam('status', s.value)}>{s.label}</button>
              ))}
            </div>
            {/* 종류 */}
            <div className="filter-tabs" style={{ marginBottom: 8 }}>
              {TYPES.map(t => (
                <button key={t.value} className={`filter-tab${type === t.value ? ' active' : ''}`} onClick={() => updateParam('type', t.value)}>{t.label}</button>
              ))}
            </div>
            {/* 경력 */}
            <div className="filter-tabs" style={{ marginBottom: 8 }}>
              {CAREER_LEVELS.map(c => (
                <button key={c.value} className={`filter-tab${careerLevel === c.value ? ' active' : ''}`} onClick={() => updateParam('careerLevel', c.value)}>{c.label}</button>
              ))}
            </div>
            {/* 직군 */}
            <div className="filter-tabs" style={{ flexWrap: 'wrap', gap: 6 }}>
              <button className={`filter-tab${jobCategory === '' ? ' active' : ''}`} onClick={() => updateParam('jobCategory', '')}>전체</button>
              {JOB_ROLES.map(j => (
                <button key={j.value} className={`filter-tab${jobCategory === j.value ? ' active' : ''}`} onClick={() => updateParam('jobCategory', j.value)}>{j.label}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ paddingTop: 8 }}>
        {loading ? (
          <p className="text-muted">로딩 중...</p>
        ) : reviews.length === 0 ? (
          <EmptyState icon="📄" title="게시글이 없습니다" description="첫 번째 검토 요청을 작성해보세요!" actionLabel="검토 요청하기" actionTo="/reviews/new" />
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

        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>
    </div>
  )
}
