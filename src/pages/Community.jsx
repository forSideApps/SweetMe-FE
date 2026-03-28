import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPosts } from '../api/community'
import { getMe } from '../api/auth'
import { formatDate } from '../utils/date'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import { useDebounce } from '../hooks/useDebounce'

const CATEGORIES = [
  { value: '', label: '전체' },
  { value: 'NOTICE', label: '공지사항' },
  { value: 'FREE', label: '자유게시판' },
  { value: 'SUGGESTION', label: '건의 기능 요청' },
  { value: 'COMPANY_SCHEDULE', label: '채용 발표일' },
]

const STAGE_COLS = ['서류', '코테', '면접']

function extractCompany(post) {
  const match = post.content?.match(/🏢 기업명: (.+)/)
  return match ? match[1].trim() : post.title.split(' ')[0]
}
function extractStage(post) {
  const match = post.content?.match(/🎯 전형 단계: (.+)/)
  return match ? match[1].trim() : ''
}
function extractDate(post) {
  const match = post.content?.match(/📅 결과 공개: (.+)/)
  return match ? match[1].trim() : ''
}
function extractYear(post) {
  const match = post.content?.match(/📅 결과 공개: (\d+)년/)
  if (match) return parseInt(match[1])
  return new Date(post.createdAt).getFullYear()
}
function extractHireType(post) {
  const match = post.content?.match(/📋 채용 유형: (.+)/)
  return match ? match[1].trim() : ''
}
function getStageCol(stage) {
  if (!stage) return null
  if (stage === '서류') return '서류'
  if (stage === '코딩테스트') return '코테'
  return '면접'
}

function parseScheduleDate(dateStr) {
  // "2026년 5월 4일 (월) 15:00"
  if (!dateStr) return { date: null, time: null }
  const m = dateStr.match(/(\d+)년\s*(\d+)월\s*(\d+)일\s*\(([^)]+)\)(?:\s*(\d{1,2}:\d{2}))?/)
  if (!m) return { date: dateStr, time: null }
  const [, year, month, day, weekday, time] = m
  return {
    date: `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')} (${weekday})`,
    time: time || null,
  }
}

function buildMatrixData(posts) {
  const data = {}
  for (const post of posts) {
    const company = extractCompany(post)
    const year = extractYear(post)
    const stage = extractStage(post)
    const col = getStageCol(stage)
    if (!col) continue
    if (!data[company]) data[company] = {}
    if (!data[company][year]) data[company][year] = { 서류: [], 코테: [], 면접: [] }
    data[company][year][col].push(post)
  }
  return data
}

