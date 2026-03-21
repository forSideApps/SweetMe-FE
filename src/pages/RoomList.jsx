import { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getRoomsByTheme } from '../api/rooms'
import { getThemes } from '../api/themes'
import ThemeLogo from '../components/ThemeLogo'

const JOB_ROLES = [
  { value: '', label: '전체 직군' },
  { value: 'BACKEND', label: '백엔드' },
  { value: 'FRONTEND', label: '프론트엔드' },
  { value: 'FULLSTACK', label: '풀스택' },
  { value: 'MOBILE', label: '모바일' },
  { value: 'AI_ML', label: 'AI/ML' },
  { value: 'DATA', label: '데이터' },
  { value: 'DEVOPS', label: 'DevOps/인프라' },
  { value: 'SECURITY', label: '보안' },
  { value: 'EMBEDDED', label: '임베디드' },
  { value: 'OTHER', label: '기타' },
]

function statusBadge(status) {
  if (status === 'OPEN') return <span className="badge badge-green">모집중</span>
  if (status === 'CLOSED') return <span className="badge badge-gray">마감</span>
  return <span className="badge badge-amber">{status}</span>
}

function formatDate(str) {
  if (!str) return ''
  return str.slice(0, 10)
}

export default function RoomList() {
  const { themeId } = useParams()
  const [theme, setTheme] = useState(null)
  const [rooms, setRooms] = useState([])
  const [status, setStatus] = useState('')
  const [jobRole, setJobRole] = useState('')
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getThemes().then(ts => {
      const found = ts.find(t => String(t.id) === String(themeId))
      setTheme(found || null)
    }).catch(() => {})
  }, [themeId])

  const fetchRooms = useCallback(() => {
    setLoading(true)
    getRoomsByTheme(themeId, status, page, jobRole, keyword)
      .then(data => {
        setRooms(data.content || data)
        setTotalPages(data.totalPages || 1)
      })
      .catch(() => setRooms([]))
      .finally(() => setLoading(false))
  }, [themeId, status, page, jobRole, keyword])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  function handleStatusChange(s) {
    setStatus(s)
    setPage(0)
  }

  function handleJobRoleChange(r) {
    setJobRole(r)
    setPage(0)
  }

  function handleSearch(e) {
    e.preventDefault()
    setKeyword(searchInput.trim())
    setPage(0)
  }

  return (
    <div className="container">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">홈</Link>
          <span>/</span>
          <span>스터디 목록</span>
        </div>
        <div className="page-company">
          {theme && <ThemeLogo logoUrl={theme.logoUrl} slug={theme.slug} size={48} />}
        </div>
        <h1>{theme ? theme.name : '스터디 목록'}</h1>
        {theme?.description && <p>{theme.description}</p>}
      </div>

      <div className="section-sm">
        {/* 검색 */}
        <form className="room-search-form" onSubmit={handleSearch}>
          <input
            className="form-input room-search-input"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="스터디 제목 검색..."
          />
          <button type="submit" className="btn btn-outline">검색</button>
          {keyword && (
            <button type="button" className="btn btn-ghost" onClick={() => { setKeyword(''); setSearchInput(''); setPage(0) }}>
              초기화
            </button>
          )}
        </form>

        {/* 필터 바 */}
        <div className="list-bar">
          <div className="filter-tabs">
            <button className={`filter-tab${status === '' ? ' active' : ''}`} onClick={() => handleStatusChange('')}>전체</button>
            <button className={`filter-tab${status === 'OPEN' ? ' active' : ''}`} onClick={() => handleStatusChange('OPEN')}>모집중</button>
          </div>
          <Link to={`/rooms/new?themeId=${themeId}`} className="btn btn-accent">
            스터디 개설
          </Link>
        </div>

        {/* 직군 필터 */}
        <div className="job-role-tabs">
          {JOB_ROLES.map(r => (
            <button
              key={r.value}
              className={`job-role-tab${jobRole === r.value ? ' active' : ''}`}
              onClick={() => handleJobRoleChange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-muted">로딩 중...</p>
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>스터디가 없습니다</h3>
            <p>첫 번째 스터디를 개설해보세요!</p>
            <Link to={`/rooms/new?themeId=${themeId}`} className="btn btn-accent">스터디 개설하기</Link>
          </div>
        ) : (
          <div className="room-grid">
            {rooms.map(room => (
              <Link key={room.id} to={`/rooms/${room.id}`} className="room-card">
                <div className="room-card-top">
                  <div className="room-company">
                    <ThemeLogo logoUrl={room.themeLogoUrl} slug={room.themeSlug} size={28} />
                    <span>{room.themeName}</span>
                  </div>
                  {statusBadge(room.status)}
                </div>
                <div className="room-title">{room.title}</div>
                {room.jobRoleDisplay && (
                  <span className="tag tag-role" style={{ marginBottom: 6 }}>{room.jobRoleDisplay}</span>
                )}
                {room.description && (
                  <div className="room-desc">{room.description.slice(0, 80)}{room.description.length > 80 ? '...' : ''}</div>
                )}
                <div className="room-footer">
                  <span>👤 {room.creatorNickname}</span>
                  <span>👥 {room.approvedCount ?? 0}/{room.maxMembers ?? '?'}명
                    {room.pendingCount > 0 && ` (대기 ${room.pendingCount})`}
                  </span>
                  <span>📅 {formatDate(room.createdAt)}</span>
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
