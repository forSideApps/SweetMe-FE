import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getReviews } from '../api/review'
import { JOB_ROLES } from '../constants/jobRoles'

const TYPES = [
  { value: '', label: '전체' },
  { value: 'PORTFOLIO', label: '포트폴리오' },
  { value: 'RESUME', label: '이력서' },
]
const CAREER_LEVELS = [
  { value: '', label: '전체 경력' },
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
  const [jobCategory, setJobCategory] = useState('')
  const [careerLevel, setCareerLevel] = useState('')
  const [keyword, setKeyword] = useState('')
  const [inputValue, setInputValue] = useState('')
  const debounceRef = useRef(null)

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
    load({ type, jobCategory, careerLevel, keyword, page })
  }, [type, jobCategory, careerLevel, keyword, page, load])

  function handleFilterChange(setter, value) {
    setter(value)
    setPage(0)
  }

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

      {/* 필터 바: 타입 탭 + 경력/직군 */}
      <div className="review-filter-bar">
        {TYPES.map(t => (
          <button
            key={t.value}
            className={`comm-tab${type === t.value ? ' active' : ''}`}
            onClick={() => handleFilterChange(setType, t.value)}
          >
            {t.label}
          </button>
        ))}
        <div className="review-filter-spacer" />
        <div className="review-filter-selects">
          <div className="filter-pill-wrap">
            <select
              className={`filter-pill-select${careerLevel ? ' active' : ''}`}
              value={careerLevel}
              onChange={e => handleFilterChange(setCareerLevel, e.target.value)}
            >
              {CAREER_LEVELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <span className="filter-pill-chevron">▾</span>
          </div>
          <div className="filter-pill-wrap">
            <select
              className={`filter-pill-select${jobCategory ? ' active' : ''}`}
              value={jobCategory}
              onChange={e => handleFilterChange(setJobCategory, e.target.value)}
            >
              <option value="">전체 직군</option>
              {JOB_ROLES.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
            </select>
            <span className="filter-pill-chevron">▾</span>
          </div>
        </div>
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