function ScheduleMatrix({ yearData }) {
  const years = Object.keys(yearData).map(Number).sort((a, b) => b - a)
  return (
    <div className="smt-wrap">
      <table className="smt-table">
        <thead>
          <tr>
            <th className="smt-th smt-year-th">연도</th>
            {STAGE_COLS.map(col => (
              <th key={col} className="smt-th">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {years.map(year => (
            <tr key={year} className="smt-row">
              <td className="smt-td smt-year-td">{year}</td>
              {STAGE_COLS.map(col => (
                <td key={col} className="smt-td smt-data-td">
                  {yearData[year][col].length > 0 ? (
                    yearData[year][col].map(post => {
                      const { date, time } = parseScheduleDate(extractDate(post))
                      const hireType = extractHireType(post)
                      return (
                        <Link key={post.id} to={`/community/${post.id}`} className="smt-entry">
                          <span className="smt-entry-stage">{extractStage(post)}</span>
                          <div className="smt-chips">
                            {date && <span className="smt-chip smt-chip-date">📅 {date}</span>}
                            {time && <span className="smt-chip smt-chip-time">🕐 {time}</span>}
                          </div>
                          {hireType && <span className="smt-entry-hire">{hireType}</span>}
                        </Link>
                      )
                    })
                  ) : (
                    <span className="smt-empty">-</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Community() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [openCompany, setOpenCompany] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const debounce = useDebounce(400)

  useEffect(() => {
    getMe().then(data => { if (data.role === 'ADMIN') setIsAdmin(true) }).catch(() => {})
  }, [])

  const category = searchParams.get('category') || ''
  const keyword = searchParams.get('keyword') || ''
  const page = parseInt(searchParams.get('page') || '0', 10)
  const [inputValue, setInputValue] = useState(keyword)

  const isSchedule = category === 'COMPANY_SCHEDULE'

  useEffect(() => {
    setLoading(true)
    setOpenCompany(null)
    const size = isSchedule ? 500 : undefined
    getPosts(category, keyword, page, size)
      .then(data => {
        setPosts(data.content || data)
        setTotalPages(data.totalPages || 1)
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [category, keyword, page])

  function handleCategoryChange(c) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (c) next.set('category', c)
      else next.delete('category')
      next.delete('page')
      return next
    }, { replace: true })
  }

  function handleInputChange(e) {
    const val = e.target.value
    setInputValue(val)
    debounce(() => setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (val) next.set('keyword', val)
      else next.delete('keyword')
      next.delete('page')
      return next
    }, { replace: true }))
  }

  function handlePageChange(newPage) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (newPage > 0) next.set('page', String(newPage))
      else next.delete('page')
      return next
    }, { replace: true })
  }

  const matrixData = isSchedule ? buildMatrixData(posts) : {}
  const companies = Object.keys(matrixData).sort()

  return (
    <div className="container">
      <div className="community-header">
        <div>
          <h1 className="community-title">커뮤니티</h1>
          <p className="community-desc">스터디원들과 정보를 나눠보세요.</p>
        </div>
        {(category !== 'NOTICE' && category !== 'COMPANY_SCHEDULE') && (
          <Link
            to={category ? `/community/new?prefillCategory=${category}` : '/community/new'}
            className="btn btn-accent"
          >글쓰기</Link>
        )}
        {(category === 'NOTICE' || category === 'COMPANY_SCHEDULE') && isAdmin && (
          <Link
            to={`/community/new?prefillCategory=${category}`}
            className="btn btn-accent"
          >글쓰기</Link>
        )}
      </div>

      <div className="review-search-wrap">
        <svg className="review-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="review-search-input"
          placeholder="제목 검색"
          value={inputValue}
          onChange={handleInputChange}
        />
      </div>

      <div className="community-tabs-wrap">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            className={`comm-tab${category === c.value ? ' active' : ''}`}
            onClick={() => handleCategoryChange(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="section-sm" style={{ paddingTop: 8 }}>
        {loading ? (
          <p className="text-muted">로딩 중...</p>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={isSchedule ? '📅' : '✍️'}
            title="게시글이 없습니다"
            description={isSchedule ? '서류·코테·면접 발표 일정을 공유해보세요!' : '첫 번째 글을 작성해보세요!'}
            actionLabel={(category !== 'NOTICE' && category !== 'COMPANY_SCHEDULE') || isAdmin ? '글쓰기' : undefined}
            actionTo={(category !== 'NOTICE' && category !== 'COMPANY_SCHEDULE') || isAdmin ? (category ? `/community/new?prefillCategory=${category}` : '/community/new') : undefined}
          />
        ) : isSchedule ? (
          <div className="sca-list">
            {companies.map(company => {
              const yearData = matrixData[company]
              const totalCount = Object.values(yearData)
                .reduce((sum, yr) => sum + Object.values(yr).flat().length, 0)
              const isOpen = openCompany === company
              return (
                <div key={company} className="sca-item">
                  <button
                    className={`sca-btn${isOpen ? ' open' : ''}`}
                    onClick={() => setOpenCompany(isOpen ? null : company)}
                  >
                    <span className="sca-company-name">{company}</span>
                    <span className="sca-meta">
                      <span className="sca-count">{totalCount}건</span>
                      <svg className={`sca-arrow${isOpen ? ' open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </span>
                  </button>
                  {isOpen && <ScheduleMatrix yearData={yearData} />}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="post-list">
            {posts.map(post => (
              <Link key={post.id} to={`/community/${post.id}`} className="post-row">
                <div className="post-row-left">
                  <span className={`post-cat-badge ${post.category}`}>
                    {CATEGORIES.find(c => c.value === post.category)?.label || post.category}
                  </span>
                  <span className="post-title">{post.title}</span>
                  {post.commentCount > 0 && (
                    <span className="post-comment-count">[{post.commentCount}]</span>
                  )}
                </div>
                <div className="post-row-right">
                  <span className="post-author">{post.memberUsername === 'admin' && <span style={{ marginRight: 3 }}>👑</span>}{post.authorName}</span>
                  {post.viewCount != null && <span>조회 {post.viewCount}</span>}
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isSchedule && (
          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
      </div>
    </div>
  )
}
